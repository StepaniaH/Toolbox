import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { FilePicker } from "./FilePicker";
import {
  FILE_HOME_MAX_FILES, FILE_HOME_MAX_TOTAL_BYTES, identifyFile,
  type FileFamily, type IdentifiedFile,
} from "./lib/file-identification";

type HomeFile = { id: string; file: File; relativePath: string; identified: IdentifiedFile | null; error?: string };
type IncomingHomeFile = { file: File; relativePath: string };
type ImagePreset = "default" | "web" | "transparent" | "privacy";
type ToolStatus = "available" | "limited" | "planned";
type Tool = { id: string; status: ToolStatus; action?: "image" | "gif" | "text" | "data" | "base64" | "pdf" | "archive" };

const FAMILY_ORDER: FileFamily[] = ["image", "gif", "pdf", "text", "data", "archive", "unknown"];
const DIRECT_IMAGE_FORMATS = new Set(["JPEG", "PNG", "WebP", "AVIF", "BMP", "SVG", "HEIC"]);
const DIRECT_TEXT_FORMATS = new Set(["TXT", "Markdown", "HTML", "ORG", "RST", "ADOC", "ASCIIDOC"]);
const SAFE_IMAGE_PREVIEW_FORMATS = new Set(["JPEG", "PNG", "WebP", "AVIF", "BMP", "GIF"]);

const TOOLS: Record<FileFamily, Tool[]> = {
  image: [
    { id: "convert", status: "available", action: "image" }, { id: "compress", status: "available", action: "image" },
    { id: "resize", status: "available", action: "image" }, { id: "info", status: "available" },
    { id: "metadata", status: "available", action: "image" }, { id: "base64", status: "available", action: "base64" },
    { id: "compose", status: "available", action: "gif" }, { id: "rotate", status: "available", action: "image" },
    { id: "crop", status: "planned" }, { id: "stitch", status: "planned" }, { id: "favicon", status: "planned" }, { id: "watermark", status: "planned" },
  ],
  gif: [
    { id: "firstFrame", status: "limited", action: "image" }, { id: "info", status: "available" },
    { id: "extract", status: "planned" }, { id: "gifCompress", status: "planned" }, { id: "speed", status: "planned" },
    { id: "crop", status: "planned" }, { id: "resize", status: "planned" }, { id: "video", status: "planned" }, { id: "animated", status: "planned" },
  ],
  text: [
    { id: "convert", status: "available", action: "text" }, { id: "preview", status: "available", action: "text" },
    { id: "info", status: "available" }, { id: "diff", status: "planned" }, { id: "encoding", status: "planned" },
  ],
  data: [
    { id: "convert", status: "available", action: "data" }, { id: "format", status: "planned" },
    { id: "diff", status: "planned" }, { id: "stats", status: "planned" }, { id: "encoding", status: "planned" },
  ],
  pdf: [
    { id: "merge", status: "available", action: "pdf" }, { id: "split", status: "available", action: "pdf" },
    { id: "deletePages", status: "available", action: "pdf" }, { id: "extractPages", status: "available", action: "pdf" },
    { id: "reorder", status: "available", action: "pdf" }, { id: "rotatePages", status: "available", action: "pdf" },
    { id: "pdfImages", status: "planned" }, { id: "info", status: "available", action: "pdf" },
  ],
  archive: [
    { id: "archiveList", status: "available", action: "archive" }, { id: "extractAll", status: "available", action: "archive" }, { id: "extractSome", status: "available", action: "archive" },
  ],
  unknown: [{ id: "info", status: "available" }],
};

