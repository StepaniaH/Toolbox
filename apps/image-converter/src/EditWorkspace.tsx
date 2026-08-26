import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { FilePicker } from "./FilePicker";
import {
  ACCEPT_ATTRIBUTE, getFileExtension, isAcceptedImage,
} from "./lib/convert";
import {
  CROP_ASPECTS, cropImageFile, normalizeCropOptions, normalizeStitchOptions, stitchImageFiles,
  type CropInset, type CropMode, type CropAspectId, type EditAlign, type StitchDirection,
} from "./lib/edit";
import type { OutputDraft } from "./lib/output-registry";

type SourceImage = { id: string; file: File; url: string };
type EditMode = "crop" | "stitch";

const EDIT_OUTPUT_FORMATS = ["png", "jpeg", "webp"] as const;
type EditOutputFormat = (typeof EDIT_OUTPUT_FORMATS)[number];

export function EditWorkspace({ hidden, incoming, onOutput }: {
  hidden?: boolean;
  incoming?: { id: number; files: File[] };
  onOutput?: (drafts: OutputDraft[]) => unknown;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<EditMode>("crop");
  const [images, setImages] = useState<SourceImage[]>([]);
  const [cropMode, setCropMode] = useState<CropMode>("aspect");
  const [aspectId, setAspectId] = useState<CropAspectId>("1:1");
  const [horizontal, setHorizontal] = useState<EditAlign>("center");
  const [vertical, setVertical] = useState<EditAlign>("center");
  const [inset, setInset] = useState<CropInset>({ top: 0, right: 0, bottom: 0, left: 0 });
  const [direction, setDirection] = useState<StitchDirection>("horizontal");
  const [columns, setColumns] = useState(2);
  const [spacing, setSpacing] = useState(8);
  const [alignment, setAlignment] = useState<EditAlign>("center");
  const [format, setFormat] = useState<EditOutputFormat>("png");
  const [quality, setQuality] = useState(90);
  const [background, setBackground] = useState("#ffffff");
  const [summary, setSummary] = useState<{ ok: number; failed: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imagesRef = useRef(images);
  const incomingRef = useRef<number | null>(null);
  imagesRef.current = images;
  useEffect(() => () => {
    for (const image of imagesRef.current) URL.revokeObjectURL(image.url);
  }, []);

  const appendFiles = useCallback((files: File[]) => {
    const accepted = files.filter(isAcceptedImage).slice(0, Math.max(0, 30 - imagesRef.current.length));
    const stamp = Date.now();
    if (accepted.length) {
      setImages((current) => [...current, ...accepted.map((file) => ({ id: `${stamp}-${file.name}-${file.size}`, file, url: URL.createObjectURL(file) }))]);
      setError(null);
    } else {
      setError(t("edit.errors.noAccepted"));
    }
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
  const remove = (id: string) => setImages((current) => current.filter((image) => {
    if (image.id !== id) return true;
    URL.revokeObjectURL(image.url);
    return false;
  }));
  const clear = () => {
    for (const image of images) URL.revokeObjectURL(image.url);
    setImages([]);
    setSummary(null);
    setError(null);
  };

  const canRun = images.length > 0 && (mode === "crop" || images.length >= 2);

  const run = async () => {
    if (!canRun || running) return;
    setRunning(true);
    setError(null);
    setSummary(null);
    const outputOptions = {
      format,
      quality: Math.min(1, Math.max(0.1, quality / 100)),
      background,
    };
    let ok = 0;
    let failed = 0;
    try {
      if (mode === "crop") {
        const options = normalizeCropOptions({ mode: cropMode, aspectId, horizontal, vertical, inset });
        const drafts: OutputDraft[] = [];
        for (const image of images) {
          try {
            const result = await cropImageFile(image.file, options, outputOptions);
            ok += 1;
            drafts.push({
              blob: result.blob,
              name: `${outputStem(image.file.name)}-crop.${format === "jpeg" ? "jpg" : format}`,
              sourceName: image.file.name,
              family: "image",
              tool: "image",
            });
          } catch {
            failed += 1;
          }
        }
        if (drafts.length) onOutput?.(drafts);
        setSummary({ ok, failed });
        if (!drafts.length && !failed) setError(t("edit.errors.unknown"));
      } else {
        const options = normalizeStitchOptions({ direction, columns, spacing, alignment }, images.length);
        const result = await stitchImageFiles(images.map((image) => image.file), options, outputOptions);
        ok = 1;
        onOutput?.([{
          blob: result.blob,
          name: `formtran-stitched.${format === "jpeg" ? "jpg" : format}`,
          sourceName: images[0]?.file.name,
          family: "image",
          tool: "image",
        }]);
        setSummary({ ok, failed: 0 });
      }
    } catch (caught) {
      const key = caught instanceof Error ? caught.message : "unknown";
      failed += Math.max(failed, 1);
      setError(t(`edit.errors.${key}`) === `edit.errors.${key}` ? t("edit.errors.unknown") : t(`edit.errors.${key}`));
    } finally {
      setRunning(false);
    }
  };

  const alignOptions: EditAlign[] = ["start", "center", "end"];

  return <section className="tool-page edit-page" role="tabpanel" id="panel-edit" aria-labelledby="tab-edit" hidden={hidden}>
    <div className="tool-intro"><div><span className="eyebrow">LOCAL CANVAS EDITOR</span><h2>{t("edit.title")}</h2><p>{t("edit.intro")}</p></div><span className="step-chip">{t("edit.count", { count: images.length })}</span></div>
    <div className="edit-workbench">
      <section className="edit-sources">
        <div className="section-heading"><div><h3>{t("edit.images")}</h3><p>{t(mode === "stitch" ? "edit.imagesHintStitch" : "edit.imagesHintCrop")}</p></div><div className="section-actions">{images.length > 0 && <button className="text-button" type="button" onClick={clear}>{t("edit.clear")}</button>}<FilePicker label={t("edit.add")} accept={ACCEPT_ATTRIBUTE} multiple onChange={add}/></div></div>
        {!images.length ? <div className="compact-empty"><span>▧</span><p>{t("edit.empty")}</p></div> : <div className="edit-source-list">{images.map((image, index) => <article key={image.id}><img src={image.url} alt=""/><div><strong>{index + 1}. {image.file.name}</strong></div><button type="button" onClick={() => remove(image.id)} aria-label={`${t("edit.remove")} ${image.file.name}`}>×</button></article>)}</div>}
      </section>
      <section className="edit-settings">
        <div className="section-heading"><div><h3>{t("edit.settings")}</h3><p>{t("edit.settingsHint")}</p></div></div>
        <fieldset><legend>{t("edit.mode.label")}</legend><div className="segmented">
          <button type="button" aria-pressed={mode === "crop"} className={mode === "crop" ? "active" : ""} onClick={() => setMode("crop")}>{t("edit.mode.crop")}</button>
          <button type="button" aria-pressed={mode === "stitch"} className={mode === "stitch" ? "active" : ""} onClick={() => setMode("stitch")}>{t("edit.mode.stitch")}</button>
        </div></fieldset>

        {mode === "crop" && <>
          <fieldset><legend>{t("edit.crop.aspect")}</legend><div className="segmented">
            {CROP_ASPECTS.map((id) => <button type="button" key={id} aria-pressed={cropMode === "aspect" && aspectId === id} disabled={cropMode === "inset"} className={cropMode === "aspect" && aspectId === id ? "active" : ""} onClick={() => setAspectId(id)}>{id === "original" ? t("edit.crop.original") : id}</button>)}
          </div></fieldset>
          <div className="segmented" role="group" aria-label={t("edit.crop.mode")}>
            <button type="button" aria-pressed={cropMode === "aspect"} className={cropMode === "aspect" ? "active" : ""} onClick={() => setCropMode("aspect")}>{t("edit.crop.modeAspect")}</button>
            <button type="button" aria-pressed={cropMode === "inset"} className={cropMode === "inset" ? "active" : ""} onClick={() => setCropMode("inset")}>{t("edit.crop.modeInset")}</button>
          </div>
          {cropMode === "aspect" ? <div className="field-pair">
            <label className="field"><span className="field-label">{t("edit.crop.horizontal")}</span><select value={horizontal} onChange={(event) => setHorizontal(event.target.value as EditAlign)}>{alignOptions.map((option) => <option key={option} value={option}>{t(`edit.align.${option}`)}</option>)}</select></label>
            <label className="field"><span className="field-label">{t("edit.crop.vertical")}</span><select value={vertical} onChange={(event) => setVertical(event.target.value as EditAlign)}>{alignOptions.map((option) => <option key={option} value={option}>{t(`edit.align.${option}`)}</option>)}</select></label>
          </div> : <div className="field-pair">
            {(["top", "right", "bottom", "left"] as const).map((side) => <label className="field" key={side}><span className="field-label">{t(`edit.crop.inset.${side}`)} %</span><input type="number" min="0" max="80" value={inset[side]} onChange={(event) => setInset((current) => ({ ...current, [side]: Math.min(80, Math.max(0, Number(event.target.value) || 0)) }))}/></label>)}
          </div>}
        </>}

        {mode === "stitch" && <>
          <fieldset><legend>{t("edit.stitch.direction")}</legend><div className="segmented">
            {(["horizontal", "vertical", "grid"] as const).map((option) => <button type="button" key={option} aria-pressed={direction === option} className={direction === option ? "active" : ""} onClick={() => setDirection(option)}>{t(`edit.stitch.${option}`)}</button>)}
          </div></fieldset>
          {direction === "grid" && <label className="field"><span className="field-label">{t("edit.stitch.columns")}</span><input type="number" min="1" max={Math.max(1, images.length)} value={columns} onChange={(event) => setColumns(Math.max(1, Number(event.target.value) || 1))}/></label>}
          <div className="field-pair">
            <label className="field"><span className="field-label">{t("edit.stitch.spacing")}</span><input type="number" min="0" max="200" value={spacing} onChange={(event) => setSpacing(Math.min(200, Math.max(0, Number(event.target.value) || 0)))}/></label>
            <label className="field"><span className="field-label">{t("edit.stitch.alignment")}</span><select value={alignment} onChange={(event) => setAlignment(event.target.value as EditAlign)}>{alignOptions.map((option) => <option key={option} value={option}>{t(`edit.align.${option}`)}</option>)}</select></label>
          </div>
        </>}

        <div className="field-pair">
          <label className="field"><span className="field-label">{t("edit.output.format")}</span><select value={format} onChange={(event) => setFormat(event.target.value as EditOutputFormat)}>{EDIT_OUTPUT_FORMATS.map((option) => <option key={option} value={option}>{option.toUpperCase()}</option>)}</select></label>
          {format !== "png" && <label className="field"><span className="field-label">{t("edit.output.quality")}</span><div className="range-row"><input type="range" min="10" max="100" value={quality} onChange={(event) => setQuality(Number(event.target.value))}/><output>{quality}%</output></div></label>}
        </div>
        {format === "jpeg" && <label className="field"><span className="field-label">{t("edit.output.background")}</span><div className="color-row"><input type="color" value={background} onChange={(event) => setBackground(event.target.value)}/><input value={background} onChange={(event) => /^#[\da-f]{6}$/i.test(event.target.value) && setBackground(event.target.value)}/></div></label>}

        {mode === "stitch" && images.length === 1 && <p className="field-error">{t("edit.needTwo")}</p>}
        {summary && <p className="home-notice" role="status">{t("edit.summary", { ok: summary.ok, failed: summary.failed })}</p>}
        {error && <p className="field-error" role="alert">{error}</p>}
        <button className="button primary" type="button" disabled={!canRun || running} onClick={run}>{running ? t("edit.running") : t("edit.run")}</button>
        <p className="edit-budget">{t("edit.budget")}</p>
      </section>
    </div>
  </section>;
}

function outputStem(name: string): string {
  const extension = getFileExtension(name);
  const stem = extension ? name.slice(0, -(extension.length + 1)) : name;
  return stem.replace(/[\\/:*?"<>|]+/g, "-").slice(0, 120) || "image";
}
