import {
  useCallback, useEffect, useMemo, useRef, useState,
  type ChangeEvent, type DragEvent, type KeyboardEvent, type ReactNode,
} from "react";
import { I18nProvider, useTranslation } from "@toolbox/i18n/react";
import { NavBar } from "@toolbox/nav";
import { AppIcon } from "@toolbox/nav/AppIcon.tsx";
import { ToolboxFooter } from "@toolbox/nav/ToolboxFooter.tsx";
import { translations } from "./i18n";
import { GifComposer } from "./GifComposer";
import { TextMarkupConverter } from "./TextMarkupConverter";
import { FileHome } from "./FileHome";
import { PdfWorkspace } from "./PdfWorkspace";
import { ArchiveWorkspace } from "./ArchiveWorkspace";
import { FilePicker } from "./FilePicker";
import { SelectMenu } from "./SelectMenu";
import { ACCEPT_ATTRIBUTE, convertImage, getFileExtension } from "./lib/convert";
import { triggerDownload } from "./lib/download";
import { selectIncomingFiles } from "./lib/file-selection";
import {
  buildOutputName, insertToken, inspectRegexMatch, makeUniquePath, validateRename,
} from "./lib/rename";
import type { ConversionSettings, QueueItem, RejectedFile, RenameSettings } from "./lib/types";
import { createZip } from "./lib/zip";

const SETTINGS_STORAGE_KEY = "toolbox.image-converter.settings";
const DEFAULT_SETTINGS: ConversionSettings = {
  format: "webp", quality: 0.82, resizeMode: "original", scale: 100, maxWidth: 1920, maxHeight: 1080,
  preventUpscale: true, rotation: 0, flipHorizontal: false, flipVertical: false,
  background: "#ffffff", keepSmallerOriginal: true, preserveFolders: true,
};
const DEFAULT_RENAME: RenameSettings = {
  mode: "template", template: "{name}", pattern: "^IMG_(.*)$", replacement: "photo-$1-{index}",
  global: false, ignoreCase: false, start: 1, padding: 3,
};
const RENAME_TOKENS = ["{name}", "{index}", "{format}", "{width}", "{height}"] as const;
const REGEX_PRESETS = [
  { id: "camera", pattern: "^(?:IMG|DSC|PXL)[_-]?(.*)$", replacement: "$1-{index}", global: false, ignoreCase: true },
  { id: "separators", pattern: "[\\s_]+", replacement: "-", global: true, ignoreCase: false },
  { id: "copy", pattern: "\\s*\\(\\d+\\)$", replacement: "", global: false, ignoreCase: true },
] as const;
type StoredSettings = { conversion: ConversionSettings; rename: RenameSettings };
type AppTab = "home" | "image" | "gif" | "text" | "pdf" | "archive" | "knowledge";
type NamePreview = { before: string; after: string; matched: boolean; groups: string[] };
type DownloadMode = "files" | "zip";
type ImportSummary = { accepted: number; rejected: number };

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function choice<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return typeof value === "string" && values.includes(value as T) ? value as T : fallback;
}

function boundedNumber(value: unknown, fallback: number, minimum: number, maximum: number, integer = false): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const bounded = Math.min(maximum, Math.max(minimum, value));
  return integer ? Math.round(bounded) : bounded;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function shortText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length <= 512 ? value : fallback;
}

function readSettings(): StoredSettings {
  try {
    const parsed = record(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "null"));
    const conversion = record(parsed.conversion);
    const rename = record(parsed.rename);
    return {
      conversion: {
        format: choice(conversion.format, ["png", "jpeg", "webp"] as const, DEFAULT_SETTINGS.format),
        quality: boundedNumber(conversion.quality, DEFAULT_SETTINGS.quality, .1, 1),
        resizeMode: choice(conversion.resizeMode, ["original", "scale", "fit"] as const, DEFAULT_SETTINGS.resizeMode),
        scale: boundedNumber(conversion.scale, DEFAULT_SETTINGS.scale, 1, 800, true),
        maxWidth: boundedNumber(conversion.maxWidth, DEFAULT_SETTINGS.maxWidth, 1, 16384, true),
        maxHeight: boundedNumber(conversion.maxHeight, DEFAULT_SETTINGS.maxHeight, 1, 16384, true),
        preventUpscale: booleanValue(conversion.preventUpscale, DEFAULT_SETTINGS.preventUpscale),
        rotation: [0, 90, 180, 270].includes(conversion.rotation as number) ? conversion.rotation as ConversionSettings["rotation"] : DEFAULT_SETTINGS.rotation,
        flipHorizontal: booleanValue(conversion.flipHorizontal, DEFAULT_SETTINGS.flipHorizontal),
        flipVertical: booleanValue(conversion.flipVertical, DEFAULT_SETTINGS.flipVertical),
        background: typeof conversion.background === "string" && /^#[0-9a-f]{6}$/i.test(conversion.background) ? conversion.background : DEFAULT_SETTINGS.background,
        keepSmallerOriginal: booleanValue(conversion.keepSmallerOriginal, DEFAULT_SETTINGS.keepSmallerOriginal),
        preserveFolders: booleanValue(conversion.preserveFolders, DEFAULT_SETTINGS.preserveFolders),
      },
      rename: {
        mode: choice(rename.mode, ["template", "regex"] as const, DEFAULT_RENAME.mode),
        template: shortText(rename.template, DEFAULT_RENAME.template),
        pattern: shortText(rename.pattern, DEFAULT_RENAME.pattern),
        replacement: shortText(rename.replacement, DEFAULT_RENAME.replacement),
        global: booleanValue(rename.global, DEFAULT_RENAME.global),
        ignoreCase: booleanValue(rename.ignoreCase, DEFAULT_RENAME.ignoreCase),
        start: boundedNumber(rename.start, DEFAULT_RENAME.start, 0, 999999, true),
        padding: boundedNumber(rename.padding, DEFAULT_RENAME.padding, 1, 8, true),
      },
    };
  } catch {
    return { conversion: DEFAULT_SETTINGS, rename: DEFAULT_RENAME };
  }
}