export function FileHome({ hidden, onOpenImage, onOpenGif, onOpenText, onOpenData, onOpenPdf, onOpenArchive }: {
  hidden?: boolean;
  onOpenImage: (files: File[], preset: ImagePreset) => void;
  onOpenGif: (files: File[]) => void;
  onOpenText: (files: File[]) => void;
  onOpenData: (files: File[]) => void;
  onOpenPdf: (files: File[]) => void;
  onOpenArchive: (files: File[]) => void;
}) {
  const { t } = useTranslation();
  const [items, setItems] = useState<HomeFile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDetailsElement>(null);
  const itemsRef = useRef(items); itemsRef.current = items;
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const family = selected?.identified?.family ?? "unknown";
  const checkedItems = items.filter((item) => checkedIds.has(item.id));
  const checkedFamilyItems = checkedItems.filter((item) => (item.identified?.family ?? "unknown") === family);
  const actionItems = checkedFamilyItems.length ? checkedFamilyItems : selected ? [selected] : [];
  const groups = useMemo(() => FAMILY_ORDER.map((groupFamily) => ({
    family: groupFamily,
    items: items.filter((item) => (item.identified?.family ?? "unknown") === groupFamily),
  })).filter((group) => group.items.length), [items]);
  const totalBytes = items.reduce((sum, item) => sum + item.file.size, 0);
  const tools = useMemo(() => TOOLS[family].map((tool) => {
    if (family === "image" && selected?.identified && !DIRECT_IMAGE_FORMATS.has(selected.identified.format) && tool.action && tool.action !== "base64") return { ...tool, status: "planned" as const, action: undefined };
    if (family === "text" && selected?.identified && !DIRECT_TEXT_FORMATS.has(selected.identified.format) && tool.action === "text") return { ...tool, status: "limited" as const };
    if (family === "data" && selected?.identified && !["CSV", "TSV", "XLSX"].includes(selected.identified.format) && tool.action === "data") return { ...tool, status: "planned" as const, action: undefined };
    return tool;
  }), [family, selected]);

  const addFiles = async (incoming: IncomingHomeFile[]) => {
    const existing = new Set(itemsRef.current.map((item) => `${item.relativePath}:${item.file.size}:${item.file.lastModified}`));
    const accepted: HomeFile[] = [];
    let skipped = 0;
    let total = itemsRef.current.reduce((sum, item) => sum + item.file.size, 0);
    for (const incomingItem of incoming) {
      const { file } = incomingItem;
      const relativePath = incomingItem.relativePath || file.webkitRelativePath || file.name;
      const key = `${relativePath}:${file.size}:${file.lastModified}`;
      if (!file.size || existing.has(key) || itemsRef.current.length + accepted.length >= FILE_HOME_MAX_FILES || total + file.size > FILE_HOME_MAX_TOTAL_BYTES) { skipped += 1; continue; }
      total += file.size; existing.add(key);
      accepted.push({ id: `${Date.now()}-${accepted.length}-${file.lastModified}`, file, relativePath, identified: null });
    }
    if (accepted.length) {
      setItems((current) => [...current, ...accepted]);
      setSelectedId((current) => current ?? accepted[0].id);
      void Promise.all(accepted.map(async (item) => {
        try {
          const identified = await identifyFile(item.file);
          setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, identified } : entry));
        } catch {
          setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, error: t("home.readError") } : entry));
        }
      }));
    }
    setNotice(t("home.importResult", { accepted: accepted.length, skipped }));
  };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    void addFiles([...event.target.files ?? []].map((file) => ({ file, relativePath: file.webkitRelativePath || file.name })));
    event.target.value = "";
    if (pickerRef.current) pickerRef.current.open = false;
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault(); setDragging(false);
    void collectDroppedFiles(event.dataTransfer).then(addFiles);
  };
  const remove = (id: string) => {
    const next = items.filter((item) => item.id !== id); setItems(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
    setCheckedIds((current) => { const nextChecked = new Set(current); nextChecked.delete(id); return nextChecked; });
    if (previewId === id) setPreviewId(null);
    setBase64(null);
  };
  const clear = () => { setItems([]); setSelectedId(null); setCheckedIds(new Set()); setPreviewId(null); setNotice(null); setBase64(null); };
  const compatible = (target: FileFamily) => items.filter((item) => item.identified?.family === target).map((item) => item.file);
  const toggleChecked = (id: string) => setCheckedIds((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  const toggleGroup = (groupItems: HomeFile[]) => setCheckedIds((current) => {
    const next = new Set(current);
    const allChecked = groupItems.every((item) => next.has(item.id));
    groupItems.forEach((item) => {
      if (allChecked) next.delete(item.id);
      else next.add(item.id);
    });
    return next;
  });
  const toggleAll = () => setCheckedIds((current) => current.size === items.length ? new Set() : new Set(items.map((item) => item.id)));

  const activate = async (tool: Tool) => {
    if (!selected || tool.status === "planned") return;
    const scopedFiles = actionItems.map((item) => item.file);
    if (tool.action === "image") onOpenImage(scopedFiles, tool.id === "compress" ? "web" : tool.id === "metadata" ? "privacy" : "default");
    if (tool.action === "gif") onOpenGif(scopedFiles.length >= 2 ? scopedFiles : compatible("image"));
    if (tool.action === "text") onOpenText(scopedFiles);
    if (tool.action === "data") onOpenData(scopedFiles.slice(0, 1));
    if (tool.action === "pdf") onOpenPdf(tool.id === "merge" && scopedFiles.length < 2 ? compatible("pdf") : scopedFiles);
    if (tool.action === "archive") onOpenArchive(scopedFiles.slice(0, 1));
    if (tool.action === "base64") {
      if (selected.file.size > 10 * 1024 * 1024) { setNotice(t("home.base64Limit")); return; }
      const reader = new FileReader();
      reader.onload = () => setBase64(String(reader.result));
      reader.onerror = () => setNotice(t("home.readError"));
      reader.readAsDataURL(selected.file);
    }
  };
  const readyTools = tools.filter((tool) => tool.status !== "planned");
  const plannedTools = tools.filter((tool) => tool.status === "planned");
  const toolRow = (tool: Tool) => <div className="tool-row" key={tool.id}><div><strong>{t(`home.tools.${tool.id}.title`)}</strong><p>{t(`home.tools.${tool.id}.detail`)}</p></div><span className={`capability ${tool.status}`}>{t(`home.status.${tool.status}`)}</span>{tool.action && tool.status !== "planned" ? <button className="button secondary compact" type="button" onClick={() => void activate(tool)}>{t(tool.action === "base64" ? "home.generate" : "home.openTool")}</button> : <span className="tool-row-placeholder">{tool.status === "planned" ? t("home.notOpen") : t("home.shownHere")}</span>}</div>;

  return <section className="file-home" role="tabpanel" id="panel-home" aria-labelledby="tab-home" hidden={hidden}>
    <div className={`file-home-intake ${dragging ? "is-dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
      <div><span className="eyebrow">LOCAL TASK DESK</span><h2>{t("home.title")}</h2><p>{t("home.intro")}</p></div>
      <details className="unified-picker" ref={pickerRef}><summary className="button primary"><span className="file-picker-icon" aria-hidden="true">＋</span>{t("home.addContent")}</summary><div><FilePicker label={t("home.chooseFiles")} multiple variant="secondary" onChange={onInput}/><FilePicker label={t("home.chooseFolder")} multiple directory variant="secondary" onChange={onInput}/><small>{t("home.pickerHint")}</small></div></details>
    </div>
    {notice && <p className="home-notice" role="status">{notice}</p>}
    {!items.length ? <EmptyOverview/> : <>
      <div className="file-router">
        <aside className="home-file-panel">
          <header><div><strong>{t("home.queue")}</strong><small>{t("home.fileCount", { count: items.length })}</small></div><div className="home-queue-actions"><button type="button" onClick={toggleAll}>{t(checkedIds.size === items.length ? "home.clearSelection" : "home.selectAll")}</button><button type="button" onClick={clear}>{t("home.clear")}</button></div></header>
          <div className="home-file-list">{groups.map((group) => <section className="home-family-group" key={group.family}><label><input type="checkbox" checked={group.items.every((item) => checkedIds.has(item.id))} onChange={() => toggleGroup(group.items)}/><span className={`family-dot family-${group.family}`}/><strong>{t(`home.families.${group.family}`)}</strong><small>{group.items.length}</small></label>{group.items.map((item) => <div className={`home-file-row ${item.id === selected?.id ? "active" : ""}`} key={item.id}><input type="checkbox" checked={checkedIds.has(item.id)} onChange={() => toggleChecked(item.id)} aria-label={`${t("home.selectFile")} ${item.file.name}`}/><button type="button" onClick={() => { setSelectedId(item.id); setBase64(null); }}><span><strong>{item.relativePath}</strong><small>{item.identified ? `${item.identified.format} · ${formatBytes(item.file.size)}` : t("home.identifying")}</small></span></button><button className="home-remove" type="button" onClick={() => remove(item.id)} aria-label={`${t("home.remove")} ${item.file.name}`}>×</button></div>)}</section>)}</div>
        </aside>
        <div className="home-recommendations">
          {selected && <><header className="file-summary"><div><span className="eyebrow">{t(`home.families.${family}`)}</span><h3>{selected.relativePath}</h3><p>{t(checkedIds.size ? "home.scopeSelected" : "home.scopeSingle", { count: actionItems.length })}</p></div><dl><div><dt>{t("home.format")}</dt><dd>{selected.identified?.format ?? "—"}</dd></div><div><dt>{t("home.size")}</dt><dd>{formatBytes(selected.file.size)}</dd></div><div><dt>{t("home.recognition")}</dt><dd>{selected.identified ? t(`home.sources.${selected.identified.source}`) : t("home.identifying")}</dd></div></dl><button className="button secondary compact" type="button" onClick={() => setPreviewId(selected.id)}>{t("home.previewFile")}</button></header>
          {selected.error && <p className="field-error">{selected.error}</p>}
          {selected.identified?.mismatch && <p className="capability-warning">{t("home.mismatch")}</p>}
          {family === "image" && <section className="home-presets"><div><strong>{t("home.presets.title")}</strong><small>{t("home.presets.detail")}</small></div><div><button type="button" onClick={() => onOpenImage(actionItems.map((item) => item.file), "web")}><strong>{t("home.presets.web.title")}</strong><small>{t("home.presets.web.detail")}</small></button><button type="button" onClick={() => onOpenImage(actionItems.map((item) => item.file), "transparent")}><strong>{t("home.presets.transparent.title")}</strong><small>{t("home.presets.transparent.detail")}</small></button><button type="button" onClick={() => onOpenImage(actionItems.map((item) => item.file), "privacy")}><strong>{t("home.presets.privacy.title")}</strong><small>{t("home.presets.privacy.detail")}</small></button></div></section>}
          <div className="tool-list"><div className="tool-list-heading"><div><h3>{t("home.recommended")}</h3><p>{t("home.recommendedHint")}</p></div><span>{t("home.noAutoRun")}</span></div>{readyTools.map(toolRow)}{plannedTools.length > 0 && <details className="planned-tools" open={!readyTools.length}><summary>{t("home.plannedTools", { count: plannedTools.length })}</summary>{plannedTools.map(toolRow)}</details>}</div>
          {base64 && <section className="base64-result"><div><strong>{t("home.base64Result")}</strong><button className="text-button" type="button" onClick={() => void navigator.clipboard?.writeText(base64)}>{t("home.copy")}</button></div><textarea readOnly value={base64} aria-label={t("home.base64Result")}/></section>}</>}
        </div>
      </div>
      <SessionOverview items={items} groups={groups} selectedCount={checkedIds.size || (selected ? 1 : 0)} totalBytes={totalBytes}/>
    </>}
    {previewId && <HomePreviewDialog item={items.find((item) => item.id === previewId) ?? null} onClose={() => setPreviewId(null)}/>}
  </section>;
}

function EmptyOverview() {
  const { t } = useTranslation();
  const families: FileFamily[] = ["image", "gif", "pdf", "text", "data", "archive"];
  return <div className="home-overview"><div><strong>{t("home.howTitle")}</strong><p>{t("home.howDetail")}</p></div><div className="family-overview">{families.map((family) => <div key={family}><span className={`family-dot family-${family}`}/><strong>{t(`home.families.${family}`)}</strong><small>{t(`home.familyFormats.${family}`)}</small></div>)}</div></div>;
}

function SessionOverview({ items, groups, selectedCount, totalBytes }: { items: HomeFile[]; groups: { family: FileFamily; items: HomeFile[] }[]; selectedCount: number; totalBytes: number }) {
  const { t } = useTranslation();
  return <section className="home-session-overview" aria-live="polite"><header><div><span className="eyebrow">{t("home.liveOverview")}</span><h3>{t("home.overviewTitle")}</h3></div><dl><div><dt>{t("home.files")}</dt><dd>{items.length}</dd></div><div><dt>{t("home.types")}</dt><dd>{groups.length}</dd></div><div><dt>{t("home.selected")}</dt><dd>{selectedCount}</dd></div><div><dt>{t("home.totalSize")}</dt><dd>{formatBytes(totalBytes)}</dd></div></dl></header><div className="family-distribution" aria-label={t("home.distribution")}>{groups.map((group) => <span className={`family-${group.family}`} style={{ flexGrow: group.items.length }} title={`${t(`home.families.${group.family}`)} · ${group.items.length}`} key={group.family}/>)}</div><div className="overview-legend">{groups.map((group) => <span key={group.family}><i className={`family-dot family-${group.family}`}/>{t(`home.families.${group.family}`)} <b>{group.items.length}</b></span>)}</div><p>{t("home.outputStageNote")}</p></section>;
}

function HomePreviewDialog({ item, onClose }: { item: HomeFile | null; onClose: () => void }) {
  const { t } = useTranslation();
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const family = item?.identified?.family ?? "unknown";
  const canPreviewImage = Boolean(item?.identified && SAFE_IMAGE_PREVIEW_FORMATS.has(item.identified.format));
  const canPreviewText = family === "text" || (family === "data" && item?.identified?.format !== "XLSX");
  useEffect(() => {
    if (!item) return;
    if (canPreviewImage) {
      const url = URL.createObjectURL(item.file); setSourceUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    if (canPreviewText) {
      let active = true;
      void item.file.slice(0, 128 * 1024).text().then((value) => { if (active) setTextPreview(value); }).catch(() => { if (active) setTextPreview(t("home.previewUnavailable")); });
      return () => { active = false; };
    }
  }, [canPreviewImage, canPreviewText, item, t]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!item) return null;
  return <div className="preview-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="home-preview-dialog" role="dialog" aria-modal="true" aria-labelledby="home-preview-title"><header><div><span className="eyebrow">{t("home.localPreview")}</span><h2 id="home-preview-title">{item.relativePath}</h2></div><button autoFocus type="button" className="icon-button" onClick={onClose} aria-label={t("preview.close")}>×</button></header><div className="home-preview-content">{sourceUrl ? <img src={sourceUrl} alt={item.file.name}/> : textPreview !== null ? <pre>{textPreview || t("home.emptyText")}</pre> : <div className="preview-placeholder"><span className={`family-dot family-${family}`}/><strong>{item.identified?.format ?? t("home.families.unknown")}</strong><p>{t("home.previewUnavailable")}</p></div>}</div><dl><div><dt>{t("home.format")}</dt><dd>{item.identified?.format ?? "—"}</dd></div><div><dt>{t("home.size")}</dt><dd>{formatBytes(item.file.size)}</dd></div><div><dt>{t("home.recognition")}</dt><dd>{item.identified ? t(`home.sources.${item.identified.source}`) : t("home.identifying")}</dd></div></dl></section></div>;
}

type DroppedEntry = {
  name: string;
  isFile: boolean;
  isDirectory: boolean;
  file?: (success: (file: File) => void, error?: () => void) => void;
  createReader?: () => { readEntries: (success: (entries: DroppedEntry[]) => void, error?: () => void) => void };
};

export async function collectDroppedFiles(dataTransfer: DataTransfer): Promise<IncomingHomeFile[]> {
  const entries = [...dataTransfer.items].map((item) => (item as DataTransferItem & { webkitGetAsEntry?: () => DroppedEntry | null }).webkitGetAsEntry?.()).filter((entry): entry is DroppedEntry => Boolean(entry));
  if (!entries.length) return [...dataTransfer.files].map((file) => ({ file, relativePath: file.webkitRelativePath || file.name }));
  const files: IncomingHomeFile[] = [];
  for (const entry of entries) files.push(...await readDroppedEntry(entry, ""));
  return files;
}

async function readDroppedEntry(entry: DroppedEntry, parent: string): Promise<IncomingHomeFile[]> {
  const path = parent ? `${parent}/${entry.name}` : entry.name;
  if (entry.isFile && entry.file) {
    const file = await new Promise<File>((resolve, reject) => entry.file?.(resolve, reject));
    return [{ file, relativePath: path }];
  }
  if (!entry.isDirectory || !entry.createReader) return [];
  const reader = entry.createReader();
  const children: DroppedEntry[] = [];
  for (;;) {
    const batch = await new Promise<DroppedEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
    if (!batch.length) break;
    children.push(...batch);
  }
  const files: IncomingHomeFile[] = [];
  for (const child of children) files.push(...await readDroppedEntry(child, path));
  return files;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
