import { useState } from "react";
import { getLang, intlLocale } from "@toolbox/i18n/core";
import { useTranslation } from "../lib/i18n";
import { parseNumber } from "../lib/persisted-url-state";

export function PageHeader({ title, description }: any) {
  return (
    <header className="page-header">
      <div>
        <h2>{title}</h2>
        <p className="lead compact">{description}</p>
      </div>
    </header>
  );
}

export function Panel({ title, subtitle, children, className = "" }: any) {
  return (
    <section className={`panel ${className}`.trim()}>
      <div className="panel-head">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function MetricBadge({ label, value }: any) {
  return (
    <div className="metric-badge">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

export function StatBlock({ label, value }: any) {
  return (
    <div className="stat-block">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

export function InfoBox({ tone, title, text }: any) {
  return (
    <div className={`info-box tone-${tone}`}>
      <div className="info-title">{title}</div>
      <div className="info-text">{text}</div>
    </div>
  );
}

export function FormulaBlock({ children }: any) {
  return <div className="formula-block">{children}</div>;
}

export function FieldRow({ label, children, hint }: any) {
  return (
    <label className="field-row">
      <span className="field-label">
        {label}
        {hint ? (
          <span className="field-hint">
            <span className="field-hint-icon" aria-hidden="true">i</span>
            <span className="field-hint-popup">{hint}</span>
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

export function ToggleChip({ active, children, onClick }: any) {
  return (
    <button
      type="button"
      className={`chip ${active ? "chip-active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

export function NumberInput({ value, onChange, ...props }: any) {
  return (
    <input
      className="input input-number"
      type="number"
      inputMode="decimal"
      value={Number.isFinite(value) ? value : ""}
      onChange={(event) => onChange(parseNumber(event.target.value, value))}
      {...props}
    />
  );
}

export function SelectInput({ value, onChange, options, ...props }: any) {
  return (
    <select className="input input-select" value={value} onChange={(event) => onChange(event.target.value)} {...props}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function ShareLink({ url }: any) {
  const { t } = useTranslation();
  const [copyState, setCopyState] = useState("copy");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("copy"), 1800);
    } catch {
      setCopyState("copyFailed");
      window.setTimeout(() => setCopyState("copy"), 1800);
    }
  };

  return (
    <div className="share-link">
      <input className="input share-input" value={url} readOnly />
      <button type="button" className="button" onClick={handleCopy}>
        {t(`common.${copyState}`)}
      </button>
    </div>
  );
}


/** Compact "< 1" / rounded count for example sections. */
export function formatExampleCount(n: number): string | null {
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 0.5) return "< 1";
  return Math.round(n).toLocaleString(intlLocale(getLang()));
}

