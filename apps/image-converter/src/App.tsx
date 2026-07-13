import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { I18nProvider, useTranslation } from "@toolbox/i18n/react";
import { NavBar } from "@toolbox/nav";
import { AppIcon } from "@toolbox/nav/AppIcon.tsx";
import { ToolboxFooter } from "@toolbox/nav/ToolboxFooter.tsx";
import { translations } from "./i18n";
import {
  ACCEPT_ATTRIBUTE, MAX_FILES, MAX_FILE_BYTES, MAX_TOTAL_BYTES, convertImage, getFileExtension, isAcceptedImage,
} from "./lib/convert";
import { buildOutputName, makeUniquePath, validateRename } from "./lib/rename";
import type { ConversionSettings, QueueItem, RenameSettings } from "./lib/types";
import { createZip } from "./lib/zip";

const SETTINGS_STORAGE_KEY = "toolbox.image-converter.settings";
const DEFAULT_SETTINGS: ConversionSettings = {
  format: "webp", quality: 0.82, resizeMode: "original", scale: 100, maxWidth: 1920, maxHeight: 1080,
  preventUpscale: true, background: "#ffffff", keepSmallerOriginal: true, preserveFolders: true,
};
const DEFAULT_RENAME: RenameSettings = {
  mode: "template", template: "{name}", pattern: "^IMG_(.*)$", replacement: "photo-$1-{index}",
  global: false, ignoreCase: false, start: 1, padding: 3,
};

type StoredSettings = { conversion: ConversionSettings; rename: RenameSettings };

