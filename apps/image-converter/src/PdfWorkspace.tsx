import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { FilePicker } from "./FilePicker";
import { SelectMenu } from "./SelectMenu";
import { triggerDownload } from "./lib/download";
import type { OutputDraft } from "./lib/output-registry";
import {
  PDF_MAX_FILES, PDF_MAX_SPLIT_PAGES, inspectPdfDocument, mergePdfFiles,
  parsePageOrder, parsePageSelection, rewritePdf, splitPdfPages,
  type PdfDocumentDetails,
} from "./lib/pdf-tools";
import { createZip } from "./lib/zip";

type Incoming = { id: number; files: File[] };
type PdfSource = { id: string; file: File; details: PdfDocumentDetails | null; error?: string };
type PdfOperation = "extract" | "remove" | "reorder" | "rotate" | "split";
type PdfResult = { blob: Blob; name: string; summary: string };

export function PdfWorkspace({ hidden, incoming, onOutput }: { hidden?: boolean; incoming?: Incoming; onOutput?: (drafts: OutputDraft[]) => unknown }) {
  const { t } = useTranslation();
  const [sources, setSources] = useState<PdfSource[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [operation, setOperation] = useState<PdfOperation>("extract");
  const [pageInput, setPageInput] = useState("1");
  const [rotation, setRotation] = useState<90 | 180 | 270>(90);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<PdfResult | null>(null);
  const sourcesRef = useRef(sources);
  sourcesRef.current = sources;
  const selected = sources.find((source) => source.id === selectedId) ?? sources[0] ?? null;
  const readySources = sources.filter((source) => source.details && !source.error);
  const commitResult = (next: PdfResult, sourceName?: string) => {
    setResult(next);
    onOutput?.([{ blob: next.blob, name: next.name, sourceName, family: next.name.endsWith(".zip") ? "archive" : "pdf", tool: "pdf" }]);
  };

  const addFiles = async (incomingFiles: File[]) => {
    const existing = new Set(sourcesRef.current.map((source) => `${source.file.name}:${source.file.size}:${source.file.lastModified}`));
    const accepted: PdfSource[] = [];
    let skipped = 0;
    for (const file of incomingFiles) {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      if (!file.size || existing.has(key) || sourcesRef.current.length + accepted.length >= PDF_MAX_FILES) { skipped += 1; continue; }
      existing.add(key);
      accepted.push({ id: `${Date.now()}-${accepted.length}-${file.lastModified}`, file, details: null });
    }
    if (!accepted.length) { setNotice(t("pdf.importResult", { accepted: 0, skipped })); return; }
    setSources((current) => [...current, ...accepted]);
    setSelectedId((current) => current ?? accepted[0].id);
    setNotice(t("pdf.importResult", { accepted: accepted.length, skipped }));
    setResult(null); setError(null);
    for (const source of accepted) {
      try {
        const details = await inspectPdfDocument(source.file);
        setSources((current) => current.map((entry) => entry.id === source.id ? { ...entry, details } : entry));
      } catch (reason) {
        const key = errorKey(reason);
        setSources((current) => current.map((entry) => entry.id === source.id ? { ...entry, error: key } : entry));
      }
    }
  };

  useEffect(() => {
    if (incoming?.files.length) void addFiles(incoming.files);
  }, [incoming?.id]);

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    void addFiles([...event.target.files ?? []]);
    event.target.value = "";
  };
  const clear = () => { setSources([]); setSelectedId(null); setNotice(null); setError(null); setResult(null); };
  const remove = (id: string) => {
    const next = sources.filter((source) => source.id !== id);
    setSources(next); setSelectedId((current) => current === id ? next[0]?.id ?? null : current); setResult(null);
  };
  const move = (index: number, offset: number) => {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= sources.length) return;
    const next = [...sources];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setSources(next); setResult(null);
  };

  const runMerge = async () => {
    if (readySources.length < 2) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const blob = await mergePdfFiles(readySources.map((source) => source.file));
      commitResult({ blob, name: `formtran-merged-${dateStamp()}.pdf`, summary: t("pdf.resultMerge", { count: readySources.length, size: formatBytes(blob.size) }) });
    } catch (reason) { setError(errorKey(reason)); }
    finally { setBusy(false); }
  };

  const runOperation = async () => {
    if (!selected?.details || selected.error) return;
    setBusy(true); setError(null); setResult(null);
    try {
      const pageCount = selected.details.pageCount;
      const stem = safeStem(selected.file.name);
      if (operation === "split") {
        const pages = await splitPdfPages(selected.file);
        const width = String(pages.length).length;
        const blob = await createZip(pages.map((page, index) => ({ name: `${stem}-page-${String(index + 1).padStart(width, "0")}.pdf`, blob: page })));
        commitResult({ blob, name: `${stem}-split.zip`, summary: t("pdf.resultSplit", { count: pages.length, size: formatBytes(blob.size) }) }, selected.file.name);
        return;
      }
      const selectedPages = operation === "reorder" ? parsePageOrder(pageInput, pageCount) : parsePageSelection(pageInput, pageCount);
      const allPages = Array.from({ length: pageCount }, (_, index) => index);
      const selectedSet = new Set(selectedPages);
      const pageIndices = operation === "extract" ? selectedPages : operation === "remove" ? allPages.filter((index) => !selectedSet.has(index)) : allPages;
      if (!pageIndices.length) throw new Error("pdf-no-pages");
      const blob = await rewritePdf(selected.file, {
        pageIndices: operation === "reorder" ? selectedPages : pageIndices,
        rotateIndices: operation === "rotate" ? selectedSet : undefined,
        rotation: operation === "rotate" ? rotation : undefined,
      });
      const suffix = operation === "extract" ? "extracted" : operation === "remove" ? "trimmed" : operation === "reorder" ? "reordered" : `rotated-${rotation}`;
      commitResult({ blob, name: `${stem}-${suffix}.pdf`, summary: t("pdf.resultPages", { count: pageIndices.length, size: formatBytes(blob.size) }) }, selected.file.name);
    } catch (reason) { setError(errorKey(reason)); }
    finally { setBusy(false); }
  };

  const operationOptions = (["extract", "remove", "reorder", "rotate", "split"] as const).map((value) => ({
    value, label: t(`pdf.operations.${value}.title`), description: t(`pdf.operations.${value}.detail`),
  }));

  return <section className="family-page" role="tabpanel" id="panel-pdf" aria-labelledby="tab-pdf" hidden={hidden}>
    <header className="family-header"><div><span className="eyebrow">PDF WORKSPACE</span><h2>{t("pdf.title")}</h2><p>{t("pdf.intro")}</p></div><div className="family-actions"><FilePicker label={t("pdf.open")} accept=".pdf,application/pdf" multiple onChange={onInput}/>{sources.length > 0 && <button className="button secondary" type="button" onClick={clear}>{t("pdf.clear")}</button>}</div></header>
    {notice && <p className="home-notice" role="status">{notice}</p>}
    {!sources.length ? <div className="family-empty"><span>PDF</span><h3>{t("pdf.emptyTitle")}</h3><p>{t("pdf.emptyDetail")}</p></div> : <>
      <section className="pdf-document-queue" aria-label={t("pdf.queueTitle")}>
        <header><div><h3>{t("pdf.queueTitle")}</h3><p>{t("pdf.queueHint")}</p></div><button className="button secondary compact" type="button" disabled={busy || readySources.length < 2} onClick={() => void runMerge()}>{busy ? t("pdf.working") : t("pdf.mergeAction", { count: readySources.length })}</button></header>
        <div className="pdf-document-list">{sources.map((source, index) => <div className={source.id === selected?.id ? "active" : ""} key={source.id}>
          <button type="button" onClick={() => { setSelectedId(source.id); setResult(null); setError(null); }}><span className="family-dot family-pdf"/><span><strong>{source.file.name}</strong><small>{source.details ? t("pdf.documentMeta", { pages: source.details.pageCount, size: formatBytes(source.file.size) }) : source.error ? t(`pdf.errors.${source.error}`) : t("pdf.reading")}</small></span></button>
          <div className="pdf-row-actions"><button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`${t("pdf.moveEarlier")} ${source.file.name}`}>↑</button><button type="button" disabled={index === sources.length - 1} onClick={() => move(index, 1)} aria-label={`${t("pdf.moveLater")} ${source.file.name}`}>↓</button><button type="button" onClick={() => remove(source.id)} aria-label={`${t("home.remove")} ${source.file.name}`}>×</button></div>
        </div>)}</div>
      </section>
      {selected && <div className="inspection-workbench">
        <div className="inspection-title"><div><span className="family-dot family-pdf"/><strong>{selected.file.name}</strong><small>{formatBytes(selected.file.size)}</small></div><span className={`capability ${selected.details ? "available" : selected.error ? "planned" : "limited"}`}>{selected.details ? t("pdf.ready") : selected.error ? t("pdf.unavailable") : t("pdf.reading")}</span></div>
        {selected.error && <p className="field-error" role="alert">{t(`pdf.errors.${selected.error}`)}</p>}
        {selected.details && <><dl className="inspection-grid">
          <Stat label={t("pdf.version")} value={`PDF ${selected.details.inspection.version}`}/><Stat label={t("pdf.pages")} value={String(selected.details.pageCount)}/><Stat label={t("pdf.objects")} value={String(selected.details.inspection.objectCount)}/><Stat label={t("pdf.encrypted")} value={t("pdf.no")}/><Stat label={t("pdf.linearized")} value={t(selected.details.inspection.linearized ? "pdf.yes" : "pdf.no")}/><Stat label={t("pdf.metadata")} value={t(selected.details.inspection.metadata ? "pdf.yes" : "pdf.no")}/><Stat label={t("pdf.mediaBox")} value={selected.details.firstPageSize ? `${Math.round(selected.details.firstPageSize[0])} × ${Math.round(selected.details.firstPageSize[1])} pt` : "—"}/>
        </dl>
        <section className="pdf-operation-panel">
          <div><span className="field-label">{t("pdf.operation")}</span><SelectMenu value={operation} onChange={(value) => { setOperation(value); setResult(null); setError(null); }} ariaLabel={t("pdf.operation")} options={operationOptions}/></div>
          {operation !== "split" && <label className="field"><span className="field-label">{t(operation === "reorder" ? "pdf.pageOrder" : "pdf.pageSelection")}</span><input value={pageInput} onChange={(event) => setPageInput(event.target.value)} placeholder={operation === "reorder" ? t("pdf.orderExample") : t("pdf.selectionExample")}/><small>{t(operation === "reorder" ? "pdf.orderHint" : "pdf.selectionHint", { count: selected.details.pageCount })}</small></label>}
          {operation === "rotate" && <fieldset><legend>{t("pdf.rotation")}</legend><div className="segmented rotation-options">{([90, 180, 270] as const).map((value) => <button type="button" className={rotation === value ? "active" : ""} aria-pressed={rotation === value} onClick={() => setRotation(value)} key={value}>{value}°</button>)}</div></fieldset>}
          {operation === "split" && <p className="boundary-note">{t("pdf.splitHint", { count: PDF_MAX_SPLIT_PAGES })}</p>}
          <button className="button primary" type="button" disabled={busy} onClick={() => void runOperation()}>{busy ? t("pdf.working") : t("pdf.run")}</button>
        </section>
        <p className="boundary-note">{t("pdf.rewriteWarning")}</p></>}
      </div>}
      {error && <p className="field-error pdf-global-error" role="alert">{t(`pdf.errors.${error}`)}</p>}
      {result && <section className="pdf-result" aria-live="polite"><div><span className="eyebrow">{t("pdf.result")}</span><strong>{result.name}</strong><small>{result.summary}</small></div><button className="button secondary" type="button" onClick={() => triggerDownload(result.blob, result.name)}>{t("pdf.download")}</button></section>}
    </>}
    <section className="planned-family-tools"><header><h3>{t("pdf.renderingTitle")}</h3><p>{t("pdf.renderingDetail")}</p></header><div><div><strong>{t("home.tools.pdfImages.title")}</strong><p>{t("home.tools.pdfImages.detail")}</p></div><span className="capability planned">{t("home.status.planned")}</span></div></section>
  </section>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function errorKey(reason: unknown): string { return reason instanceof Error && reason.message.startsWith("pdf-") ? reason.message : "unknown"; }
function safeStem(name: string): string {
  const portable = [...name.replace(/\.pdf$/i, "")].map((character) => character.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(character) ? "-" : character).join("");
  return (portable.trim() || "document").slice(0, 120);
}
function dateStamp(): string { return new Date().toISOString().slice(0, 10); }
function formatBytes(bytes: number): string { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
