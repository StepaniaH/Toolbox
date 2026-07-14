import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { SelectMenu } from "./SelectMenu";
import { triggerDownload } from "./lib/download";
import {
  OUTPUT_DIRECT_DOWNLOAD_LIMIT, OUTPUT_ZIP_MAX_BYTES, outputExtension,
  type TaskOutput,
} from "./lib/output-registry";
import type { FileFamily } from "./lib/file-identification";
import { createZip } from "./lib/zip";

type OutputScope = "selected" | "family" | "all";
type ExportMode = "direct" | "zip";

const FAMILY_ORDER: FileFamily[] = ["image", "gif", "pdf", "text", "data", "archive", "unknown"];
const SAFE_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "avif", "bmp", "gif"]);
const TEXT_PREVIEW_EXTENSIONS = new Set(["txt", "md", "markdown", "org", "rst", "adoc", "asciidoc", "html", "htm", "csv", "tsv", "json", "yaml", "yml", "xml"]);

export function OutputDesk({ outputs, notice, onRename, onBatchRename, onRemove, onClear }: {
  outputs: TaskOutput[];
  notice?: string | null;
  onRename: (id: string, name: string) => void;
  onBatchRename: (ids: string[], template: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [scope, setScope] = useState<OutputScope>("all");
  const [family, setFamily] = useState<FileFamily>("image");
  const [template, setTemplate] = useState("{name}-{index}");
  const [exportMode, setExportMode] = useState<ExportMode>("zip");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const groups = useMemo(() => FAMILY_ORDER.map((groupFamily) => ({
    family: groupFamily,
    outputs: outputs.filter((output) => output.family === groupFamily),
  })).filter((group) => group.outputs.length), [outputs]);
  const totalBytes = outputs.reduce((sum, output) => sum + output.blob.size, 0);
  const targets = scope === "selected"
    ? outputs.filter((output) => checkedIds.has(output.id))
    : scope === "family"
      ? outputs.filter((output) => output.family === family)
      : outputs;

  useEffect(() => {
    const available = new Set(outputs.map((output) => output.id));
    setCheckedIds((current) => new Set([...current].filter((id) => available.has(id))));
    if (!outputs.some((output) => output.id === previewId)) setPreviewId(null);
    if (!groups.some((group) => group.family === family) && groups[0]) setFamily(groups[0].family);
  }, [family, groups, outputs, previewId]);

  const toggle = (id: string) => setCheckedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const toggleGroup = (items: TaskOutput[]) => setCheckedIds((current) => {
    const next = new Set(current);
    const allChecked = items.every((output) => next.has(output.id));
    items.forEach((output) => { if (allChecked) next.delete(output.id); else next.add(output.id); });
    return next;
  });

  const exportOutputs = async () => {
    if (!targets.length || busy) return;
    setError(null);
    if (exportMode === "direct" && targets.length > OUTPUT_DIRECT_DOWNLOAD_LIMIT) {
      setError(t("outputs.directLimit", { count: OUTPUT_DIRECT_DOWNLOAD_LIMIT }));
      return;
    }
    setBusy(true);
    try {
      if (exportMode === "direct") {
        targets.forEach((output) => triggerDownload(output.blob, output.name));
      } else {
        const bytes = targets.reduce((sum, output) => sum + output.blob.size, 0);
        if (bytes > OUTPUT_ZIP_MAX_BYTES) throw new Error("zip-budget");
        const archive = await createZip(targets.map((output) => ({ name: `${output.family}/${output.name}`, blob: output.blob })));
        triggerDownload(archive, `formtran-results-${new Date().toISOString().slice(0, 10)}.zip`);
      }
    } catch (reason) {
      setError(reason instanceof Error && reason.message === "zip-budget" ? t("outputs.zipLimit") : t("outputs.exportError"));
    } finally {
      setBusy(false);
    }
  };

  const scopeOptions = (["selected", "family", "all"] as const).map((value) => ({ value, label: t(`outputs.scopes.${value}`) }));
  const familyOptions = groups.map((group) => ({ value: group.family, label: t(`home.families.${group.family}`) }));
  const exportOptions = (["direct", "zip"] as const).map((value) => ({ value, label: t(`outputs.exportModes.${value}.title`) }));

  return <section className="output-desk" aria-live="polite">
    <header className="output-desk-heading">
      <div><span className="eyebrow">LOCAL OUTPUTS</span><h3>{t("outputs.title")}</h3><p>{t("outputs.intro")}</p></div>
      <dl><div><dt>{t("outputs.files")}</dt><dd>{outputs.length}</dd></div><div><dt>{t("outputs.families")}</dt><dd>{groups.length}</dd></div><div><dt>{t("outputs.totalSize")}</dt><dd>{formatBytes(totalBytes)}</dd></div></dl>
    </header>
    {notice && <p className="field-error output-error" role="alert">{notice}</p>}
    {!outputs.length ? <div className="output-empty"><span aria-hidden="true">⇣</span><div><strong>{t("outputs.emptyTitle")}</strong><p>{t("outputs.emptyDetail")}</p></div></div> : <>
      <div className="output-controls">
        <section className="output-control-group">
          <span className="field-label">{t("outputs.scope")}</span>
          <div className="output-control-main output-scope-main"><SelectMenu value={scope} onChange={setScope} ariaLabel={t("outputs.scope")} options={scopeOptions}/>{scope === "family" && <SelectMenu value={family} onChange={setFamily} ariaLabel={t("outputs.family")} options={familyOptions}/>}</div>
          <small className="output-control-hint">{t("outputs.targetCount", { count: targets.length })}</small>
        </section>
        <section className="output-control-group">
          <span className="field-label">{t("outputs.renameTemplate")}</span>
          <div className="output-control-main output-rename-main"><input aria-label={t("outputs.renameTemplate")} value={template} onChange={(event) => setTemplate(event.target.value)} placeholder="{name}-{index}"/><button className="button secondary compact" type="button" disabled={!targets.length || !template.trim()} onClick={() => onBatchRename(targets.map((output) => output.id), template)}>{t("outputs.applyRename")}</button></div>
          <small className="output-control-hint">{t("outputs.renameHint")}</small>
        </section>
        <section className="output-control-group">
          <span className="field-label">{t("outputs.exportAs")}</span>
          <div className="output-control-main output-export-main"><SelectMenu value={exportMode} onChange={setExportMode} ariaLabel={t("outputs.exportAs")} options={exportOptions} align="right"/><button className="button primary compact" type="button" disabled={!targets.length || busy} onClick={() => void exportOutputs()}>{busy ? t("outputs.exporting") : t("outputs.export", { count: targets.length })}</button></div>
          <small className="output-control-hint">{t(`outputs.exportModes.${exportMode}.detail`)}</small>
        </section>
      </div>
      {error && <p className="field-error output-error" role="alert">{error}</p>}
      <div className="output-groups">{groups.map((group) => <section className="output-family-group" key={group.family}>
        <header><label><input type="checkbox" checked={group.outputs.every((output) => checkedIds.has(output.id))} onChange={() => toggleGroup(group.outputs)}/><span className={`family-dot family-${group.family}`}/><strong>{t(`home.families.${group.family}`)}</strong><small>{group.outputs.length}</small></label></header>
        <div>{group.outputs.map((output) => <div className="output-row" key={output.id}>
          <input type="checkbox" checked={checkedIds.has(output.id)} onChange={() => toggle(output.id)} aria-label={`${t("outputs.select")} ${output.name}`}/>
          <button className="output-preview-trigger" type="button" onClick={() => setPreviewId(output.id)}><span><strong>{output.name}</strong><small>{t(`tabs.${output.tool}`)} · {formatBytes(output.blob.size)}{output.sourceName ? ` · ${t("outputs.from")} ${output.sourceName}` : ""}</small></span></button>
          <OutputNameEditor key={output.name} output={output} onCommit={onRename}/>
          <button type="button" className="output-row-action" onClick={() => triggerDownload(output.blob, output.name)} aria-label={`${t("outputs.downloadOne")} ${output.name}`}>↓</button>
          <button type="button" className="output-row-action" onClick={() => onRemove(output.id)} aria-label={`${t("outputs.remove")} ${output.name}`}>×</button>
        </div>)}</div>
      </section>)}</div>
      <footer className="output-desk-footer"><p>{t("outputs.memoryNote")}</p><button className="text-button" type="button" onClick={onClear}>{t("outputs.clear")}</button></footer>
    </>}
    {previewId && <OutputPreview output={outputs.find((output) => output.id === previewId) ?? null} onClose={() => setPreviewId(null)}/>}
  </section>;
}

function OutputNameEditor({ output, onCommit }: { output: TaskOutput; onCommit: (id: string, name: string) => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(output.name);
  const commit = () => onCommit(output.id, value);
  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") event.currentTarget.blur();
    if (event.key === "Escape") { setValue(output.name); event.currentTarget.blur(); }
  };
  return <label className="output-name-editor"><span className="sr-only">{t("outputs.renameOne")}</span><input value={value} onChange={(event) => setValue(event.target.value)} onBlur={commit} onKeyDown={onKeyDown}/></label>;
}

function OutputPreview({ output, onClose }: { output: TaskOutput | null; onClose: () => void }) {
  const { t } = useTranslation();
  const [url, setUrl] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const extension = output ? outputExtension(output.name) : "";
  const canShowImage = Boolean(output && SAFE_IMAGE_EXTENSIONS.has(extension) && output.blob.type.startsWith("image/"));
  const canShowText = Boolean(output && (output.blob.type.startsWith("text/") || TEXT_PREVIEW_EXTENSIONS.has(extension)));
  useEffect(() => {
    if (!output) return;
    if (canShowImage) {
      const nextUrl = URL.createObjectURL(output.blob); setUrl(nextUrl);
      return () => URL.revokeObjectURL(nextUrl);
    }
    if (canShowText) {
      let active = true;
      void readBlobText(output.blob.slice(0, 128 * 1024)).then((value) => { if (active) setText(value); }).catch(() => { if (active) setText(t("outputs.previewUnavailable")); });
      return () => { active = false; };
    }
  }, [canShowImage, canShowText, output, t]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!output) return null;
  return <div className="preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="home-preview-dialog output-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="output-preview-title">
    <header><div><span className="eyebrow">{t("outputs.preview")}</span><h2 id="output-preview-title">{output.name}</h2></div><button autoFocus type="button" className="preview-close" onClick={onClose} aria-label={t("outputs.closePreview")}>×</button></header>
    <div className="home-preview-meta"><span>{t(`home.families.${output.family}`)}</span><span>{formatBytes(output.blob.size)}</span><span>{output.blob.type || t("outputs.unknownMime")}</span></div>
    <div className="home-preview-content">{url ? <img src={url} alt={output.name}/> : text !== null ? <pre>{text || t("home.emptyText")}</pre> : <div className="preview-unavailable"><span>{outputExtension(output.name).toUpperCase() || "FILE"}</span><p>{t("outputs.previewUnavailable")}</p></div>}</div>
  </section></div>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readBlobText(blob: Blob): Promise<string> {
  if (typeof blob.text === "function") return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("blob-read-failed"));
    reader.readAsText(blob);
  });
}