function readSettings(): StoredSettings {
  try {
    const parsed = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "null") as Partial<StoredSettings> | null;
    return {
      conversion: { ...DEFAULT_SETTINGS, ...parsed?.conversion },
      rename: { ...DEFAULT_RENAME, ...parsed?.rename },
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
  const [notice, setNotice] = useState("");
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const cancelRef = useRef(false);
  const itemRef = useRef(items);
  itemRef.current = items;

  useEffect(() => {
    document.title = t("meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", t("meta.description"));
  }, [lang, t]);

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
  const doneItems = items.filter((item) => item.status === "done" && item.output);
  const namePreviews = useMemo(() => items.slice(0, 5).map((item, index) => ({
    before: item.relativePath,
    after: previewOutputPath(item, index + 1, settings, rename),
  })), [items, settings, rename]);

  const addFiles = useCallback((incoming: File[]) => {
    setNotice("");
    setItems((current) => {
      const keys = new Set(current.map((item) => `${item.relativePath}:${item.file.size}:${item.file.lastModified}`));
      const accepted: QueueItem[] = [];
      let rejected = false;
      let total = current.reduce((sum, item) => sum + item.file.size, 0);
      for (const file of incoming) {
        const relativePath = file.webkitRelativePath || file.name;
        const key = `${relativePath}:${file.size}:${file.lastModified}`;
        if (keys.has(key)) continue;
        if (!isAcceptedImage(file) || file.size === 0 || file.size > MAX_FILE_BYTES) { rejected = true; continue; }
        if (current.length + accepted.length >= MAX_FILES || total + file.size > MAX_TOTAL_BYTES) {
          setNotice(t("upload.limit"));
          break;
        }
        total += file.size;
        keys.add(key);
        accepted.push({
          id: `${Date.now()}-${accepted.length}-${file.lastModified}`,
          file, relativePath, sourceUrl: URL.createObjectURL(file), status: "ready",
        });
      }
      if (rejected) setNotice(t("upload.rejected"));
      return [...current, ...accepted];
    });
  }, [t]);

  const removeItem = (id: string) => setItems((current) => current.filter((item) => {
    if (item.id !== id) return true;
    URL.revokeObjectURL(item.sourceUrl);
    if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    return false;
  }));

  const clearItems = () => {
    cancelRef.current = true;
    for (const item of items) {
      URL.revokeObjectURL(item.sourceUrl);
      if (item.outputUrl) URL.revokeObjectURL(item.outputUrl);
    }
    setItems([]);
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
        setItems((current) => updateItem(current, item.id, { status: "error", error: t(`errors.${key}`) === `errors.${key}` ? t("errors.unknown") : t(`errors.${key}`) }));
      }
    }
    setRunning(false);
  };

  const downloadZip = async () => {
    const entries = doneItems.flatMap((item) => item.output && item.outputName ? [{ name: item.outputName, blob: item.output }] : []);
    if (!entries.length) return;
    const zip = await createZip(entries);
    triggerDownload(zip, `toolbox-images-${new Date().toISOString().slice(0, 10)}.zip`);
  };

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles([...event.target.files ?? []]);
    event.target.value = "";
  };

  const onDrop = (event: DragEvent) => {
    event.preventDefault(); setDragging(false); addFiles([...event.dataTransfer.files]);
  };

  return (
    <>
      <NavBar currentApp="image-converter" />
      <div className="app-shell">
        <header className="app-header">
          <div className="brand-lockup">
            <div className="toolbox-app-mark"><AppIcon appId="image-converter" /></div>
            <div><h1>{t("brand.title")}</h1><p>{t("brand.subtitle")}</p></div>
          </div>
          <div className="privacy-pill"><LockIcon /><span><strong>{t("privacy.title")}</strong>{t("privacy.detail")}</span></div>
        </header>

        <main className="workspace">
          <section className={`drop-zone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
            <div className="drop-icon" aria-hidden="true">↥</div>
            <div><h2>{t("upload.drop")}</h2><p>{t("upload.hint")}</p><small>{t("upload.accepted")}</small></div>
            <div className="upload-actions">
              <label className="button primary">{t("upload.files")}<input aria-label={t("upload.files")} type="file" accept={ACCEPT_ATTRIBUTE} multiple onChange={onInput} /></label>
              <label className="button secondary">{t("upload.folder")}<input aria-label={t("upload.folder")} type="file" accept={ACCEPT_ATTRIBUTE} multiple {...({ webkitdirectory: "" } as Record<string, string>)} onChange={onInput} /></label>
            </div>
          </section>
          {notice && <p className="notice" role="status">{notice}</p>}

          <div className="control-grid">
            <SettingsPanel settings={settings} onChange={setSettings} onReset={() => setSettings(DEFAULT_SETTINGS)} />
            <RenamePanel rename={rename} onChange={setRename} error={renameError} previews={namePreviews} />
          </div>

          <section className="queue-panel" aria-live="polite">
            <div className="section-heading">
              <div><span className="eyebrow">{t("queue.count", { count: items.length })}</span><h2>{t("queue.title")}</h2></div>
              {items.length > 0 && <button className="text-button" type="button" onClick={clearItems} disabled={running}>{t("queue.clear")}</button>}
            </div>
            {!items.length ? <div className="empty-state"><span aria-hidden="true">▧</span><p>{t("queue.empty")}</p></div> : (
              <div className="file-list">
                {items.map((item) => <FileRow key={item.id} item={item} onRemove={() => removeItem(item.id)} disabled={running} />)}
              </div>
            )}
          </section>

          <div className="action-bar">
            <div>
              <strong>{running ? t("actions.converting") : items.length ? t("queue.progress", { done: doneItems.length, total: items.length }) : t("actions.nothing")}</strong>
              {renameError && <span>{t("actions.fixRename")}</span>}
            </div>
            <div className="action-buttons">
              {running ? <button className="button secondary" type="button" onClick={() => { cancelRef.current = true; }}>{t("actions.stop")}</button> : null}
              <button className="button primary" type="button" onClick={convertAll} disabled={running || !items.length || Boolean(renameError)}>{t("actions.convert")}</button>
              <button className="button secondary" type="button" onClick={downloadZip} disabled={running || !doneItems.length}>{t("actions.downloadZip")}</button>
            </div>
          </div>

          <Knowledge />
        </main>
        <ToolboxFooter appId="image-converter" />
      </div>
    </>
  );
}

function SettingsPanel({ settings, onChange, onReset }: { settings: ConversionSettings; onChange: (next: ConversionSettings) => void; onReset: () => void }) {
  const { t } = useTranslation();
  const patch = (next: Partial<ConversionSettings>) => onChange({ ...settings, ...next });
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
    {settings.format === "jpeg" && <Field label={t("settings.background")} tip={t("settings.backgroundTip")}><div className="color-row"><input type="color" value={settings.background} onChange={(event) => patch({ background: event.target.value })} /><input value={settings.background} pattern="#[0-9a-fA-F]{6}" onChange={(event) => /^#[0-9a-fA-F]{6}$/.test(event.target.value) && patch({ background: event.target.value })} /></div></Field>}
    <label className="check-row"><input type="checkbox" checked={settings.keepSmallerOriginal} onChange={(event) => patch({ keepSmallerOriginal: event.target.checked })} />{t("settings.keepSmaller")}</label>
    <label className="check-row"><input type="checkbox" checked={settings.preserveFolders} onChange={(event) => patch({ preserveFolders: event.target.checked })} />{t("settings.preserveFolders")}</label>
  </section>;
}

function RenamePanel({ rename, onChange, error, previews }: { rename: RenameSettings; onChange: (next: RenameSettings) => void; error: string | null; previews: Array<{ before: string; after: string }> }) {
  const { t } = useTranslation();
  const patch = (next: Partial<RenameSettings>) => onChange({ ...rename, ...next });
  return <section className="panel rename-panel">
    <div className="section-heading"><h2>{t("rename.title")}</h2><span className="soft-badge">Regex</span></div>
    <fieldset><legend>{t("rename.mode")}</legend><div className="segmented"><button type="button" className={rename.mode === "template" ? "active" : ""} aria-pressed={rename.mode === "template"} onClick={() => patch({ mode: "template" })}>{t("rename.templateMode")}</button><button type="button" className={rename.mode === "regex" ? "active" : ""} aria-pressed={rename.mode === "regex"} onClick={() => patch({ mode: "regex" })}>{t("rename.regexMode")}</button></div></fieldset>
    {rename.mode === "template" ? <Field label={t("rename.template")}><input value={rename.template} onChange={(event) => patch({ template: event.target.value })} /><small>{t("rename.tokens")}</small></Field> : <>
      <Field label={t("rename.pattern")}><div className="regex-input"><span>/</span><input value={rename.pattern} aria-invalid={Boolean(error)} onChange={(event) => patch({ pattern: event.target.value })} /><span>/</span></div></Field>
      <Field label={t("rename.replacement")} tip={t("rename.replacementTip")}><input value={rename.replacement} onChange={(event) => patch({ replacement: event.target.value })} /><small>{t("rename.tokens")}</small></Field>
      <div className="field-pair compact"><label className="check-row"><input type="checkbox" checked={rename.global} onChange={(event) => patch({ global: event.target.checked })} />{t("rename.global")}</label><label className="check-row"><input type="checkbox" checked={rename.ignoreCase} onChange={(event) => patch({ ignoreCase: event.target.checked })} />{t("rename.ignoreCase")}</label></div>
    </>}
    <div className="field-pair"><Field label={t("rename.start")}><input type="number" min="0" max="999999" value={rename.start} onChange={(event) => patch({ start: clamp(Number(event.target.value), 0, 999999) })} /></Field><Field label={t("rename.padding")}><input type="number" min="1" max="8" value={rename.padding} onChange={(event) => patch({ padding: clamp(Number(event.target.value), 1, 8) })} /></Field></div>
    {error && <p className="field-error" role="alert">{error === "invalid-regex" ? t("rename.invalid") : t("rename.empty")}</p>}
    <div className="rename-preview"><strong>{t("rename.preview")}</strong>{previews.length ? previews.map((entry) => <div key={entry.before}><span title={entry.before}>{entry.before}</span><b aria-hidden="true">→</b><code title={entry.after}>{entry.after}</code></div>) : <p>{t("rename.conflict")}</p>}</div>
  </section>;
}

function FileRow({ item, onRemove, disabled }: { item: QueueItem; onRemove: () => void; disabled: boolean }) {
  const { t } = useTranslation();
  const extension = getFileExtension(item.file.name);
  const canPreviewSource = extension !== "svg";
  const statusLabel = item.status === "error" ? t("queue.error") : t(`queue.${item.status}`);
  return <article className={`file-row status-${item.status}`}>
    <div className="thumbnail">{item.outputUrl ? <img src={item.outputUrl} alt="" /> : canPreviewSource ? <img src={item.sourceUrl} alt="" /> : <span>SVG</span>}</div>
    <div className="file-main"><strong title={item.relativePath}>{item.relativePath}</strong><div className="file-meta"><span>{formatBytes(item.file.size)}</span><span>{item.width ? `${item.width} × ${item.height}` : t("queue.unknownSize")}</span>{extension === "gif" && <span className="warning">{t("queue.firstFrame")}</span>}{extension === "svg" && <span className="warning">{t("queue.svgSafe")}</span>}</div>{item.outputName && <code title={item.outputName}>{item.outputName}</code>}{item.error && <p className="field-error">{item.error}</p>}</div>
    <div className="file-output"><span className={`status-badge ${item.status}`}>{statusLabel}</span>{item.output && <><strong>{formatBytes(item.output.size)}</strong><small>{item.outputWidth} × {item.outputHeight}{item.keptOriginal ? ` · ${t("queue.kept")}` : ""}</small></>}{item.output && item.outputName && <button className="text-button" type="button" onClick={() => triggerDownload(item.output!, item.outputName!.split("/").pop()!)}>{t("queue.download")}</button>}</div>
    <button className="icon-button" type="button" onClick={onRemove} disabled={disabled} aria-label={`${t("queue.remove")} ${item.file.name}`}>×</button>
  </article>;
}

function Knowledge() {
  const { t } = useTranslation();
  return <section className="knowledge"><div className="section-heading"><div><span className="eyebrow">JPEG · PNG · WebP</span><h2>{t("knowledge.title")}</h2><p>{t("knowledge.intro")}</p></div></div><div className="knowledge-grid"><KnowledgeCard title="JPEG" tone="peach">{t("knowledge.jpeg")}</KnowledgeCard><KnowledgeCard title="PNG" tone="blue">{t("knowledge.png")}</KnowledgeCard><KnowledgeCard title="WebP" tone="green">{t("knowledge.webp")}</KnowledgeCard></div><details><summary>{t("knowledge.animation")}</summary><p>{t("knowledge.metadata")}</p><p>{t("knowledge.color")}</p><p>{t("knowledge.browser")}</p></details></section>;
}

function KnowledgeCard({ title, tone, children }: { title: string; tone: string; children: ReactNode }) { return <article className={`knowledge-card ${tone}`}><strong>{title}</strong><p>{children}</p></article>; }
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
function clamp(value: number, min: number, max: number): number { return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min; }
function formatBytes(bytes: number): string { if (bytes < 1024) return `${bytes} B`; const units = ["KB", "MB", "GB"]; let value = bytes / 1024; let unit = units[0]; for (let i = 1; value >= 1024 && i < units.length; i += 1) { value /= 1024; unit = units[i]; } return `${value.toFixed(value >= 10 ? 1 : 2)} ${unit}`; }
function triggerDownload(blob: Blob, filename: string): void { const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }

export function App() { return <I18nProvider translations={translations}><AppSurface /></I18nProvider>; }
