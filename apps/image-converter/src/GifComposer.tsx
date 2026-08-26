import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { FilePicker } from "./FilePicker";
import { SelectMenu } from "./SelectMenu";
import { ACCEPT_ATTRIBUTE, encodeCanvasToBlob, getFileExtension, isAcceptedImage, outputMime, sanitizeSvg } from "./lib/convert";
import { triggerDownload } from "./lib/download";
import { encodeGif, type GifFrame } from "./lib/gif";
import { decodeGifFile, inspectGif, scaleDelays, selectFrames, scaledFrames, type DecodedGifInfo } from "./lib/gif-decode";
import type { OutputDraft } from "./lib/output-registry";

type SourceFrame = { id: string; file: File; url: string };

async function decodeFile(file: File): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
  const blob = getFileExtension(file.name) === "svg" ? new Blob([sanitizeSvg(await file.text())], { type: "image/svg+xml" }) : file;
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
      return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch {
      // Some browser decoders support a format only through HTMLImageElement.
    }
  }
  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("decode-failed")); image.src = url; });
    return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

export function GifComposer({ hidden, incoming, onOutput }: { hidden?: boolean; incoming?: { id: number; files: File[]; intent?: "compose" | "extract" | "speed" | "compress" }; onOutput?: (drafts: OutputDraft[]) => unknown }) {
  const { t } = useTranslation();
  const [frames, setFrames] = useState<SourceFrame[]>([]);
  const [width, setWidth] = useState(640);
  const [height, setHeight] = useState(480);
  const [delay, setDelay] = useState(300);
  const [loop, setLoop] = useState(0);
  const [background, setBackground] = useState("#ffffff");
  const [result, setResult] = useState<{ blob: Blob; url: string } | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gifSourceFile, setGifSource] = useState<File | null>(null);
  const [sourceInfo, setSourceInfo] = useState<DecodedGifInfo | null>(null);
  const [speedFactor, setSpeedFactor] = useState("2");
  const [scalePercent, setScalePercent] = useState("50");
  const [frameStep, setFrameStep] = useState("2");
  const [toolsBusy, setToolsBusy] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const framesRef = useRef(frames);
  const resultRef = useRef(result);
  const incomingRef = useRef<number | null>(null);
  framesRef.current = frames;
  resultRef.current = result;
  useEffect(() => () => {
    for (const frame of framesRef.current) URL.revokeObjectURL(frame.url);
    if (resultRef.current) URL.revokeObjectURL(resultRef.current.url);
  }, []);

  const totalPixels = width * height * frames.length;
  const canGenerate = frames.length >= 2 && width > 0 && height > 0 && width <= 4096 && height <= 4096 && totalPixels <= 100_000_000;
  const duration = useMemo(() => frames.length * delay / 1000, [frames.length, delay]);

  const appendFiles = useCallback((files: File[]) => {
    const accepted = files.filter(isAcceptedImage).slice(0, Math.max(0, 100 - framesRef.current.length));
    const stamp = Date.now();
    setFrames((current) => [...current, ...accepted.map((file, index) => ({ id: `${stamp}-${index}`, file, url: URL.createObjectURL(file) }))]);
    setError(accepted.length ? null : t("gif.noAccepted"));
  }, [t]);

  useEffect(() => {
    if (!incoming || incomingRef.current === incoming.id) return;
    incomingRef.current = incoming.id;
    const gifFiles = incoming.files.filter((file) => getFileExtension(file.name) === "gif");
    const stills = incoming.files.filter((file) => getFileExtension(file.name) !== "gif");
    const toSource = gifFiles.length && incoming.intent && incoming.intent !== "compose";
    if (toSource) setGifSource(gifFiles[0]);
    else if (gifFiles.length) appendFiles(gifFiles);
    if (stills.length) appendFiles(stills);
  }, [appendFiles, incoming]);

  const add = (event: ChangeEvent<HTMLInputElement>) => {
    appendFiles([...event.target.files ?? []]);
    event.target.value = "";
  };
  const move = (index: number, offset: number) => setFrames((current) => {
    const next = [...current];
    const target = index + offset;
    if (target < 0 || target >= next.length) return current;
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  });
  const remove = (id: string) => setFrames((current) => current.filter((frame) => {
    if (frame.id !== id) return true;
    URL.revokeObjectURL(frame.url);
    return false;
  }));
  const clear = () => {
    for (const frame of frames) URL.revokeObjectURL(frame.url);
    setFrames([]);
    if (result) URL.revokeObjectURL(result.url);
    setResult(null); setError(null);
  };

  const generate = async () => {
    if (!canGenerate) return;
    setRunning(true); setError(null);
    try {
      const encodedFrames: GifFrame[] = [];
      for (const frame of frames) {
        const decoded = await decodeFile(frame.file);
        try {
          const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
          const context = canvas.getContext("2d", { willReadFrequently: true });
          if (!context) throw new Error("canvas-unavailable");
          context.fillStyle = background; context.fillRect(0, 0, width, height);
          const scale = Math.min(width / decoded.width, height / decoded.height);
          const drawWidth = Math.max(1, Math.round(decoded.width * scale));
          const drawHeight = Math.max(1, Math.round(decoded.height * scale));
          context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
          context.drawImage(decoded.image, Math.round((width - drawWidth) / 2), Math.round((height - drawHeight) / 2), drawWidth, drawHeight);
          encodedFrames.push({ rgba: context.getImageData(0, 0, width, height).data, width, height, delayMs: delay });
        } finally { decoded.close(); }
      }
      const blob = encodeGif(encodedFrames, { loop });
      if (result) URL.revokeObjectURL(result.url);
      setResult({ blob, url: URL.createObjectURL(blob) });
      onOutput?.([{ blob, name: "formtran-animation.gif", sourceName: frames[0]?.file.name, family: "gif", tool: "gif" }]);
    } catch (caught) {
      const key = caught instanceof Error ? caught.message : "unknown";
      setError(t(`gif.errors.${key}`) === `gif.errors.${key}` ? t("gif.errors.unknown") : t(`gif.errors.${key}`));
    } finally { setRunning(false); }
  };

  const loadGifSource = async (file: File) => {
    setToolsError(null);
    setGifSource(file);
    setSourceInfo(null);
    try {
      setSourceInfo(await inspectGif(file));
    } catch (caught) {
      setToolsError(gifToolErrorText(caught, t));
      setGifSource(null);
    }
  };

  const publishMany = (drafts: OutputDraft[]) => {
    if (drafts.length) onOutput?.(drafts);
    return drafts.length;
  };

  const runExtract = async () => {
    if (!gifSourceFile || toolsBusy) return;
    setToolsBusy(true); setToolsError(null);
    try {
      const decoded = await decodeGifFile(gifSourceFile);
      const stem = outputStemName(gifSourceFile.name);
      const drafts: OutputDraft[] = [];
      for (let index = 0; index < decoded.frames.length; index += 1) {
        const canvas = document.createElement("canvas");
        canvas.width = decoded.width; canvas.height = decoded.height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("canvas-unavailable");
        context.putImageData(new ImageData(decoded.frames[index].rgba, decoded.width, decoded.height), 0, 0);
        const blob = await encodeCanvasToBlob(canvas, outputMime("png"), 1);
        drafts.push({ blob, name: `${stem}-frame-${String(index + 1).padStart(2, "0")}.png`, sourceName: gifSourceFile.name, family: "gif", tool: "gif" });
      }
      const added = publishMany(drafts);
      setToolsError(added ? null : t("gifTools.errors.publishLimit"));
    } catch (caught) {
      setToolsError(gifToolErrorText(caught, t));
    } finally { setToolsBusy(false); }
  };

  const runSpeed = async () => {
    if (!gifSourceFile || toolsBusy) return;
    setToolsBusy(true); setToolsError(null);
    try {
      const decoded = await decodeGifFile(gifSourceFile);
      const factor = Number(speedFactor);
      const blob = encodeGif(scaleDelays(decoded.frames as GifFrame[], factor), { loop: 0 });
      const name = `${outputStemName(gifSourceFile.name)}-speed-${factor}x.gif`;
      onOutput?.([{ blob, name, sourceName: gifSourceFile.name, family: "gif", tool: "gif" }]);
    } catch (caught) {
      setToolsError(gifToolErrorText(caught, t));
    } finally { setToolsBusy(false); }
  };

  const runCompress = async () => {
    if (!gifSourceFile || toolsBusy) return;
    setToolsBusy(true); setToolsError(null);
    try {
      const percent = Number(scalePercent);
      const step = Number(frameStep);
      const decoded = await decodeGifFile(gifSourceFile);
      const frames = scaledFrames(selectFrames(decoded.frames as GifFrame[], step), decoded.width, decoded.height, percent / 100);
      const blob = encodeGif(frames, { loop: 0 });
      const name = `${outputStemName(gifSourceFile.name)}-scaled-${percent}.gif`;
      onOutput?.([{ blob, name, sourceName: gifSourceFile.name, family: "gif", tool: "gif" }]);
    } catch (caught) {
      setToolsError(gifToolErrorText(caught, t));
    } finally { setToolsBusy(false); }
  };

  return <section className="tool-page gif-page" role="tabpanel" id="panel-gif" aria-labelledby="tab-gif" hidden={hidden}>
    <div className="tool-intro"><div><span className="eyebrow">GIF89a · LOCAL ENCODING</span><h2>{t("gif.title")}</h2><p>{t("gif.intro")}</p></div><span className="step-chip">{t("gif.step", { current: frames.length ? result ? 3 : 2 : 1 })}</span></div>
    <div className="gif-workbench">
      <section className="gif-sources">
        <div className="section-heading"><div><h3>{t("gif.frames")}</h3><p>{t("gif.framesHint")}</p></div><div className="section-actions">{frames.length > 0 && <button className="text-button" type="button" onClick={clear}>{t("gif.clear")}</button>}<FilePicker label={t("gif.add")} accept={ACCEPT_ATTRIBUTE} multiple onChange={add}/></div></div>
        {!frames.length ? <div className="compact-empty"><span>▧</span><p>{t("gif.empty")}</p></div> : <div className="frame-strip">{frames.map((frame, index) => <article key={frame.id}><img src={frame.url} alt=""/><div><strong>{index + 1}. {frame.file.name}</strong><small>{t("gif.frameDelay", { delay })}</small></div><div><button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={t("gif.moveEarlier")}>↑</button><button type="button" disabled={index === frames.length - 1} onClick={() => move(index, 1)} aria-label={t("gif.moveLater")}>↓</button><button type="button" onClick={() => remove(frame.id)} aria-label={`${t("gif.remove")} ${frame.file.name}`}>×</button></div></article>)}</div>}
      </section>
      <section className="gif-settings">
        <div className="section-heading"><div><h3>{t("gif.settings")}</h3><p>{t("gif.settingsHint")}</p></div></div>
        <div className="field-pair"><label className="field"><span className="field-label">{t("gif.width")}</span><input type="number" min="1" max="4096" value={width} onChange={(event) => setWidth(Number(event.target.value))}/></label><label className="field"><span className="field-label">{t("gif.height")}</span><input type="number" min="1" max="4096" value={height} onChange={(event) => setHeight(Number(event.target.value))}/></label></div>
        <label className="field"><span className="field-label">{t("gif.delay")}</span><div className="range-row"><input type="range" min="20" max="3000" step="10" value={delay} onChange={(event) => setDelay(Number(event.target.value))}/><output>{delay} ms</output></div></label>
        <div className="field-pair"><label className="field"><span className="field-label">{t("gif.loop")}</span><input type="number" min="0" max="65535" value={loop} onChange={(event) => setLoop(Number(event.target.value))}/><small>{t("gif.loopHint")}</small></label><label className="field"><span className="field-label">{t("gif.background")}</span><div className="color-row"><input type="color" value={background} onChange={(event) => setBackground(event.target.value)}/><input value={background} onChange={(event) => /^#[\da-f]{6}$/i.test(event.target.value) && setBackground(event.target.value)}/></div></label></div>
        <div className="gif-summary"><span>{t("gif.summaryFrames", { count: frames.length })}</span><span>{width} × {height}</span><span>{duration.toFixed(1)} s</span></div>
        {!canGenerate && frames.length >= 2 && <p className="field-error">{t("gif.limit")}</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="button primary" type="button" disabled={!canGenerate || running} onClick={generate}>{running ? t("gif.generating") : t("gif.generate")}</button>
      </section>
    </div>
    {result && <section className="gif-result"><div className="section-heading"><div><span className="eyebrow">{t("gif.resultReady")}</span><h3>{t("gif.preview")}</h3><p>{t("gif.resultMeta", { size: formatBytes(result.blob.size), duration: duration.toFixed(1) })}</p></div><button className="button secondary" type="button" onClick={() => triggerDownload(result.blob, "formtran-animation.gif")}>{t("gif.download")}</button></div><div><img src={result.url} alt={t("gif.previewAlt")}/></div></section>}

    <section className="gif-tools">
      <div className="section-heading"><div><h3>{t("gifTools.title")}</h3><p>{t("gifTools.intro")}</p></div>{gifSourceFile && <button className="text-button" type="button" onClick={() => { setGifSource(null); setSourceInfo(null); setToolsError(null); }}>{t("gifTools.clear")}</button>}</div>
      <div className="gif-tools-body">
        <div className="gif-tools-source">
          <FilePicker label={t("gifTools.load")} accept=".gif" onChange={(event: ChangeEvent<HTMLInputElement>) => { const next = event.target.files?.[0]; if (next) void loadGifSource(next); event.target.value = ""; }}/>
          {sourceInfo && <p className="gif-tools-info">{t("gifTools.loaded", { frames: sourceInfo.frameCount, width: sourceInfo.width, height: sourceInfo.height, seconds: (sourceInfo.totalMs / 1000).toFixed(1) })}</p>}
          {!gifSourceFile && <p className="gif-tools-info">{t("gifTools.empty")}</p>}
          {toolsError && <p className="field-error" role="alert">{toolsError}</p>}
        </div>
        <article className="gif-tool-card"><header><strong>{t("gifTools.extractTitle")}</strong><p>{t("gifTools.extractDetail")}</p></header><button className="button secondary compact" type="button" disabled={!gifSourceFile || !sourceInfo || toolsBusy} onClick={() => void runExtract()}>{toolsBusy ? t("gifTools.working") : t("gifTools.extractRun")}</button></article>
        <article className="gif-tool-card"><header><strong>{t("gifTools.speedTitle")}</strong><p>{t("gifTools.speedDetail")}</p></header><SelectMenu value={speedFactor} ariaLabel={t("gifTools.speedTitle")} options={[{ value: "0.25", label: "0.25×" }, { value: "0.5", label: "0.5×" }, { value: "2", label: "2×" }, { value: "4", label: "4×" }]} onChange={setSpeedFactor}/><button className="button secondary compact" type="button" disabled={!gifSourceFile || !sourceInfo || toolsBusy} onClick={() => void runSpeed()}>{toolsBusy ? t("gifTools.working") : t("gifTools.speedRun", { factor: speedFactor })}</button></article>
        <article className="gif-tool-card"><header><strong>{t("gifTools.compressTitle")}</strong><p>{t("gifTools.compressDetail")}</p></header><div className="gif-tools-pair"><SelectMenu value={scalePercent} ariaLabel={t("gifTools.scaleLabel")} options={[{ value: "25", label: "25%" }, { value: "50", label: "50%" }, { value: "75", label: "75%" }]} onChange={setScalePercent}/><SelectMenu value={frameStep} ariaLabel={t("gifTools.frameStepLabel")} options={[{ value: "1", label: t("gifTools.keepAll") }, { value: "2", label: "1/2" }, { value: "3", label: "1/3" }]} onChange={setFrameStep}/></div><button className="button secondary compact" type="button" disabled={!gifSourceFile || !sourceInfo || toolsBusy} onClick={() => void runCompress()}>{toolsBusy ? t("gifTools.working") : t("gifTools.compressRun")}</button></article>
      </div>
    </section>
  </section>;
}

function outputStemName(name: string): string {
  return (name.replace(/\.[^.]+$/, "") || "animation").replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120);
}

function gifToolErrorText(caught: unknown, t: (key: string) => string): string {
  const key = caught instanceof Error ? caught.message : "unknown";
  const translated = t(`gifTools.errors.${key}`);
  return translated === `gifTools.errors.${key}` ? t("gifTools.errors.unknown") : translated;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
