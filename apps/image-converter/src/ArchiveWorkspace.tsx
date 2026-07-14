import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useTranslation } from "@toolbox/i18n/react";
import { FilePicker } from "./FilePicker";
import type { OutputDraft } from "./lib/output-registry";
import { extractZipEntry, readZipDirectory, type ZipDirectory } from "./lib/zip-reader";

type Incoming = { id: number; files: File[] };

export function ArchiveWorkspace({ hidden, incoming, onOutput }: { hidden?: boolean; incoming?: Incoming; onOutput?: (drafts: OutputDraft[]) => unknown }) {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [directory, setDirectory] = useState<ZipDirectory | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const safeEntries = useMemo(() => directory?.entries.filter((item) => item.safe && !item.directory) ?? [], [directory]);
  const open = async (next: File | undefined) => {
    if (!next) return;
    setFile(next); setDirectory(null); setSelected(new Set()); setError(null); setStatus(null); setBusy(true);
    try { setDirectory(await readZipDirectory(next)); }
    catch (reason) { const key = reason instanceof Error ? reason.message : "unknown"; setError(t(`archive.errors.${key}`)); }
    finally { setBusy(false); }
  };
  useEffect(() => { const next = incoming?.files.find((item) => /\.zip$/i.test(item.name)); if (next) void open(next); }, [incoming?.id]);
  const onInput = (event: ChangeEvent<HTMLInputElement>) => { void open(event.target.files?.[0]); event.target.value = ""; };
  const clear = () => { setFile(null); setDirectory(null); setSelected(new Set()); setError(null); setStatus(null); };
  const toggleAll = () => setSelected(selected.size === safeEntries.length ? new Set() : new Set(safeEntries.map((item) => item.id)));
  const extract = async () => {
    if (!file || !directory || !selected.size) return;
    setBusy(true); setError(null);
    try {
      const entries: Array<{ name: string; blob: Blob }> = [];
      for (const item of directory.entries.filter((entry) => selected.has(entry.id))) {
        entries.push({ name: item.name, blob: await extractZipEntry(file, item) });
      }
      onOutput?.(entries.map((entry) => ({ ...entry, sourceName: file.name, tool: "archive" })));
      setStatus(t("archive.added", { count: entries.length }));
    } catch (reason) { const key = reason instanceof Error ? reason.message : "unknown"; setError(t(`archive.errors.${key}`)); }
    finally { setBusy(false); }
  };
  return <section className="family-page" role="tabpanel" id="panel-archive" aria-labelledby="tab-archive" hidden={hidden}>
    <header className="family-header"><div><span className="eyebrow">ARCHIVE WORKSPACE</span><h2>{t("archive.title")}</h2><p>{t("archive.intro")}</p></div><div className="family-actions"><FilePicker label={t("archive.open")} accept=".zip,application/zip" onChange={onInput}/>{file && <button className="button secondary" type="button" onClick={clear}>{t("archive.clear")}</button>}</div></header>
    {!file ? <div className="family-empty"><span>ZIP</span><h3>{t("archive.emptyTitle")}</h3><p>{t("archive.emptyDetail")}</p></div> : <div className="archive-workbench">
      <header className="archive-summary"><div><span className="family-dot family-archive"/><strong>{file.name}</strong><small>{directory ? t("archive.entryCount", { count: directory.entries.length }) : t("archive.reading")}</small></div>{directory && <div className="section-actions"><button className="text-button" type="button" onClick={toggleAll}>{t(selected.size === safeEntries.length && safeEntries.length ? "archive.deselectAll" : "archive.selectAll")}</button><button className="button secondary" type="button" disabled={!selected.size || busy} onClick={() => void extract()}>{t("archive.extract", { count: selected.size })}</button></div>}</header>
      {error && <p className="field-error" role="alert">{error}</p>}
      {status && <p className="home-notice" role="status">{status}</p>}
      {directory && <div className="archive-list" role="list">{directory.entries.map((item) => <label className={!item.safe ? "is-blocked" : ""} key={item.id}><input type="checkbox" disabled={!item.safe || item.directory} checked={selected.has(item.id)} onChange={() => setSelected((current) => { const next = new Set(current); if (next.has(item.id)) next.delete(item.id); else next.add(item.id); return next; })}/><span><strong>{item.name}</strong><small>{item.directory ? t("archive.directory") : `${formatBytes(item.uncompressedSize)} · ${item.method === 0 ? t("archive.stored") : t("archive.deflated")}`}</small></span><span className={`capability ${item.safe ? "available" : "planned"}`}>{item.safe ? t("archive.safe") : t(`archive.reasons.${item.reason}`)}</span></label>)}</div>}
      {directory && <p className="boundary-note">{t("archive.safetyNote")}</p>}
    </div>}
  </section>;
}

function formatBytes(bytes: number) { if (bytes < 1024) return `${bytes} B`; if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
