import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { FilePicker } from "./FilePicker";
import { ACCEPT_ATTRIBUTE, getFileExtension, isAcceptedImage, sanitizeSvg } from "./lib/convert";
import { triggerDownload } from "./lib/download";
import { encodeGif, type GifFrame } from "./lib/gif";

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

export function GifComposer({ hidden, incoming }: { hidden?: boolean; incoming?: { id: number; files: File[] } }) {
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
    appendFiles(incoming.files);
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
    } catch (caught) {
      const key = caught instanceof Error ? caught.message : "unknown";
      setError(t(`gif.errors.${key}`) === `gif.errors.${key}` ? t("gif.errors.unknown") : t(`gif.errors.${key}`));
    } finally { setRunning(false); }
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
  </section>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
