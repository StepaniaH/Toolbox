import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { FilePicker } from "./FilePicker";
import { SelectMenu } from "./SelectMenu";
import { triggerDownload } from "./lib/download";
import type { OutputDraft } from "./lib/output-registry";
import {
  createXlsx,
  readTableFile,
  serializeDelimited,
  serializeJson,
  tableSourceFormat,
  type TableDocument,
} from "./lib/table-data";

type OutputFormat = "csv" | "tsv" | "json" | "xlsx";
type DataResult = { blob: Blob; name: string };
const PREVIEW_ROWS = 50;
const PREVIEW_COLUMNS = 20;

export function DataWorkspace({ hidden, incoming, onOutput }: { hidden?: boolean; incoming?: { id: number; files: File[] }; onOutput?: (drafts: OutputDraft[]) => unknown }) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [documentData, setDocumentData] = useState<TableDocument | null>(null);
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("xlsx");
  const [headerRow, setHeaderRow] = useState(true);
  const [formulaProtection, setFormulaProtection] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<DataResult | null>(null);
  const incomingId = useRef<number | null>(null);
  const loadId = useRef(0);

  const load = async (nextFile: File, sheetIndex = 0, resetOutput = true) => {
    const requestId = ++loadId.current;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const next = await readTableFile(nextFile, sheetIndex);
      if (requestId !== loadId.current) return;
      setFile(nextFile);
      setDocumentData(next);
      setResult(null);
      if (resetOutput) setOutputFormat(next.format === "xlsx" ? "csv" : "xlsx");
      setStatus(t("data.loaded", { rows: next.rows.length, columns: Math.max(0, ...next.rows.map((row) => row.length)) }));
    } catch (caught) {
      if (requestId !== loadId.current) return;
      const key = caught instanceof Error ? caught.message : "unknown";
      const translated = t(`data.errors.${key}`);
      setError(translated === `data.errors.${key}` ? t("data.errors.unknown") : translated);
      if (resetOutput) { setFile(null); setDocumentData(null); }
    } finally {
      if (requestId === loadId.current) setBusy(false);
    }
  };

  useEffect(() => {
    if (!incoming || incoming.id === incomingId.current) return;
    incomingId.current = incoming.id;
    const selected = incoming.files.find((candidate) => tableSourceFormat(candidate.name));
    if (selected) void load(selected);
  }, [incoming]);

  const outputOptions = useMemo(() => {
    const base = [
      { value: "csv" as const, label: "CSV", description: t("data.outputs.csv") },
      { value: "tsv" as const, label: "TSV", description: t("data.outputs.tsv") },
      { value: "json" as const, label: "JSON", description: t("data.outputs.json") },
    ];
    return documentData?.format === "xlsx" ? base : [...base, { value: "xlsx" as const, label: "XLSX", description: t("data.outputs.xlsx") }];
  }, [documentData?.format, t]);

  useEffect(() => {
    if (!outputOptions.some((option) => option.value === outputFormat)) {
      setOutputFormat(outputOptions[0].value);
      setResult(null);
    }
  }, [outputFormat, outputOptions]);

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0];
    if (next) void load(next);
    event.target.value = "";
  };

  const clear = () => { loadId.current += 1; setBusy(false); setFile(null); setDocumentData(null); setResult(null); setError(""); setStatus(""); };

  const generate = async () => {
    if (!file || !documentData || busy) return;
    setBusy(true);
    setError("");
    try {
      const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[\\/:*?"<>|]+/g, "-") || "table";
      let blob: Blob;
      if (outputFormat === "xlsx") blob = await createXlsx(documentData.rows, baseName);
      else if (outputFormat === "json") blob = new Blob([serializeJson(documentData.rows, headerRow)], { type: "application/json;charset=utf-8" });
      else {
        const delimiter = outputFormat === "tsv" ? "\t" : ",";
        const type = outputFormat === "tsv" ? "text/tab-separated-values;charset=utf-8" : "text/csv;charset=utf-8";
        blob = new Blob([serializeDelimited(documentData.rows, delimiter, formulaProtection)], { type });
      }
      const name = `${baseName}.${outputFormat}`;
      onOutput?.([{ blob, name, sourceName: file.name, family: "data", tool: "data" }]);
      setResult({ blob, name });
      setStatus(t("data.exported", { format: outputFormat.toUpperCase() }));
    } catch (caught) {
      const key = caught instanceof Error ? caught.message : "unknown";
      const translated = t(`data.errors.${key}`);
      setError(translated === `data.errors.${key}` ? t("data.errors.unknown") : translated);
    } finally {
      setBusy(false);
    }
  };

  const rows = documentData?.rows ?? [];
  const columnCount = Math.max(0, ...rows.map((row) => row.length));
  const cellCount = rows.reduce((sum, row) => sum + row.length, 0);

  return <section className="family-page data-page" role="tabpanel" id="panel-data" aria-labelledby="tab-data" hidden={hidden}>
    <header className="family-header">
      <div><span className="eyebrow">CSV · TSV · XLSX</span><h2>{t("data.title")}</h2><p>{t("data.intro")}</p></div>
      <div className="family-actions"><FilePicker label={t("data.open")} accept=".csv,.tsv,.xlsx" onChange={onInput}/>{file && <button className="button secondary" type="button" onClick={clear}>{t("data.clear")}</button>}</div>
    </header>
    {error && <p className="field-error" role="alert">{error}</p>}
    {!documentData ? <div className="family-empty"><span>TABLE DATA</span><h3>{busy ? t("data.reading") : t("data.emptyTitle")}</h3><p>{t("data.emptyDetail")}</p></div> : <>
      <section className="data-summary" aria-live="polite">
        <div><span className="family-dot family-data"/><div><strong>{file?.name}</strong><small>{documentData.format.toUpperCase()} · {t("data.summary", { rows: rows.length, columns: columnCount, cells: cellCount })}</small></div></div>
        {status && <span>{status}</span>}
      </section>
      <section className="data-controls">
        {documentData.sheetNames.length > 1 && <div><span className="field-label">{t("data.sheet")}</span><SelectMenu value={String(documentData.sheetIndex)} ariaLabel={t("data.sheet")} options={documentData.sheetNames.map((name, index) => ({ value: String(index), label: name }))} onChange={(value) => { if (file) void load(file, Number(value), false); }}/></div>}
        <div><span className="field-label">{t("data.output")}</span><SelectMenu value={outputFormat} ariaLabel={t("data.output")} options={outputOptions} onChange={(value) => { setOutputFormat(value); setResult(null); }}/></div>
        {outputFormat === "json" && <label className="check-row"><input type="checkbox" checked={headerRow} onChange={(event) => { setHeaderRow(event.target.checked); setResult(null); }}/>{t("data.headerRow")}</label>}
        {(outputFormat === "csv" || outputFormat === "tsv") && <label className="check-row"><input type="checkbox" checked={formulaProtection} onChange={(event) => { setFormulaProtection(event.target.checked); setResult(null); }}/>{t("data.formulaProtection")}</label>}
        <button className="button primary" type="button" onClick={() => void generate()} disabled={busy}>{busy ? t("data.reading") : t("data.generate", { format: outputFormat.toUpperCase() })}</button>
      </section>
      {result && <section className="data-result" aria-live="polite"><div><span className="eyebrow">{t("data.result")}</span><strong>{result.name}</strong><small>{t("data.resultDetail", { size: formatBytes(result.blob.size) })}</small></div><button className="button secondary" type="button" onClick={() => triggerDownload(result.blob, result.name)}>{t("data.downloadResult")}</button></section>}
      <p className="boundary-note">{t(documentData.format === "xlsx" ? "data.xlsxBoundary" : "data.csvBoundary")}{documentData.formulaCount ? ` ${t("data.formulas", { count: documentData.formulaCount })}` : ""}</p>
      <section className="data-preview">
        <header><div><h3>{t("data.preview")}</h3><p>{t("data.previewHint", { rows: Math.min(PREVIEW_ROWS, rows.length), columns: Math.min(PREVIEW_COLUMNS, columnCount) })}</p></div>{(rows.length > PREVIEW_ROWS || columnCount > PREVIEW_COLUMNS) && <span>{t("data.previewLimited")}</span>}</header>
        <div className="data-table-scroll"><table><tbody>{rows.slice(0, PREVIEW_ROWS).map((row, rowIndex) => <tr key={rowIndex}><th scope="row">{rowIndex + 1}</th>{Array.from({ length: Math.min(PREVIEW_COLUMNS, columnCount) }, (_, columnIndex) => <td key={columnIndex} title={row[columnIndex] ?? ""}>{row[columnIndex] ?? ""}</td>)}</tr>)}</tbody></table></div>
      </section>
    </>}
  </section>;
}

function formatBytes(bytes: number): string { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