function AppSurface() {
  const { lang, t } = useTranslation();
  const initial = useMemo(readSettings, []);
  const [settings, setSettings] = useState(initial.conversion);
  const [rename, setRename] = useState(initial.rename);
  const [items, setItems] = useState<QueueItem[]>([]);
  const [rejections, setRejections] = useState<RejectedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [gifTransfer, setGifTransfer] = useState<{ id: number; files: File[] } | undefined>();
  const [textTransfer, setTextTransfer] = useState<{ id: number; files: File[] } | undefined>();
  const [pdfTransfer, setPdfTransfer] = useState<{ id: number; files: File[] } | undefined>();
  const [archiveTransfer, setArchiveTransfer] = useState<{ id: number; files: File[] } | undefined>();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [downloadMode, setDownloadMode] = useState<DownloadMode>("files");
  const [lastImport, setLastImport] = useState<ImportSummary | null>(null);
  const cancelRef = useRef(false);
  const itemRef = useRef(items);
  itemRef.current = items;

  useEffect(() => {
    document.title = activeTab === "home" ? t("meta.title") : `${t(`tabs.${activeTab}`)} · ${t("brand.title")}`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", t("meta.description"));
  }, [activeTab, lang, t]);

  useEffect(() => {
    try { localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ conversion: settings, rename })); } catch { /* optional persistence */ }
  }, [settings, rename]);

  useEffect(() => () => {
    for (const item of itemRef.current) {
      URL.revokeObjectURL(item.sourceUrl);
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    }
  }, []);

  const renameError = validateRename(rename);
  const doneItems = items.filter((item) => item.status === "done" && item.output && item.outputUrl);
  const namePreviews = useMemo<NamePreview[]>(() => items.slice(0, 5).map((item, index) => {
    const match = inspectRegexMatch(item.file.name, rename);
    return {
      before: item.relativePath,
      after: previewOutputPath(item, index + 1, settings, rename),
      matched: match.matched,
      groups: match.groups,
    };
  }), [items, settings, rename]);

  const addFiles = useCallback((incoming: File[]) => {
    const selection = selectIncomingFiles(itemRef.current, incoming);
    setRejections(selection.rejected);
    setLastImport({ accepted: selection.accepted.length, rejected: selection.rejected.length });
    const stamp = Date.now();
    const accepted = selection.accepted.map(({ file, relativePath }, index): QueueItem => ({
      id: `${stamp}-${index}-${file.lastModified}`,
      file,
      relativePath,
      sourceUrl: URL.createObjectURL(file),
      status: "ready",
    }));
    if (accepted.length) setItems((current) => [...current, ...accepted]);
  }, []);

  const recordDimensions = useCallback((id: string, width: number, height: number) => {
    if (!width || !height) return;
    setItems((current) => updateItem(current, id, { width, height, sourceInfoUnavailable: false }));
  }, []);

  const recordDimensionFailure = useCallback((id: string) => {
    setItems((current) => updateItem(current, id, { sourceInfoUnavailable: true }));
  }, []);

  const removeItem = (id: string) => {
    if (previewId === id) setPreviewId(null);
    setItems((current) => current.filter((item) => {
      if (item.id !== id) return true;
      URL.revokeObjectURL(item.sourceUrl);
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      return false;
    }));
  };

  const clearItems = () => {
    cancelRef.current = true;
    for (const item of items) {
      URL.revokeObjectURL(item.sourceUrl);
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    }
    setItems([]);
    setPreviewId(null);
    setLastImport(null);
  };

  const convertAll = async () => {
    if (!items.length || renameError) return;
    cancelRef.current = false;
    setRunning(true);
    const used = new Set<string>();
    for (let index = 0; index < items.length; index += 1) {
      if (cancelRef.current) break;
      const item = items[index];
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
      setItems((current) => updateItem(current, item.id, {
        status: "converting", error: undefined, output: undefined, outputName: undefined, outputUrl: undefined,
        outputWidth: undefined, outputHeight: undefined, keptOriginal: undefined,
      }));
      try {
        const result = await convertImage(item.file, settings);
        const path = makeUniquePath(previewOutputPath({ ...item, outputWidth: result.outputWidth, outputHeight: result.outputHeight }, index + 1, settings, rename), used);
        const outputUrl = URL.createObjectURL(result.blob);
        setItems((current) => updateItem(current, item.id, {
          status: "done", output: result.blob, outputName: path, outputUrl, width: result.sourceWidth, height: result.sourceHeight,
          outputWidth: result.outputWidth, outputHeight: result.outputHeight, keptOriginal: result.keptOriginal,
        }));
      } catch (error) {
        const key = error instanceof Error ? error.message : "unknown";
        setItems((current) => updateItem(current, item.id, {
          status: "error",
          error: t(`errors.${key}`) === `errors.${key}` ? t("errors.unknown") : t(`errors.${key}`),
        }));
      }
    }
    setRunning(false);
  };

  const downloadResults = async () => {
    if (!doneItems.length) return;
    if (downloadMode === "files") {
      for (const item of doneItems) {
        if (item.output && item.outputName) triggerDownload(item.output, item.outputName.split("/").pop()!);
      }
      return;
    }
    const entries = doneItems.flatMap((item) => item.output && item.outputName ? [{ name: item.outputName, blob: item.output }] : []);
    triggerDownload(await createZip(entries), `formtran-images-${new Date().toISOString().slice(0, 10)}.zip`);
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles([...event.target.files ?? []]);
    event.target.value = "";
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault(); setDragging(false); addFiles([...event.dataTransfer.files]);
  };
  const openImages = (files: File[], preset: "default" | "web" | "transparent" | "privacy") => {
    if (preset === "web") setSettings((current) => ({ ...current, format: "webp", quality: 0.74, resizeMode: "original", keepSmallerOriginal: false }));
    if (preset === "transparent") setSettings((current) => ({ ...current, format: "png", resizeMode: "original", keepSmallerOriginal: false }));
    if (preset === "privacy") setSettings((current) => ({ ...current, keepSmallerOriginal: false }));
    addFiles(files); setActiveTab("image");
  };
  const openGif = (files: File[]) => { setGifTransfer({ id: Date.now(), files }); setActiveTab("gif"); };
  const openText = (files: File[]) => { setTextTransfer({ id: Date.now(), files }); setActiveTab("text"); };
  const openPdf = (files: File[]) => { setPdfTransfer({ id: Date.now(), files }); setActiveTab("pdf"); };
  const openArchive = (files: File[]) => { setArchiveTransfer({ id: Date.now(), files }); setActiveTab("archive"); };

  return (
    <>
      <NavBar currentApp="image-converter" />
      <div className="app-shell">
        <header className="app-header">
          <div className="brand-lockup">
            <div className="toolbox-app-mark"><AppIcon appId="image-converter" /></div>
            <div><h1>{t("brand.title")}</h1><p>{t("brand.subtitle")}</p></div>
          </div>
        </header>

        <AppTabs active={activeTab} onChange={setActiveTab} />

        <main>
          <FileHome hidden={activeTab !== "home"} onOpenImage={openImages} onOpenGif={openGif} onOpenText={openText} onOpenPdf={openPdf} onOpenArchive={openArchive}/>
          {activeTab === "image" && (
            <section className="workspace" role="tabpanel" id="panel-image" aria-labelledby="tab-image">
              <div className="intake-grid">
                <div className="intake-column">
                  <section className={`drop-zone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
                    <div className="drop-zone-heading"><div className="drop-icon" aria-hidden="true">↥</div><div><h2>{t("upload.drop")}</h2><p>{t("upload.hint")}</p></div></div>
                    <small>{t("upload.accepted")}</small>
                    <div className="upload-actions">
                      <FilePicker label={t("upload.files")} accept={ACCEPT_ATTRIBUTE} multiple onChange={onInput} />
                      <FilePicker label={t("upload.folder")} accept={ACCEPT_ATTRIBUTE} multiple directory variant="secondary" onChange={onInput} />
                    </div>
                    {(lastImport || rejections.length > 0) && <div className="intake-feedback-row">
                      {lastImport && <div className={`import-feedback ${lastImport.accepted ? "is-success" : "is-warning"}`} role="status"><strong>{t(lastImport.accepted ? "upload.importSuccess" : "upload.importNoFiles", { count: lastImport.accepted })}</strong><span>{lastImport.rejected ? t("upload.importRejected", { count: lastImport.rejected }) : t("upload.importReady")}</span></div>}
                      {rejections.length > 0 && <RejectionNotice files={rejections} onDismiss={() => setRejections([])} />}
                    </div>}
                  </section>
                </div>

                <section className="queue-panel" aria-live="polite">
                  <div className="section-heading">
                    <div><span className="eyebrow">{t("queue.count", { count: items.length })}</span><h2>{t("queue.title")}</h2></div>
                    {items.length > 0 && <button className="text-button" type="button" onClick={clearItems} disabled={running}>{t("queue.clear")}</button>}
                  </div>
                  {!items.length ? <div className="empty-state"><span aria-hidden="true">▧</span><p>{t("queue.emptyCompact")}</p></div> : (
                    <div className="file-list">
                      {items.map((item) => <FileRow key={item.id} item={item} onDimensions={(width, height) => recordDimensions(item.id, width, height)} onDimensionsUnavailable={() => recordDimensionFailure(item.id)} onRemove={() => removeItem(item.id)} onPreview={() => setPreviewId(item.id)} disabled={running} />)}
                    </div>
                  )}
                </section>
              </div>

              <div className="control-grid">
                <SettingsPanel settings={settings} onChange={setSettings} onReset={() => setSettings(DEFAULT_SETTINGS)} />
                <RenamePanel rename={rename} onChange={setRename} error={renameError} previews={namePreviews} />
              </div>

              {doneItems.length > 0 && <ResultGallery items={doneItems} onPreview={setPreviewId} />}

              <div className="action-bar">
                <div>
                  <strong>{running ? t("actions.converting") : items.length ? t("queue.progress", { done: doneItems.length, total: items.length }) : t("actions.nothing")}</strong>
                  {renameError && <span>{t("actions.fixRename")}</span>}
                </div>
                <div className="action-buttons">
                  {running ? <button className="button secondary" type="button" onClick={() => { cancelRef.current = true; }}>{t("actions.stop")}</button> : null}
                  <button className="button primary" type="button" onClick={convertAll} disabled={running || !items.length || Boolean(renameError)}>{t("actions.convert")}</button>
                  <div className="download-control"><span className="download-label">{t("actions.downloadAs")}</span><SelectMenu value={downloadMode} onChange={setDownloadMode} ariaLabel={t("actions.downloadAs")} align="right" options={[{ value: "files", label: t("actions.downloadFilesTitle"), description: t("actions.downloadFilesDetail") }, { value: "zip", label: t("actions.downloadZipTitle"), description: t("actions.downloadZipDetail") }]} /><button className="button secondary" type="button" onClick={downloadResults} disabled={running || !doneItems.length}>{t("actions.download")}</button></div>
                </div>
              </div>
            </section>
          )}
          <GifComposer hidden={activeTab !== "gif"} incoming={gifTransfer}/>
          <TextMarkupConverter hidden={activeTab !== "text"} incoming={textTransfer}/>
          <PdfWorkspace hidden={activeTab !== "pdf"} incoming={pdfTransfer}/>
          <ArchiveWorkspace hidden={activeTab !== "archive"} incoming={archiveTransfer}/>
          {activeTab === "knowledge" && <KnowledgePage />}
        </main>
        <TabPrivacyNotice tab={activeTab} />
        <ToolboxFooter appId="image-converter" />
      </div>
      {previewId && <PreviewDialog items={doneItems} activeId={previewId} onChange={setPreviewId} onClose={() => setPreviewId(null)} />}
    </>
  );
}

function AppTabs({ active, onChange }: { active: AppTab; onChange: (tab: AppTab) => void }) {
  const { t } = useTranslation();
  const tabs: AppTab[] = ["home", "image", "gif", "text", "pdf", "archive", "knowledge"];
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const offset = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(index + offset + tabs.length) % tabs.length];
    onChange(next);
    document.getElementById(`tab-${next}`)?.focus();
  };
  return <nav className="app-tabs" role="tablist" aria-label={t("tabs.label")}>
    {tabs.map((tab, index) => <button key={tab} id={`tab-${tab}`} type="button" role="tab" aria-selected={active === tab} aria-controls={`panel-${tab}`} tabIndex={active === tab ? 0 : -1} onClick={() => onChange(tab)} onKeyDown={(event) => onKeyDown(event, index)}>{t(`tabs.${tab}`)}</button>)}
  </nav>;
}

function RejectionNotice({ files, onDismiss }: { files: RejectedFile[]; onDismiss: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const shown = files.slice(0, 100);
  return <aside className={`rejection-notice ${open ? "is-open" : ""}`} aria-live="polite">
    <button className="rejection-summary" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <span aria-hidden="true">!</span>
      <strong>{t("upload.rejectedCount", { count: files.length })}</strong>
      <small>{t("upload.rejectedHint")}</small>
    </button>
    <div className="rejection-popover" role="region" aria-label={t("upload.rejectedTitle")}>
      <div className="popover-heading"><strong>{t("upload.rejectedTitle")}</strong><button type="button" className="icon-button" onClick={onDismiss} aria-label={t("upload.dismiss")}>×</button></div>
      <ul>{shown.map((file, index) => <li key={`${file.relativePath}-${index}`}><span title={file.relativePath}>{file.relativePath}</span><small>{formatBytes(file.size)} · {t(`upload.reasons.${file.reason}`)}</small></li>)}</ul>
      {files.length > shown.length && <p>{t("upload.rejectedMore", { count: files.length - shown.length })}</p>}
    </div>
  </aside>;
}

function SettingsPanel({ settings, onChange, onReset }: { settings: ConversionSettings; onChange: (next: ConversionSettings) => void; onReset: () => void }) {
  const { t } = useTranslation();
  const patch = (next: Partial<ConversionSettings>) => onChange({ ...settings, ...next });
  const hasTransform = settings.rotation !== 0 || settings.flipHorizontal || settings.flipVertical;
  return <section className="panel settings-panel">
    <div className="section-heading"><h2>{t("settings.title")}</h2><button className="text-button" type="button" onClick={onReset}>{t("settings.reset")}</button></div>
    <fieldset><legend>{t("settings.format")}</legend><div className="segmented">
      {(["webp", "jpeg", "png"] as const).map((format) => <button type="button" className={settings.format === format ? "active" : ""} aria-pressed={settings.format === format} onClick={() => patch({ format })} key={format}>{format === "jpeg" ? "JPEG" : format.toUpperCase()}</button>)}
    </div></fieldset>
    <Field label={t("settings.quality")} tip={t("settings.qualityTip")}><div className="range-row"><input type="range" min="10" max="100" value={Math.round(settings.quality * 100)} disabled={settings.format === "png"} onChange={(event) => patch({ quality: Number(event.target.value) / 100 })} /><output>{Math.round(settings.quality * 100)}%</output></div></Field>
    <Field label={t("settings.resize")}><select value={settings.resizeMode} onChange={(event) => patch({ resizeMode: event.target.value as ConversionSettings["resizeMode"] })}><option value="original">{t("settings.original")}</option><option value="scale">{t("settings.scale")}</option><option value="fit">{t("settings.fit")}</option></select></Field>
    {settings.resizeMode === "scale" && <Field label={t("settings.percent")}><input type="number" min="1" max="800" value={settings.scale} onChange={(event) => patch({ scale: clamp(Number(event.target.value), 1, 800) })} /></Field>}
    {settings.resizeMode === "fit" && <div className="field-pair"><Field label={t("settings.maxWidth")}><input type="number" min="1" max="16384" value={settings.maxWidth} onChange={(event) => patch({ maxWidth: clamp(Number(event.target.value), 1, 16384) })} /></Field><Field label={t("settings.maxHeight")}><input type="number" min="1" max="16384" value={settings.maxHeight} onChange={(event) => patch({ maxHeight: clamp(Number(event.target.value), 1, 16384) })} /></Field></div>}
    <label className="check-row"><input type="checkbox" checked={settings.preventUpscale} onChange={(event) => patch({ preventUpscale: event.target.checked })} />{t("settings.noUpscale")}</label>
    <fieldset className="image-transform"><legend>{t("settings.transform")}</legend><p>{t("settings.transformTip")}</p><div className="transform-controls"><div><span className="field-label">{t("settings.rotation")}</span><div className="segmented rotation-options">{([0, 90, 180, 270] as const).map((rotation) => <button type="button" key={rotation} aria-pressed={settings.rotation === rotation} className={settings.rotation === rotation ? "active" : ""} onClick={() => patch({ rotation })}>{rotation}°</button>)}</div></div><div><span className="field-label">{t("settings.flip")}</span><div className="flip-options"><button type="button" aria-pressed={settings.flipHorizontal} className={settings.flipHorizontal ? "active" : ""} onClick={() => patch({ flipHorizontal: !settings.flipHorizontal })}>{t("settings.flipHorizontal")}</button><button type="button" aria-pressed={settings.flipVertical} className={settings.flipVertical ? "active" : ""} onClick={() => patch({ flipVertical: !settings.flipVertical })}>{t("settings.flipVertical")}</button></div></div></div></fieldset>
    {settings.format === "jpeg" && <Field label={t("settings.background")} tip={t("settings.backgroundTip")}><div className="color-row"><input type="color" value={settings.background} onChange={(event) => patch({ background: event.target.value })} /><input value={settings.background} pattern="#[0-9a-fA-F]{6}" onChange={(event) => /^#[0-9a-fA-F]{6}$/.test(event.target.value) && patch({ background: event.target.value })} /></div></Field>}
    <label className="check-row"><input type="checkbox" checked={settings.keepSmallerOriginal} disabled={hasTransform} onChange={(event) => patch({ keepSmallerOriginal: event.target.checked })} />{t(hasTransform ? "settings.keepSmallerTransform" : "settings.keepSmaller")}</label>
    <label className="check-row"><input type="checkbox" checked={settings.preserveFolders} onChange={(event) => patch({ preserveFolders: event.target.checked })} />{t("settings.preserveFolders")}</label>
  </section>;
}

function RenamePanel({ rename, onChange, error, previews }: { rename: RenameSettings; onChange: (next: RenameSettings) => void; error: string | null; previews: NamePreview[] }) {
  const { t } = useTranslation();
  const templateRef = useRef<HTMLInputElement>(null);
  const replacementRef = useRef<HTMLInputElement>(null);
  const patch = (next: Partial<RenameSettings>) => onChange({ ...rename, ...next });
  const insert = (field: "template" | "replacement", token: string) => {
    const ref = field === "template" ? templateRef : replacementRef;
    const value = rename[field];
    const start = ref.current?.selectionStart ?? value.length;
    const end = ref.current?.selectionEnd ?? start;
    patch({ [field]: insertToken(value, token, start, end) });
    requestAnimationFrame(() => {
      ref.current?.focus();
      ref.current?.setSelectionRange(start + token.length, start + token.length);
    });
  };
  const matched = previews.filter((entry) => entry.matched).length;

  return <section className="panel rename-panel">
    <div className="section-heading"><div><h2>{t("rename.title")}</h2><p>{t("rename.subtitle")}</p></div></div>
    {rename.mode === "template" ? <>
      <Field label={t("rename.template")}><input ref={templateRef} value={rename.template} onChange={(event) => patch({ template: event.target.value })} /></Field>
      <TokenChips onInsert={(token) => insert("template", token)} />
    </> : <>
      <div className="advanced-panel">
        <div className="regex-guide"><span><b>1</b>{t("rename.steps.match")}</span><i>→</i><span><b>2</b>{t("rename.steps.replace")}</span><i>→</i><span><b>3</b>{t("rename.steps.check")}</span></div>
        <div className="preset-block"><span className="field-label">{t("rename.presets")}</span><div className="preset-buttons">{REGEX_PRESETS.map((preset) => <button type="button" key={preset.id} onClick={() => patch({ mode: "regex", pattern: preset.pattern, replacement: preset.replacement, global: preset.global, ignoreCase: preset.ignoreCase })}><strong>{t(`rename.preset.${preset.id}.title`)}</strong><small>{t(`rename.preset.${preset.id}.description`)}</small></button>)}</div></div>
        <Field label={t("rename.pattern")}><div className="regex-input"><span>/</span><input value={rename.pattern} aria-invalid={Boolean(error)} onChange={(event) => patch({ pattern: event.target.value })} /><span>/{rename.global ? "g" : ""}{rename.ignoreCase ? "i" : ""}</span></div></Field>
        <Field label={t("rename.replacement")} tip={t("rename.replacementTip")}><input ref={replacementRef} value={rename.replacement} onChange={(event) => patch({ replacement: event.target.value })} /></Field>
        <TokenChips onInsert={(token) => insert("replacement", token)} />
        <div className="field-pair compact"><label className="check-row"><input type="checkbox" checked={rename.global} onChange={(event) => patch({ global: event.target.checked })} />{t("rename.global")}</label><label className="check-row"><input type="checkbox" checked={rename.ignoreCase} onChange={(event) => patch({ ignoreCase: event.target.checked })} />{t("rename.ignoreCase")}</label></div>
      </div>
    </>}
    <div className="field-pair"><Field label={t("rename.start")}><input type="number" min="0" max="999999" value={rename.start} onChange={(event) => patch({ start: clamp(Number(event.target.value), 0, 999999) })} /></Field><Field label={t("rename.padding")}><input type="number" min="1" max="8" value={rename.padding} onChange={(event) => patch({ padding: clamp(Number(event.target.value), 1, 8) })} /></Field></div>
    {error && <p className="field-error" role="alert">{error === "invalid-regex" ? t("rename.invalid") : t("rename.empty")}</p>}
    <div className="rename-preview">
      <div className="preview-heading"><strong>{t("rename.preview")}</strong>{rename.mode === "regex" && <span>{t("rename.matchSummary", { matched, total: previews.length })}</span>}</div>
      {previews.length ? previews.map((entry) => <div className={!entry.matched ? "is-unmatched" : ""} key={entry.before}><span title={entry.before}>{entry.before}</span><b aria-hidden="true">→</b><code title={entry.after}>{entry.after}</code>{rename.mode === "regex" && <em>{entry.matched ? t("rename.matched") : t("rename.unmatched")}{entry.groups.length ? ` · ${entry.groups.map((group, index) => `$${index + 1}=${group}`).join(" · ")}` : ""}</em>}</div>) : <p>{t("rename.conflict")}</p>}
    </div>
    <button className="advanced-toggle" type="button" aria-expanded={rename.mode === "regex"} onClick={() => patch({ mode: rename.mode === "regex" ? "template" : "regex" })}><span><strong>{t("rename.advancedTitle")}</strong><small>{t("rename.advancedDetail")}</small></span><b aria-hidden="true">{rename.mode === "regex" ? "−" : "+"}</b></button>
  </section>;
}

function TokenChips({ onInsert }: { onInsert: (token: string) => void }) {
  const { t } = useTranslation();
  return <div className="token-picker"><span>{t("rename.tokens")}</span><div>{RENAME_TOKENS.map((token) => <button type="button" key={token} onClick={() => onInsert(token)} title={t(`rename.token.${token.slice(1, -1)}`)}><code>{token}</code><small>{t(`rename.token.${token.slice(1, -1)}`)}</small></button>)}</div></div>;
}

function FileRow({ item, onDimensions, onDimensionsUnavailable, onRemove, onPreview, disabled }: { item: QueueItem; onDimensions: (width: number, height: number) => void; onDimensionsUnavailable: () => void; onRemove: () => void; onPreview: () => void; disabled: boolean }) {
  const { lang, t } = useTranslation();
  const extension = getFileExtension(item.file.name);
  const canPreviewSource = extension !== "svg";
  const statusLabel = item.status === "error" ? t("queue.error") : t(`queue.${item.status}`);
  const dimensions = item.width && item.height ? `${item.width} × ${item.height}` : null;
  const pixels = item.width && item.height ? new Intl.NumberFormat(lang === "zh" ? "zh-CN" : "en").format(item.width * item.height) : null;
  const aspect = item.width && item.height ? simplifyRatio(item.width, item.height) : null;
  return <article className={`file-row status-${item.status}`}>
    <div className="thumbnail">{canPreviewSource ? <img src={item.sourceUrl} alt="" onLoad={(event) => onDimensions(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight)} onError={onDimensionsUnavailable} /> : <span>SVG</span>}</div>
    <div className="file-main"><strong title={item.relativePath}>{item.relativePath}</strong><div className="file-meta"><span>{extension.toUpperCase()}</span><span>{formatBytes(item.file.size)}</span><span>{dimensions ?? t(item.sourceInfoUnavailable || !canPreviewSource ? "queue.sizeUnavailable" : "queue.readingSize")}</span>{extension === "gif" && <span className="warning">{t("queue.firstFrame")}</span>}{extension === "svg" && <span className="warning">{t("queue.svgSafe")}</span>}</div>{dimensions && pixels && aspect && <details className="image-info"><summary>{t("queue.info")}</summary><dl><div><dt>{t("queue.dimensions")}</dt><dd>{dimensions}</dd></div><div><dt>{t("queue.pixels")}</dt><dd>{t("queue.pixelValue", { count: pixels })}</dd></div><div><dt>{t("queue.aspect")}</dt><dd>{aspect}</dd></div><div><dt>{t("queue.mime")}</dt><dd>{item.file.type || t("queue.mimeUnknown")}</dd></div></dl></details>}{item.outputName && <code title={item.outputName}>{item.outputName}</code>}{item.error && <p className="field-error">{item.error}</p>}</div>
    <div className="file-output"><span className={`status-badge ${item.status}`}>{statusLabel}</span>{item.output && <><strong>{formatBytes(item.output.size)}</strong><small>{item.outputWidth} × {item.outputHeight}{item.keptOriginal ? ` · ${t("queue.kept")}` : ""}</small><button className="text-button" type="button" onClick={onPreview}>{t("preview.open")}</button></>}{item.output && item.outputName && <button className="text-button" type="button" onClick={() => triggerDownload(item.output!, item.outputName!.split("/").pop()!)}>{t("queue.download")}</button>}</div>
    <button className="icon-button" type="button" onClick={onRemove} disabled={disabled} aria-label={`${t("queue.remove")} ${item.file.name}`}>×</button>
  </article>;
}

function ResultGallery({ items, onPreview }: { items: QueueItem[]; onPreview: (id: string) => void }) {
  const { t } = useTranslation();
  return <section className="result-panel">
    <div className="section-heading"><div><span className="eyebrow">{t("preview.count", { count: items.length })}</span><h2>{t("preview.title")}</h2><p>{t("preview.subtitle")}</p></div></div>
    <div className="result-gallery">{items.map((item) => <button type="button" key={item.id} onClick={() => onPreview(item.id)}><span className="result-image"><img src={item.outputUrl} alt="" /></span><strong title={item.outputName}>{item.outputName}</strong><small>{item.outputWidth} × {item.outputHeight} · {formatBytes(item.output?.size ?? 0)}</small></button>)}</div>
  </section>;
}

function PreviewDialog({ items, activeId, onChange, onClose }: { items: QueueItem[]; activeId: string; onChange: (id: string) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const index = Math.max(0, items.findIndex((item) => item.id === activeId));
  const item = items[index];
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && items.length > 1) onChange(items[(index - 1 + items.length) % items.length].id);
      if (event.key === "ArrowRight" && items.length > 1) onChange(items[(index + 1) % items.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items, onChange, onClose]);
  if (!item?.outputUrl) return null;
  const sourceSafe = getFileExtension(item.file.name) !== "svg";
  return <div className="preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="preview-dialog" role="dialog" aria-modal="true" aria-labelledby="preview-title">
      <header><div><span className="eyebrow">{t("preview.position", { current: index + 1, total: items.length })}</span><h2 id="preview-title">{item.outputName}</h2></div><button autoFocus type="button" className="icon-button" onClick={onClose} aria-label={t("preview.close")}>×</button></header>
      <div className="compare-grid"><figure><figcaption>{t("preview.before")}</figcaption><div>{sourceSafe ? <img src={item.sourceUrl} alt={t("preview.beforeAlt")} /> : <span>{t("queue.previewUnavailable")}</span>}</div><small>{item.width} × {item.height} · {formatBytes(item.file.size)}</small></figure><figure><figcaption>{t("preview.after")}</figcaption><div><img src={item.outputUrl} alt={t("preview.afterAlt")} /></div><small>{item.outputWidth} × {item.outputHeight} · {formatBytes(item.output?.size ?? 0)}</small></figure></div>
      <footer><p>{t("preview.hint")}</p><div><button type="button" className="button secondary" disabled={items.length < 2} onClick={() => onChange(items[(index - 1 + items.length) % items.length].id)}>← {t("preview.previous")}</button><button type="button" className="button secondary" disabled={items.length < 2} onClick={() => onChange(items[(index + 1) % items.length].id)}>{t("preview.next")} →</button></div></footer>
    </section>
  </div>;
}

function KnowledgePage() {
  const { t } = useTranslation();
  const formats = ["jpeg", "png", "webp", "gif", "avif", "svg", "bmp"] as const;
  const [category, setCategory] = useState<"images" | "animation" | "markup" | "pdf" | "archive">("images");
  const categories = ["images", "animation", "markup", "pdf", "archive"] as const;
  const categoryMark = { images: "IMG", animation: "GIF", markup: "TXT", pdf: "PDF", archive: "ZIP" } as const;
  return <section className="knowledge-page" role="tabpanel" id="panel-knowledge" aria-labelledby="tab-knowledge">
    <header className="knowledge-hero"><span className="eyebrow">FORMTRAN LIBRARY</span><h2>{t("knowledge.title")}</h2><p>{t("knowledge.introExpanded")}</p></header>
    <div className="knowledge-layout">
      <nav className="knowledge-categories" aria-label={t("knowledge.categoriesLabel")}>{categories.map((item) => <button key={item} type="button" aria-current={category === item ? "page" : undefined} onClick={() => setCategory(item)}><span>{categoryMark[item]}</span><div><strong>{t(`knowledge.categories.${item}.title`)}</strong><small>{t(`knowledge.categories.${item}.description`)}</small></div></button>)}</nav>
      <div className="knowledge-content">
        {category === "images" && <>
          <section className="decision-guide"><h3>{t("knowledge.chooseTitle")}</h3><div className="purpose-table">{([['photo', 'WebP / JPEG'], ['transparent', 'PNG / WebP'], ['vector', 'SVG'], ['animation', 'GIF']] as const).map(([use, recommendation]) => <div key={use}><strong>{t(`knowledge.choose.${use}.title`)}</strong><b>{recommendation}</b><p>{t(`knowledge.choose.${use}.body`)}</p></div>)}</div></section>
          <section className="format-library"><div className="section-heading"><div><h3>{t("knowledge.libraryTitle")}</h3><p>{t("knowledge.librarySubtitle")}</p></div></div><div className="format-list">{formats.map((format, index) => <details key={format} open={index < 2}><summary><strong>{format.toUpperCase()}</strong><span>{t(`knowledge.formats.${format}.type`)}</span><p>{t(`knowledge.formats.${format}.body`)}</p></summary><dl><div><dt>{t("knowledge.bestFor")}</dt><dd>{t(`knowledge.formats.${format}.best`)}</dd></div><div><dt>{t("knowledge.watchFor")}</dt><dd>{t(`knowledge.formats.${format}.warning`)}</dd></div></dl></details>)}</div></section>
          <section className="comparison"><h3>{t("knowledge.tableTitle")}</h3><div><table><thead><tr><th>{t("knowledge.table.format")}</th><th>{t("knowledge.table.compression")}</th><th>{t("knowledge.table.transparency")}</th><th>{t("knowledge.table.animation")}</th><th>{t("knowledge.table.compatibility")}</th></tr></thead><tbody><tr><th>JPEG</th><td>{t("knowledge.values.lossy")}</td><td>—</td><td>—</td><td>{t("knowledge.values.high")}</td></tr><tr><th>PNG</th><td>{t("knowledge.values.lossless")}</td><td>✓</td><td>—</td><td>{t("knowledge.values.high")}</td></tr><tr><th>WebP</th><td>{t("knowledge.values.both")}</td><td>✓</td><td>✓</td><td>{t("knowledge.values.modern")}</td></tr><tr><th>GIF</th><td>{t("knowledge.values.losslessLimited")}</td><td>{t("knowledge.values.limited")}</td><td>✓</td><td>{t("knowledge.values.high")}</td></tr><tr><th>AVIF</th><td>{t("knowledge.values.both")}</td><td>✓</td><td>✓</td><td>{t("knowledge.values.modern")}</td></tr><tr><th>SVG</th><td>{t("knowledge.values.vector")}</td><td>✓</td><td>{t("knowledge.values.scripted")}</td><td>{t("knowledge.values.mixed")}</td></tr></tbody></table></div></section>
          <section className="knowledge-faq"><h3>{t("knowledge.boundariesTitle")}</h3><details open><summary>{t("knowledge.metadataTitle")}</summary><p>{t("knowledge.metadata")}</p></details><details><summary>{t("knowledge.colorTitle")}</summary><p>{t("knowledge.color")}</p></details><details><summary>{t("knowledge.browserTitle")}</summary><p>{t("knowledge.browser")}</p></details></section>
        </>}
        {category === "animation" && <KnowledgeTopic title={t("knowledge.animationGuide.title")} intro={t("knowledge.animationGuide.intro")} cards={["frames", "delay", "palette", "size"]} prefix="knowledge.animationGuide"><KnowledgeComparison type="animation" /></KnowledgeTopic>}
        {category === "markup" && <KnowledgeTopic title={t("knowledge.markupGuide.title")} intro={t("knowledge.markupGuide.intro")} cards={["semantic", "roundtrip", "html", "dialects", "encoding", "preview"]} prefix="knowledge.markupGuide"><KnowledgeComparison type="markup" /></KnowledgeTopic>}
        {category === "pdf" && <KnowledgeTopic title={t("knowledge.pdfGuide.title")} intro={t("knowledge.pdfGuide.intro")} cards={["structure", "pages", "security", "metadata"]} prefix="knowledge.pdfGuide"><KnowledgeComparison type="pdf" /></KnowledgeTopic>}
        {category === "archive" && <KnowledgeTopic title={t("knowledge.archiveGuide.title")} intro={t("knowledge.archiveGuide.intro")} cards={["container", "paths", "bombs", "encryption"]} prefix="knowledge.archiveGuide"><KnowledgeComparison type="archive" /></KnowledgeTopic>}
      </div>
    </div>
  </section>;
}

function KnowledgeTopic({ title, intro, cards, prefix, children }: { title: string; intro: string; cards: string[]; prefix: string; children: ReactNode }) {
  const { t } = useTranslation();
  return <section className="knowledge-topic"><header><h3>{title}</h3><p>{intro}</p></header>{children}<div className="knowledge-notes">{cards.map((card) => <article key={card}><strong>{t(`${prefix}.${card}.title`)}</strong><p>{t(`${prefix}.${card}.body`)}</p></article>)}</div></section>;
}

function KnowledgeComparison({ type }: { type: "animation" | "markup" | "pdf" | "archive" }) {
  const { t } = useTranslation();
  const rows = type === "animation" ? ["gif", "webp", "avif"] : type === "markup" ? ["markdown", "org", "rst", "asciidoc", "html"] : type === "pdf" ? ["inspect", "render", "edit"] : ["zip", "zip64", "other"];
  const columns = type === "animation" ? ["colors", "support", "best"] : type === "markup" ? ["readability", "strength", "best"] : type === "pdf" ? ["reads", "accuracy", "available"] : ["support", "safety", "available"];
  const prefix = type === "pdf" || type === "archive" ? `knowledge.${type}Comparison` : `knowledge.comparisons.${type}`;
  return <div className="knowledge-comparison"><h4>{t(`${prefix}.title`)}</h4><div><table><thead><tr><th>{t("knowledge.comparisons.format")}</th>{columns.map((column) => <th key={column}>{t(`${prefix}.headers.${column}`)}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row}><th>{t(`${prefix}.rows.${row}.name`)}</th>{columns.map((column) => <td key={column}>{t(`${prefix}.rows.${row}.${column}`)}</td>)}</tr>)}</tbody></table></div></div>;
}
function TabPrivacyNotice({ tab }: { tab: AppTab }) {
  const { t } = useTranslation();
  return <aside className="tab-privacy"><LockIcon /><div><strong>{t(`privacy.${tab}.title`)}</strong><p>{t(`privacy.${tab}.detail`)}</p></div></aside>;
}
function Field({ label, tip, children }: { label: string; tip?: string; children: ReactNode }) { return <label className="field"><span className="field-label">{label}{tip && <InfoTip text={tip} />}</span>{children}</label>; }
function InfoTip({ text }: { text: string }) { return <span className="info-wrap"><span className="info-tip" tabIndex={0} aria-label={text}>?</span><span className="tooltip" role="tooltip">{text}</span></span>; }
function LockIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>; }

function previewOutputPath(item: QueueItem, index: number, settings: ConversionSettings, rename: RenameSettings): string {
  const filename = buildOutputName({ filename: item.file.name, index, format: settings.format, width: item.outputWidth, height: item.outputHeight }, rename);
  if (!settings.preserveFolders) return filename;
  const slash = item.relativePath.lastIndexOf("/");
  return slash >= 0 ? `${item.relativePath.slice(0, slash + 1)}${filename}` : filename;
}
function updateItem(items: QueueItem[], id: string, patch: Partial<QueueItem>): QueueItem[] { return items.map((item) => item.id === id ? { ...item, ...patch } : item); }

function simplifyRatio(width: number, height: number): string {
  let left = Math.round(width);
  let right = Math.round(height);
  while (right) [left, right] = [right, left % right];
  return `${Math.round(width) / left}:${Math.round(height) / left}`;
}
function clamp(value: number, min: number, max: number): number { return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min; }
function formatBytes(bytes: number): string { if (bytes < 1024) return `${bytes} B`; const units = ["KB", "MB", "GB"]; let value = bytes / 1024; let unit = units[0]; for (let i = 1; value >= 1024 && i < units.length; i += 1) { value /= 1024; unit = units[i]; } return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`; }
export function App() { return <I18nProvider translations={translations}><AppSurface /></I18nProvider>; }
