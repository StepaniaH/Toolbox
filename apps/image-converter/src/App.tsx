import {
  useCallback, useEffect, useMemo, useRef, useState,
  type ChangeEvent, type DragEvent, type KeyboardEvent, type ReactNode,
} from "react";
import { I18nProvider, useTranslation } from "@toolbox/i18n/react";
import { NavBar } from "@toolbox/nav";
import { AppIcon } from "@toolbox/nav/AppIcon.tsx";
import { ToolboxFooter } from "@toolbox/nav/ToolboxFooter.tsx";
import { translations } from "./i18n";
import { ACCEPT_ATTRIBUTE, convertImage, getFileExtension } from "./lib/convert";
import { selectIncomingFiles } from "./lib/file-selection";
import {
  buildOutputName, insertToken, inspectRegexMatch, makeUniquePath, validateRename,
} from "./lib/rename";
import type { ConversionSettings, QueueItem, RejectedFile, RenameSettings } from "./lib/types";
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
const RENAME_TOKENS = ["{name}", "{index}", "{format}", "{width}", "{height}"] as const;
const REGEX_PRESETS = [
  { id: "camera", pattern: "^(?:IMG|DSC|PXL)[_-]?(.*)$", replacement: "$1-{index}", global: false, ignoreCase: true },
  { id: "separators", pattern: "[\\s_]+", replacement: "-", global: true, ignoreCase: false },
  { id: "copy", pattern: "\\s*\\(\\d+\\)$", replacement: "", global: false, ignoreCase: true },
] as const;
type StoredSettings = { conversion: ConversionSettings; rename: RenameSettings };
type AppTab = "workspace" | "knowledge";
type NamePreview = { before: string; after: string; matched: boolean; groups: string[] };

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
  const [rejections, setRejections] = useState<RejectedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("workspace");
  const [previewId, setPreviewId] = useState<string | null>(null);
  const cancelRef = useRef(false);
  const itemRef = useRef(items);
  itemRef.current = items;

  useEffect(() => {
    document.title = activeTab === "knowledge" ? `${t("tabs.knowledge")} · ${t("brand.title")}` : t("meta.title");
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

  const downloadZip = async () => {
    const entries = doneItems.flatMap((item) => item.output && item.outputName ? [{ name: item.outputName, blob: item.output }] : []);
    if (!entries.length) return;
    triggerDownload(await createZip(entries), `toolbox-images-${new Date().toISOString().slice(0, 10)}.zip`);
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

        <AppTabs active={activeTab} onChange={setActiveTab} />

        <main>
          {activeTab === "workspace" ? (
            <section className="workspace" role="tabpanel" id="panel-workspace" aria-labelledby="tab-workspace">
              <section className={`drop-zone ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
                <div className="drop-icon" aria-hidden="true">↥</div>
                <div><h2>{t("upload.drop")}</h2><p>{t("upload.hint")}</p><small>{t("upload.accepted")}</small></div>
                <div className="upload-actions">
                  <label className="button primary">{t("upload.files")}<input aria-label={t("upload.files")} type="file" accept={ACCEPT_ATTRIBUTE} multiple onChange={onInput} /></label>
                  <label className="button secondary">{t("upload.folder")}<input aria-label={t("upload.folder")} type="file" accept={ACCEPT_ATTRIBUTE} multiple {...({ webkitdirectory: "" } as Record<string, string>)} onChange={onInput} /></label>
                </div>
              </section>
              {rejections.length > 0 && <RejectionNotice files={rejections} onDismiss={() => setRejections([])} />}

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
                    {items.map((item) => <FileRow key={item.id} item={item} onRemove={() => removeItem(item.id)} onPreview={() => setPreviewId(item.id)} disabled={running} />)}
                  </div>
                )}
              </section>

              {doneItems.length > 0 && <ResultGallery items={doneItems} onPreview={setPreviewId} />}

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
            </section>
          ) : (
            <KnowledgePage />
          )}
        </main>
        <ToolboxFooter appId="image-converter" />
      </div>
      {previewId && <PreviewDialog items={doneItems} activeId={previewId} onChange={setPreviewId} onClose={() => setPreviewId(null)} />}
    </>
  );
}

function AppTabs({ active, onChange }: { active: AppTab; onChange: (tab: AppTab) => void }) {
  const { t } = useTranslation();
  const tabs: AppTab[] = ["workspace", "knowledge"];
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
    <div className="section-heading"><div><h2>{t("rename.title")}</h2><p>{t("rename.subtitle")}</p></div><span className="soft-badge">Regex</span></div>
    <fieldset><legend>{t("rename.mode")}</legend><div className="segmented"><button type="button" className={rename.mode === "template" ? "active" : ""} aria-pressed={rename.mode === "template"} onClick={() => patch({ mode: "template" })}>{t("rename.templateMode")}</button><button type="button" className={rename.mode === "regex" ? "active" : ""} aria-pressed={rename.mode === "regex"} onClick={() => patch({ mode: "regex" })}>{t("rename.regexMode")}</button></div></fieldset>
    {rename.mode === "template" ? <>
      <Field label={t("rename.template")}><input ref={templateRef} value={rename.template} onChange={(event) => patch({ template: event.target.value })} /></Field>
      <TokenChips onInsert={(token) => insert("template", token)} />
    </> : <>
      <div className="regex-guide"><span><b>1</b>{t("rename.steps.match")}</span><i>→</i><span><b>2</b>{t("rename.steps.replace")}</span><i>→</i><span><b>3</b>{t("rename.steps.check")}</span></div>
      <div className="preset-block"><span className="field-label">{t("rename.presets")}</span><div className="preset-buttons">{REGEX_PRESETS.map((preset) => <button type="button" key={preset.id} onClick={() => patch({ mode: "regex", pattern: preset.pattern, replacement: preset.replacement, global: preset.global, ignoreCase: preset.ignoreCase })}><strong>{t(`rename.preset.${preset.id}.title`)}</strong><small>{t(`rename.preset.${preset.id}.description`)}</small></button>)}</div></div>
      <Field label={t("rename.pattern")}><div className="regex-input"><span>/</span><input value={rename.pattern} aria-invalid={Boolean(error)} onChange={(event) => patch({ pattern: event.target.value })} /><span>/{rename.global ? "g" : ""}{rename.ignoreCase ? "i" : ""}</span></div></Field>
      <Field label={t("rename.replacement")} tip={t("rename.replacementTip")}><input ref={replacementRef} value={rename.replacement} onChange={(event) => patch({ replacement: event.target.value })} /></Field>
      <TokenChips onInsert={(token) => insert("replacement", token)} />
      <div className="field-pair compact"><label className="check-row"><input type="checkbox" checked={rename.global} onChange={(event) => patch({ global: event.target.checked })} />{t("rename.global")}</label><label className="check-row"><input type="checkbox" checked={rename.ignoreCase} onChange={(event) => patch({ ignoreCase: event.target.checked })} />{t("rename.ignoreCase")}</label></div>
    </>}
    <div className="field-pair"><Field label={t("rename.start")}><input type="number" min="0" max="999999" value={rename.start} onChange={(event) => patch({ start: clamp(Number(event.target.value), 0, 999999) })} /></Field><Field label={t("rename.padding")}><input type="number" min="1" max="8" value={rename.padding} onChange={(event) => patch({ padding: clamp(Number(event.target.value), 1, 8) })} /></Field></div>
    {error && <p className="field-error" role="alert">{error === "invalid-regex" ? t("rename.invalid") : t("rename.empty")}</p>}
    <div className="rename-preview">
      <div className="preview-heading"><strong>{t("rename.preview")}</strong>{rename.mode === "regex" && <span>{t("rename.matchSummary", { matched, total: previews.length })}</span>}</div>
      {previews.length ? previews.map((entry) => <div className={!entry.matched ? "is-unmatched" : ""} key={entry.before}><span title={entry.before}>{entry.before}</span><b aria-hidden="true">→</b><code title={entry.after}>{entry.after}</code>{rename.mode === "regex" && <em>{entry.matched ? t("rename.matched") : t("rename.unmatched")}{entry.groups.length ? ` · ${entry.groups.map((group, index) => `$${index + 1}=${group}`).join(" · ")}` : ""}</em>}</div>) : <p>{t("rename.conflict")}</p>}
    </div>
  </section>;
}

function TokenChips({ onInsert }: { onInsert: (token: string) => void }) {
  const { t } = useTranslation();
  return <div className="token-picker"><span>{t("rename.tokens")}</span><div>{RENAME_TOKENS.map((token) => <button type="button" key={token} onClick={() => onInsert(token)} title={t(`rename.token.${token.slice(1, -1)}`)}><code>{token}</code><small>{t(`rename.token.${token.slice(1, -1)}`)}</small></button>)}</div></div>;
}

function FileRow({ item, onRemove, onPreview, disabled }: { item: QueueItem; onRemove: () => void; onPreview: () => void; disabled: boolean }) {
  const { t } = useTranslation();
  const extension = getFileExtension(item.file.name);
  const canPreviewSource = extension !== "svg";
  const statusLabel = item.status === "error" ? t("queue.error") : t(`queue.${item.status}`);
  return <article className={`file-row status-${item.status}`}>
    <div className="thumbnail">{canPreviewSource ? <img src={item.sourceUrl} alt="" /> : <span>SVG</span>}</div>
    <div className="file-main"><strong title={item.relativePath}>{item.relativePath}</strong><div className="file-meta"><span>{formatBytes(item.file.size)}</span><span>{item.width ? `${item.width} × ${item.height}` : t("queue.unknownSize")}</span>{extension === "gif" && <span className="warning">{t("queue.firstFrame")}</span>}{extension === "svg" && <span className="warning">{t("queue.svgSafe")}</span>}</div>{item.outputName && <code title={item.outputName}>{item.outputName}</code>}{item.error && <p className="field-error">{item.error}</p>}</div>
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
  return <section className="knowledge-page" role="tabpanel" id="panel-knowledge" aria-labelledby="tab-knowledge">
    <header className="knowledge-hero"><span className="eyebrow">JPEG · PNG · WebP · GIF · AVIF · SVG · BMP</span><h2>{t("knowledge.title")}</h2><p>{t("knowledge.intro")}</p></header>
    <section className="decision-guide"><h3>{t("knowledge.chooseTitle")}</h3><div><KnowledgeChoice icon="◉" title={t("knowledge.choose.photo.title")}>{t("knowledge.choose.photo.body")}</KnowledgeChoice><KnowledgeChoice icon="◇" title={t("knowledge.choose.transparent.title")}>{t("knowledge.choose.transparent.body")}</KnowledgeChoice><KnowledgeChoice icon="↗" title={t("knowledge.choose.vector.title")}>{t("knowledge.choose.vector.body")}</KnowledgeChoice><KnowledgeChoice icon="▶" title={t("knowledge.choose.animation.title")}>{t("knowledge.choose.animation.body")}</KnowledgeChoice></div></section>
    <section className="format-library"><div className="section-heading"><div><h3>{t("knowledge.libraryTitle")}</h3><p>{t("knowledge.librarySubtitle")}</p></div></div><div className="format-cards">{formats.map((format) => <article key={format}><header><strong>{format.toUpperCase()}</strong><span>{t(`knowledge.formats.${format}.type`)}</span></header><p>{t(`knowledge.formats.${format}.body`)}</p><dl><div><dt>{t("knowledge.bestFor")}</dt><dd>{t(`knowledge.formats.${format}.best`)}</dd></div><div><dt>{t("knowledge.watchFor")}</dt><dd>{t(`knowledge.formats.${format}.warning`)}</dd></div></dl></article>)}</div></section>
    <section className="comparison"><h3>{t("knowledge.tableTitle")}</h3><div><table><thead><tr><th>{t("knowledge.table.format")}</th><th>{t("knowledge.table.compression")}</th><th>{t("knowledge.table.transparency")}</th><th>{t("knowledge.table.animation")}</th><th>{t("knowledge.table.compatibility")}</th></tr></thead><tbody><tr><th>JPEG</th><td>{t("knowledge.values.lossy")}</td><td>—</td><td>—</td><td>{t("knowledge.values.high")}</td></tr><tr><th>PNG</th><td>{t("knowledge.values.lossless")}</td><td>✓</td><td>—</td><td>{t("knowledge.values.high")}</td></tr><tr><th>WebP</th><td>{t("knowledge.values.both")}</td><td>✓</td><td>✓</td><td>{t("knowledge.values.modern")}</td></tr><tr><th>GIF</th><td>{t("knowledge.values.losslessLimited")}</td><td>{t("knowledge.values.limited")}</td><td>✓</td><td>{t("knowledge.values.high")}</td></tr><tr><th>AVIF</th><td>{t("knowledge.values.both")}</td><td>✓</td><td>✓</td><td>{t("knowledge.values.modern")}</td></tr><tr><th>SVG</th><td>{t("knowledge.values.vector")}</td><td>✓</td><td>{t("knowledge.values.scripted")}</td><td>{t("knowledge.values.mixed")}</td></tr></tbody></table></div></section>
    <section className="knowledge-faq"><h3>{t("knowledge.boundariesTitle")}</h3><details open><summary>{t("knowledge.animation")}</summary><p>{t("knowledge.animationDetail")}</p></details><details><summary>{t("knowledge.metadataTitle")}</summary><p>{t("knowledge.metadata")}</p></details><details><summary>{t("knowledge.colorTitle")}</summary><p>{t("knowledge.color")}</p></details><details><summary>{t("knowledge.browserTitle")}</summary><p>{t("knowledge.browser")}</p></details></section>
  </section>;
}

function KnowledgeChoice({ icon, title, children }: { icon: string; title: string; children: ReactNode }) { return <article><span aria-hidden="true">{icon}</span><div><strong>{title}</strong><p>{children}</p></div></article>; }
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
