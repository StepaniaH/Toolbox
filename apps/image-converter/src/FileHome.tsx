import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { FilePicker } from "./FilePicker";
import {
  FILE_HOME_MAX_FILES, FILE_HOME_MAX_TOTAL_BYTES, identifyFile,
  type FileFamily, type IdentifiedFile,
} from "./lib/file-identification";

type HomeFile = { id: string; file: File; relativePath: string; identified: IdentifiedFile | null; error?: string };
type ImagePreset = "default" | "web" | "transparent" | "privacy";
type ToolStatus = "available" | "limited" | "planned";
type Tool = { id: string; status: ToolStatus; action?: "image" | "gif" | "text" | "data" | "base64" | "pdf" | "archive" };

const DIRECT_IMAGE_FORMATS = new Set(["JPEG", "PNG", "WebP", "AVIF", "BMP", "SVG", "HEIC"]);
const DIRECT_TEXT_FORMATS = new Set(["TXT", "Markdown", "HTML", "ORG", "RST", "ADOC", "ASCIIDOC"]);

const TOOLS: Record<FileFamily, Tool[]> = {
  image: [
    { id: "convert", status: "available", action: "image" },
    { id: "compress", status: "available", action: "image" },
    { id: "resize", status: "available", action: "image" },
    { id: "info", status: "available" },
    { id: "metadata", status: "available", action: "image" },
    { id: "base64", status: "available", action: "base64" },
    { id: "compose", status: "available", action: "gif" },
    { id: "rotate", status: "available", action: "image" }, { id: "crop", status: "planned" },
    { id: "stitch", status: "planned" }, { id: "favicon", status: "planned" }, { id: "watermark", status: "planned" },
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
    { id: "merge", status: "planned" }, { id: "split", status: "planned" }, { id: "deletePages", status: "planned" },
    { id: "extractPages", status: "planned" }, { id: "reorder", status: "planned" }, { id: "rotatePages", status: "planned" },
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
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const itemsRef = useRef(items); itemsRef.current = items;
  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;
  const family = selected?.identified?.family ?? "unknown";
  const tools = useMemo(() => TOOLS[family].map((tool) => {
    if (family === "image" && selected?.identified && !DIRECT_IMAGE_FORMATS.has(selected.identified.format) && tool.action && tool.action !== "base64") return { ...tool, status: "planned" as const, action: undefined };
    if (family === "text" && selected?.identified && !DIRECT_TEXT_FORMATS.has(selected.identified.format) && tool.action === "text") return { ...tool, status: "limited" as const };
    if (family === "data" && selected?.identified && !["CSV", "TSV", "XLSX"].includes(selected.identified.format) && tool.action === "data") return { ...tool, status: "planned" as const, action: undefined };
    return tool;
  }), [family, selected]);

  const addFiles = async (incoming: File[]) => {
    const existing = new Set(itemsRef.current.map((item) => `${item.relativePath}:${item.file.size}:${item.file.lastModified}`));
    const accepted: HomeFile[] = [];
    let skipped = 0;
    let total = itemsRef.current.reduce((sum, item) => sum + item.file.size, 0);
    for (const file of incoming) {
      const relativePath = file.webkitRelativePath || file.name;
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
  const onInput = (event: ChangeEvent<HTMLInputElement>) => { void addFiles([...event.target.files ?? []]); event.target.value = ""; };
  const onDrop = (event: DragEvent) => { event.preventDefault(); setDragging(false); void addFiles([...event.dataTransfer.files]); };
  const remove = (id: string) => {
    const next = items.filter((item) => item.id !== id); setItems(next);
    if (selectedId === id) setSelectedId(next[0]?.id ?? null);
    setBase64(null);
  };
  const clear = () => { setItems([]); setSelectedId(null); setNotice(null); setBase64(null); };
  const compatible = (target: FileFamily) => items.filter((item) => item.identified?.family === target).map((item) => item.file);

  const activate = async (tool: Tool) => {
    if (!selected || tool.status === "planned") return;
    if (tool.action === "image") onOpenImage([selected.file], tool.id === "compress" ? "web" : tool.id === "metadata" ? "privacy" : "default");
    if (tool.action === "gif") onOpenGif(compatible("image"));
    if (tool.action === "text") onOpenText([selected.file]);
    if (tool.action === "data") onOpenData([selected.file]);
    if (tool.action === "pdf") onOpenPdf([selected.file]);
    if (tool.action === "archive") onOpenArchive([selected.file]);
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
      <div><span className="eyebrow">LOCAL FILE ROUTER</span><h2>{t("home.title")}</h2><p>{t("home.intro")}</p></div>
      <div className="home-intake-actions"><FilePicker label={t("home.chooseFiles")} multiple onChange={onInput}/><FilePicker label={t("home.chooseFolder")} multiple directory variant="secondary" onChange={onInput}/></div>
    </div>
    {notice && <p className="home-notice" role="status">{notice}</p>}
    {!items.length ? <EmptyOverview/> : <div className="file-router">
      <aside className="home-file-panel">
        <header><div><strong>{t("home.queue")}</strong><small>{t("home.fileCount", { count: items.length })}</small></div><button type="button" onClick={clear}>{t("home.clear")}</button></header>
        <div className="home-file-list">{items.map((item) => <div className={item.id === selected?.id ? "active" : ""} key={item.id}><button type="button" onClick={() => { setSelectedId(item.id); setBase64(null); }}><span className={`family-dot family-${item.identified?.family ?? "unknown"}`}/><span><strong>{item.relativePath}</strong><small>{item.identified ? `${item.identified.format} · ${formatBytes(item.file.size)}` : t("home.identifying")}</small></span></button><button className="home-remove" type="button" onClick={() => remove(item.id)} aria-label={`${t("home.remove")} ${item.file.name}`}>×</button></div>)}</div>
      </aside>
      <div className="home-recommendations">
        {selected && <><header className="file-summary"><div><span className="eyebrow">{t(`home.families.${family}`)}</span><h3>{selected.relativePath}</h3></div><dl><div><dt>{t("home.format")}</dt><dd>{selected.identified?.format ?? "—"}</dd></div><div><dt>{t("home.size")}</dt><dd>{formatBytes(selected.file.size)}</dd></div><div><dt>{t("home.recognition")}</dt><dd>{selected.identified ? t(`home.sources.${selected.identified.source}`) : t("home.identifying")}</dd></div></dl></header>
        {selected.error && <p className="field-error">{selected.error}</p>}
        {selected.identified?.mismatch && <p className="capability-warning">{t("home.mismatch")}</p>}
        {family === "image" && <section className="home-presets"><div><strong>{t("home.presets.title")}</strong><small>{t("home.presets.detail")}</small></div><div><button type="button" onClick={() => onOpenImage([selected.file], "web")}><strong>{t("home.presets.web.title")}</strong><small>{t("home.presets.web.detail")}</small></button><button type="button" onClick={() => onOpenImage([selected.file], "transparent")}><strong>{t("home.presets.transparent.title")}</strong><small>{t("home.presets.transparent.detail")}</small></button><button type="button" onClick={() => onOpenImage([selected.file], "privacy")}><strong>{t("home.presets.privacy.title")}</strong><small>{t("home.presets.privacy.detail")}</small></button></div></section>}
        <div className="tool-list"><div className="tool-list-heading"><div><h3>{t("home.recommended")}</h3><p>{t("home.recommendedHint")}</p></div><span>{t("home.noAutoRun")}</span></div>{readyTools.map(toolRow)}{plannedTools.length > 0 && <details className="planned-tools" open={!readyTools.length}><summary>{t("home.plannedTools", { count: plannedTools.length })}</summary>{plannedTools.map(toolRow)}</details>}</div>
        {base64 && <section className="base64-result"><div><strong>{t("home.base64Result")}</strong><button className="text-button" type="button" onClick={() => void navigator.clipboard?.writeText(base64)}>{t("home.copy")}</button></div><textarea readOnly value={base64} aria-label={t("home.base64Result")}/></section>}</>}
      </div>
    </div>}
  </section>;
}

function EmptyOverview() {
  const { t } = useTranslation();
  const families: FileFamily[] = ["image", "gif", "pdf", "text", "data", "archive"];
  return <div className="home-overview"><div><strong>{t("home.howTitle")}</strong><p>{t("home.howDetail")}</p></div><div className="family-overview">{families.map((family) => <div key={family}><span className={`family-dot family-${family}`}/><strong>{t(`home.families.${family}`)}</strong><small>{t(`home.familyFormats.${family}`)}</small></div>)}</div></div>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
