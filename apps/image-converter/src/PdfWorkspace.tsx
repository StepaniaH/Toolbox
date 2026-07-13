import { useEffect, useState, type ChangeEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { inspectPdf, type PdfInspection } from "./lib/pdf-inspector";

type Incoming = { id: number; files: File[] };

export function PdfWorkspace({ hidden, incoming }: { hidden?: boolean; incoming?: Incoming }) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<PdfInspection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const open = async (next: File | undefined) => {
    if (!next) return;
    setFile(next); setInspection(null); setError(null); setBusy(true);
    try { setInspection(await inspectPdf(next)); }
    catch (reason) { const key = reason instanceof Error ? reason.message : "unknown"; setError(t(`pdf.errors.${key}`)); }
    finally { setBusy(false); }
  };
  useEffect(() => { const next = incoming?.files.find((item) => item.name.toLowerCase().endsWith(".pdf")); if (next) void open(next); }, [incoming?.id]);
  const onInput = (event: ChangeEvent<HTMLInputElement>) => { void open(event.target.files?.[0]); event.target.value = ""; };
  const clear = () => { setFile(null); setInspection(null); setError(null); };
  const planned = ["merge", "split", "deletePages", "extractPages", "reorder", "rotatePages", "pdfImages"];
  return <section className="family-page" role="tabpanel" id="panel-pdf" aria-labelledby="tab-pdf" hidden={hidden}>
    <header className="family-header"><div><span className="eyebrow">PDF WORKSPACE</span><h2>{t("pdf.title")}</h2><p>{t("pdf.intro")}</p></div><div className="section-actions"><label className="button primary">{t("pdf.open")}<input type="file" accept=".pdf,application/pdf" onChange={onInput}/></label>{file && <button className="text-button" type="button" onClick={clear}>{t("pdf.clear")}</button>}</div></header>
    {!file ? <div className="family-empty"><span>PDF</span><h3>{t("pdf.emptyTitle")}</h3><p>{t("pdf.emptyDetail")}</p></div> : <div className="inspection-workbench">
      <div className="inspection-title"><div><span className="family-dot family-pdf"/><strong>{file.name}</strong><small>{formatBytes(file.size)}</small></div><span className="capability available">{busy ? t("pdf.reading") : t("pdf.local")}</span></div>
      {error && <p className="field-error" role="alert">{error}</p>}
      {inspection && <><dl className="inspection-grid">
        <Stat label={t("pdf.version")} value={`PDF ${inspection.version}`}/><Stat label={t("pdf.pages")} value={String(inspection.pageEstimate)}/><Stat label={t("pdf.objects")} value={String(inspection.objectCount)}/><Stat label={t("pdf.encrypted")} value={t(inspection.encrypted ? "pdf.yes" : "pdf.no")}/><Stat label={t("pdf.linearized")} value={t(inspection.linearized ? "pdf.yes" : "pdf.no")}/><Stat label={t("pdf.metadata")} value={t(inspection.metadata ? "pdf.yes" : "pdf.no")}/><Stat label={t("pdf.mediaBox")} value={inspection.mediaBox ? `${inspection.mediaBox[0]} × ${inspection.mediaBox[1]} pt` : "—"}/>
      </dl><p className="boundary-note">{t("pdf.estimateWarning")}</p></>}
    </div>}
    <section className="planned-family-tools"><header><h3>{t("pdf.nextTools")}</h3><p>{t("pdf.nextToolsDetail")}</p></header>{planned.map((id) => <div key={id}><div><strong>{t(`home.tools.${id}.title`)}</strong><p>{t(`home.tools.${id}.detail`)}</p></div><span className="capability planned">{t("home.status.planned")}</span></div>)}</section>
  </section>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div><dt>{label}</dt><dd>{value}</dd></div>; }
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
