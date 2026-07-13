import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { SelectMenu, type SelectOption } from "./SelectMenu";
import { triggerDownload } from "./lib/download";
import { convertMarkup, MARKUP_EXTENSIONS, type MarkupFormat } from "./lib/markup";
import { createZip } from "./lib/zip";

const FORMATS: MarkupFormat[] = ["markdown", "org", "rst", "asciidoc", "html", "txt"];
const FORMAT_BY_EXTENSION: Record<string, MarkupFormat> = { md: "markdown", markdown: "markdown", org: "org", rst: "rst", adoc: "asciidoc", asciidoc: "asciidoc", html: "html", htm: "html", txt: "txt" };
const SAMPLE = `# Local conversion

FormTran keeps **documents** in your browser.

- Parse structure
- Convert formats
- Preview the result

\`\`\`js
const privateByDefault = true
\`\`\``;

type TextDocument = { id: string; name: string; source: MarkupFormat; input: string };

export function TextMarkupConverter({ incoming }: { incoming?: { id: number; files: File[] } }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<TextDocument[]>([{ id: "sample", name: "document.md", source: "markdown", input: SAMPLE }]);
  const [activeId, setActiveId] = useState<string | null>("sample");
  const [draftSource, setDraftSource] = useState<MarkupFormat>("markdown");
  const [target, setTarget] = useState<MarkupFormat>("org");
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const incomingRef = useRef<number | null>(null);
  const active = documents.find((document) => document.id === activeId) ?? null;
  const source = active?.source ?? draftSource;
  const input = active?.input ?? "";
  const converted = useMemo(() => convertMarkup(input, source, target), [input, source, target]);
  const counts = useMemo(() => converted.blocks.reduce<Record<string, number>>((result, block) => ({ ...result, [block.type]: (result[block.type] ?? 0) + 1 }), {}), [converted.blocks]);
  const formatOptions = useMemo<SelectOption<MarkupFormat>[]>(() => FORMATS.map((format) => ({ value: format, label: t(`text.formats.${format}`) })), [t]);

  const patchActive = (patch: Partial<TextDocument>) => {
    if (!active) return;
    setDocuments((current) => current.map((document) => document.id === active.id ? { ...document, ...patch } : document));
  };
  const setInput = (value: string) => {
    if (active) { patchActive({ input: value }); return; }
    const document = { id: `draft-${Date.now()}`, name: `document.${MARKUP_EXTENSIONS[draftSource]}`, source: draftSource, input: value };
    setDocuments([document]); setActiveId(document.id);
  };
  const setSource = (next: MarkupFormat) => {
    if (active) patchActive({ source: next }); else setDraftSource(next);
  };
  const openFiles = async (files: File[]) => {
    const accepted = files.filter((file) => file.size <= 5 * 1024 * 1024).slice(0, Math.max(0, 100 - documents.length));
    const stamp = Date.now();
    const opened = await Promise.all(accepted.map(async (file, index): Promise<TextDocument> => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      return { id: `${stamp}-${index}-${file.lastModified}`, name: file.name, source: FORMAT_BY_EXTENSION[extension] ?? "txt", input: await file.text() };
    }));
    if (opened.length) {
      setDocuments((current) => [...current.filter((document) => document.id !== "sample"), ...opened]);
      setActiveId(opened[0].id);
    }
    const skipped = files.length - opened.length;
    setNotice(skipped ? t("text.skipped", { count: skipped }) : null);
  };
  const upload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...event.target.files ?? []]; event.target.value = ""; void openFiles(files);
  };
  useEffect(() => {
    if (!incoming || incomingRef.current === incoming.id) return;
    incomingRef.current = incoming.id;
    void openFiles(incoming.files);
  }, [incoming]);
  const remove = (id: string) => {
    const next = documents.filter((document) => document.id !== id);
    setDocuments(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  };
  const clear = () => { setDocuments([]); setActiveId(null); setNotice(null); };
  const swap = () => {
    if (active) patchActive({ source: target, input: converted.output, name: replaceExtension(active.name, target) });
    else setDraftSource(target);
    setTarget(source);
  };
  const copy = async () => {
    await navigator.clipboard?.writeText(converted.output);
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  };
  const download = () => {
    const name = replaceExtension(active?.name ?? "document.txt", target);
    triggerDownload(textBlob(converted.output, target), name);
  };
  const downloadAll = async () => {
    const used = new Map<string, number>();
    const entries = documents.map((document) => {
      const base = replaceExtension(document.name, target);
      const seen = used.get(base) ?? 0;
      used.set(base, seen + 1);
      const name = seen ? base.replace(/(\.[^.]+)$/, `-${seen + 1}$1`) : base;
      return { name, blob: textBlob(convertMarkup(document.input, document.source, target).output, target) };
    });
    triggerDownload(await createZip(entries), `formtran-text-${new Date().toISOString().slice(0, 10)}.zip`);
  };

  return <section className="tool-page text-page" role="tabpanel" id="panel-text" aria-labelledby="tab-text">
    <div className="tool-intro"><div><span className="eyebrow">TXT · MD · ORG · RST · ADOC · HTML</span><h2>{t("text.title")}</h2><p>{t("text.intro")}</p></div><div className="text-actions"><label className="button secondary compact">{t("text.openFile")}<input type="file" multiple accept=".txt,.md,.markdown,.org,.rst,.adoc,.asciidoc,.html,.htm,text/*" onChange={upload}/></label><button className="button secondary compact" type="button" disabled={!documents.length} onClick={clear}>{t("text.clear")}</button></div></div>
    <div className="text-workbench">
      <aside className="text-file-panel">
        <header><div><strong>{t("text.fileQueue")}</strong><small>{t("text.fileCount", { count: documents.length })}</small></div><button type="button" disabled={!documents.length} onClick={downloadAll}>{t("text.downloadAll")}</button></header>
        {notice && <p className="field-error" role="status">{notice}</p>}
        {!documents.length ? <div className="text-file-empty"><span>¶</span><p>{t("text.fileEmpty")}</p></div> : <div className="text-file-list">{documents.map((document) => <div className={document.id === activeId ? "active" : ""} key={document.id}><button className="text-file-select" type="button" onClick={() => setActiveId(document.id)}><span><strong>{document.name}</strong><small>{t(`text.formats.${document.source}`)} · {document.input.length.toLocaleString()} {t("text.characters")}</small></span></button><button className="text-file-remove" type="button" aria-label={`${t("text.remove")} ${document.name}`} onClick={() => remove(document.id)}>×</button></div>)}</div>}
      </aside>
      <div className="text-main">
        <div className="format-flow">
          <label><span>{t("text.source")}</span><SelectMenu value={source} options={formatOptions} onChange={setSource} ariaLabel={t("text.source")}/></label>
          <button type="button" onClick={swap} aria-label={t("text.swap")}>⇄</button>
          <label><span>{t("text.target")}</span><SelectMenu value={target} options={formatOptions} onChange={setTarget} ariaLabel={t("text.target")} align="right"/></label>
        </div>
        <div className="editor-grid">
          <section className="editor-card"><header><div><strong>{t("text.input")}</strong><small>{active?.name ?? t("text.newDocument")} · {input.length.toLocaleString()} {t("text.characters")}</small></div></header><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-label={t("text.input")}/></section>
          <section className="editor-card"><header><div><strong>{t("text.output")}</strong><small>{converted.blocks.length} {t("text.blocks")} · {converted.output.length.toLocaleString()} {t("text.characters")}</small></div><div><button type="button" onClick={copy} disabled={!input}>{copied ? t("text.copied") : t("text.copy")}</button><button type="button" onClick={download} disabled={!input}>{t("text.download")}</button></div></header><textarea value={converted.output} readOnly spellCheck={false} aria-label={t("text.output")}/></section>
        </div>
      </div>
    </div>
    <div className="text-inspector-grid">
      <section className="structure-card"><div className="section-heading"><div><h3>{t("text.structure")}</h3><p>{t("text.structureHint")}</p></div></div>{converted.blocks.length ? <div className="structure-chips">{Object.entries(counts).map(([type, count]) => <span key={type}><b>{count}</b>{t(`text.blockTypes.${type}`)}</span>)}</div> : <div className="compact-empty"><p>{t("text.noStructure")}</p></div>}</section>
      <section className="markup-preview"><div className="section-heading"><div><h3>{t("text.preview")}</h3><p>{t("text.previewHint")}</p></div></div>{target === "html" ? <iframe sandbox="" title={t("text.preview")} srcDoc={converted.output}/> : <pre>{converted.output || t("text.emptyPreview")}</pre>}</section>
    </div>
    <p className="roundtrip-note">{t("text.roundtrip")}</p>
  </section>;
}

function replaceExtension(name: string, format: MarkupFormat): string {
  return `${name.replace(/\.[^.]+$/, "") || "document"}.${MARKUP_EXTENSIONS[format]}`;
}

function textBlob(output: string, target: MarkupFormat): Blob {
  return new Blob([output], { type: target === "html" ? "text/html;charset=utf-8" : "text/plain;charset=utf-8" });
}
