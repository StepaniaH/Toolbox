import { useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { triggerDownload } from "./lib/download";
import { convertMarkup, MARKUP_EXTENSIONS, type MarkupFormat } from "./lib/markup";

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

export function TextMarkupConverter() {
  const { t } = useTranslation();
  const [source, setSource] = useState<MarkupFormat>("markdown");
  const [target, setTarget] = useState<MarkupFormat>("org");
  const [input, setInput] = useState(SAMPLE);
  const [filename, setFilename] = useState("document.md");
  const [copied, setCopied] = useState(false);
  const converted = useMemo(() => convertMarkup(input, source, target), [input, source, target]);
  const counts = useMemo(() => converted.blocks.reduce<Record<string, number>>((result, block) => ({ ...result, [block.type]: (result[block.type] ?? 0) + 1 }), {}), [converted.blocks]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || file.size > 5 * 1024 * 1024) return;
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    setSource(FORMAT_BY_EXTENSION[extension] ?? "txt");
    setFilename(file.name);
    setInput(await file.text());
  };
  const swap = () => {
    setInput(converted.output);
    setSource(target);
    setTarget(source);
    setFilename(`document.${MARKUP_EXTENSIONS[target]}`);
  };
  const copy = async () => {
    await navigator.clipboard?.writeText(converted.output);
    setCopied(true); setTimeout(() => setCopied(false), 1200);
  };
  const download = () => triggerDownload(new Blob([converted.output], { type: target === "html" ? "text/html;charset=utf-8" : "text/plain;charset=utf-8" }), `${filename.replace(/\.[^.]+$/, "") || "document"}.${MARKUP_EXTENSIONS[target]}`);

  return <section className="tool-page text-page" role="tabpanel" id="panel-text" aria-labelledby="tab-text">
    <div className="tool-intro"><div><span className="eyebrow">TXT · MD · ORG · RST · ADOC · HTML</span><h2>{t("text.title")}</h2><p>{t("text.intro")}</p></div><div className="text-actions"><label className="button secondary compact">{t("text.openFile")}<input type="file" accept=".txt,.md,.markdown,.org,.rst,.adoc,.asciidoc,.html,.htm,text/*" onChange={upload}/></label><button className="button secondary compact" type="button" onClick={() => { setInput(""); setFilename("document.txt"); }}>{t("text.clear")}</button></div></div>
    <div className="format-flow">
      <label><span>{t("text.source")}</span><select value={source} onChange={(event) => setSource(event.target.value as MarkupFormat)}>{FORMATS.map((format) => <option key={format} value={format}>{t(`text.formats.${format}`)}</option>)}</select></label>
      <button type="button" onClick={swap} aria-label={t("text.swap")}>⇄</button>
      <label><span>{t("text.target")}</span><select value={target} onChange={(event) => setTarget(event.target.value as MarkupFormat)}>{FORMATS.map((format) => <option key={format} value={format}>{t(`text.formats.${format}`)}</option>)}</select></label>
    </div>
    <div className="editor-grid">
      <section className="editor-card"><header><div><strong>{t("text.input")}</strong><small>{filename} · {input.length.toLocaleString()} {t("text.characters")}</small></div></header><textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-label={t("text.input")}/></section>
      <section className="editor-card"><header><div><strong>{t("text.output")}</strong><small>{converted.blocks.length} {t("text.blocks")} · {converted.output.length.toLocaleString()} {t("text.characters")}</small></div><div><button type="button" onClick={copy}>{copied ? t("text.copied") : t("text.copy")}</button><button type="button" onClick={download}>{t("text.download")}</button></div></header><textarea value={converted.output} readOnly spellCheck={false} aria-label={t("text.output")}/></section>
    </div>
    <div className="text-inspector-grid">
      <section className="panel structure-card"><div className="section-heading"><div><h3>{t("text.structure")}</h3><p>{t("text.structureHint")}</p></div></div>{converted.blocks.length ? <div className="structure-chips">{Object.entries(counts).map(([type, count]) => <span key={type}><b>{count}</b>{t(`text.blockTypes.${type}`)}</span>)}</div> : <div className="compact-empty"><p>{t("text.noStructure")}</p></div>}</section>
      <section className="panel markup-preview"><div className="section-heading"><div><h3>{t("text.preview")}</h3><p>{t("text.previewHint")}</p></div></div>{target === "html" ? <iframe sandbox="" title={t("text.preview")} srcDoc={converted.output}/> : <pre>{converted.output || t("text.emptyPreview")}</pre>}</section>
    </div>
    <p className="roundtrip-note">{t("text.roundtrip")}</p>
  </section>;
}
