import React, { useEffect, useMemo, useState } from "react";
import { NavBar } from "@toolbox/nav";
import "@toolbox/nav/nav-bar.css";
import {
  NETWORK_SCENARIOS,
  NETWORK_SIZE_OPTIONS,
  NETWORK_UNIT_OPTIONS,
  POWER_CURRENCY_OPTIONS,
  POWER_PRESETS,
  VIDEO_BITRATE_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  VIDEO_PRESETS,
  VIDEO_SIZE_OPTIONS,
  VIDEO_TARGET_OPTIONS,
  calculateVideo,
  STORAGE_PRESETS,
  STORAGE_SCENARIOS,
  STORAGE_UNIT_OPTIONS,
  calculateNetwork,
  calculatePower,
  calculateStorage,
  formatBitrate,
  formatBytes,
  formatCompactSize,
  formatCurrencyAmount,
  formatDecimalSize,
  formatDuration,
  formatNumber,
  formatPercent,
} from "./lib/units";
import { useTranslation, LanguageProvider } from "./lib/i18n";
import { useTheme } from "./lib/theme";
import {
  LEGACY_STATE_STORAGE_KEYS,
  STATE_STORAGE_KEYS,
  readStoredState,
  writeStoredState,
} from "./lib/storage";

const STORAGE_DEFAULTS = {
  value: 4,
  unit: "TB",
  scenario: "drive",
  preset: "4TB",
};

const NETWORK_DEFAULTS = {
  bandwidthValue: 1000,
  bandwidthUnit: "Mbps",
  sizeValue: 1,
  sizeUnit: "TiB",
  scenario: "wired-lan",
  efficiency: 85,
  preset: "1TiB-1000Mbps",
};

const VIDEO_DEFAULTS = {
  mode: "size",
  bitrateValue: 8,
  bitrateUnit: "Mbps",
  durationValue: 1,
  durationUnit: "h",
  sizeValue: 1,
  sizeUnit: "GB",
  audioBitrateValue: 128,
  audioBitrateUnit: "Kbps",
  overheadPercent: 1,
  preset: "8Mbps / 1h",
};

const POWER_DEFAULTS = {
  watt: 30,
  hoursPerDay: 24,
  daysPerYear: 365,
  price: 0.56,
  currency: "CNY",
  preset: "30W",
};

function App() {
  const [path, navigate] = useAppNavigation();
  const route = normalizeRoute(path);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route]);

  const { t, lang } = useTranslation();
  const { toggleTheme } = useTheme();

  useEffect(() => {
    document.title = t(`pageTitles.${route}`) ?? "SaneUnits";
  }, [route, t]);

  const routes = [
    { path: "/", label: t("nav.home") },
    { path: "/storage", label: t("nav.storage") },
    { path: "/network", label: t("nav.network") },
    { path: "/video", label: t("nav.video") },
    { path: "/power", label: t("nav.power") },
    { path: "/about", label: t("nav.about") },
  ];

  return (
    <>
      <NavBar currentApp="sane-units" onToggleTheme={toggleTheme} />
      <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            SU
          </div>
          <div>
            <div className="brand-name">{t("brand.name")}</div>
            <div className="brand-subtitle">{t("brand.subtitle")}</div>
          </div>
        </div>

        <nav className="side-nav" aria-label={t("nav.home")}>
          {routes.map((item) => (
            <NavLink key={item.path} to={item.path} active={route === item.path} onNavigate={navigate}>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-note">
          <p>{t("sidebar.note")}</p>
          <ul>
            <li>{t("sidebar.tbNote")}</li>
            <li>{t("sidebar.mbpsNote")}</li>
            <li>{t("sidebar.wattNote")}</li>
          </ul>
        </div>

        <div className="sidebar-controls">
          <ThemeToggle />
          <LanguageToggle lang={lang} />
        </div>
      </aside>

      <div className="mobile-topbar">
        <div className="mobile-brand">
          <div className="brand-mark brand-mark-small" aria-hidden="true">
            SU
          </div>
          <div>
            <div className="brand-name">{t("brand.name")}</div>
            <div className="brand-subtitle">{t("brand.subtitleShort")}</div>
          </div>
        </div>
        <div className="mobile-nav" role="tablist" aria-label={t("nav.home")}>
          {routes.map((item) => (
            <NavLink key={item.path} to={item.path} active={route === item.path} onNavigate={navigate}>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
        <div className="mobile-controls">
          <ThemeToggle />
          <LanguageToggle lang={lang} />
        </div>
      </div>

      <main className="workspace">
        {route === "/" ? <HomePage onNavigate={navigate} /> : null}
        {route === "/storage" ? <StoragePage /> : null}
        {route === "/network" ? <NetworkPage /> : null}
        {route === "/video" ? <VideoPage /> : null}
        {route === "/power" ? <PowerPage /> : null}
        {route === "/about" ? <AboutPage /> : null}
      </main>

      <footer className="app-footer">
        <a href="https://github.com/StepaniaH/Toolbox/blob/master/LICENSE">{t("footer.mitLicense")}</a>
        <a href="https://github.com/StepaniaH/Toolbox" target="_blank" rel="noopener noreferrer">{t("footer.github")}</a>
      </footer>
    </div>
      </>
  );
}

function AppRoot() {
  return React.createElement(
    LanguageProvider,
    null,
    React.createElement(App),
  );
}

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className="control-btn"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? "\u263C" : "\u263E"}
    </button>
  );
}

function LanguageToggle({ lang }: any) {
  const { setLang } = useTranslation();
  const nextLang = lang === "zh-CN" ? "en" : "zh-CN";
  return (
    <button
      type="button"
      className="control-btn"
      onClick={() => setLang(nextLang)}
      aria-label={lang === "zh-CN" ? "Switch to English" : "切换到中文"}
      title={lang === "zh-CN" ? "Switch to English" : "切换到中文"}
    >
      {lang === "zh-CN" ? "中/EN" : "EN/中"}
    </button>
  );
}

function HomePage({ onNavigate }: any) {
  const { t } = useTranslation();
  const cards = t("home.cards");

  return (
    <section className="page page-home">
      <header className="hero-block">
        <div>
          <h1>{t("home.heroTitle")}</h1>
          <p className="lead">{t("home.heroLead")}</p>
        </div>

        <div className="hero-metrics" aria-label={t("home.metricShareable")}>
          <MetricBadge label={t("home.metricPureFrontend")} value={t("home.metricPureFrontendValue")} />
          <MetricBadge label={t("home.metricShareable")} value={t("home.metricShareableValue")} />
          <MetricBadge label={t("home.metricMobile")} value={t("home.metricMobileValue")} />
        </div>
      </header>

      <div className="card-grid">
        {Array.isArray(cards) && cards.map((card) => (
          <button
            key={card.title}
            className="home-card"
            type="button"
            onClick={() => onNavigate(card.path)}
          >
            <div className="home-card-meta">{card.meta}</div>
            <div className="home-card-title">{card.title}</div>
            <div className="home-card-desc">{card.description}</div>
            <div className="home-card-arrow" aria-hidden="true">→</div>
          </button>
        ))}
      </div>
    </section>
  );
}

function StoragePage() {
  const { t, lang } = useTranslation();
  const [state, setState] = useSyncedState(STATE_STORAGE_KEYS.storage, LEGACY_STATE_STORAGE_KEYS.storage, STORAGE_DEFAULTS, "/storage", decodeStorageState, encodeStorageState);
  const result = useMemo(() => calculateStorage(state.value, state.unit, lang), [state.value, state.unit, lang]);
  const scenarioCopy = t(`storage.scenarios.${state.scenario}`) ?? t("storage.scenarios.drive");
  const shareUrl = buildShareUrl("/storage", {
    value: state.value,
    unit: state.unit,
    scenario: state.scenario,
  });

  return (
    <section className="page">
      <PageHeader
        title={t("storage.title")}
        description={t("storage.description")}
      />

      <div className="calculator-grid calculator-grid-storage">
        <Panel title={t("storage.panelInput.title")} subtitle={t("storage.panelInput.subtitle")}>
          <FieldRow label={t("storage.fieldValue")} hint={t("storage.hintValue")}>
            <NumberInput
              value={state.value}
              min="0"
              step="0.1"
              onChange={(value) => setState((current) => ({ ...current, value, preset: "custom" }))}
            />
          </FieldRow>

          <FieldRow label={t("storage.fieldUnit")} hint={t("storage.hintUnit")}>
            <SelectInput
              value={state.unit}
              onChange={(value) => setState((current) => ({ ...current, unit: value, preset: "custom" }))}
              options={STORAGE_UNIT_OPTIONS}
            />
          </FieldRow>

          <FieldRow label={t("storage.fieldScenario")} hint={t("storage.hintScenario")}>
            <SelectInput
              value={state.scenario}
              onChange={(value) => setState((current) => ({ ...current, scenario: value, preset: "custom" }))}
              options={STORAGE_SCENARIOS}
            />
          </FieldRow>

          <div className="preset-stack">
            <div className="field-label">{t("storage.fieldPresets")}</div>
            <div className="preset-wrap">
              {STORAGE_PRESETS.map((preset) => (
                <ToggleChip
                  key={preset.label}
                  active={state.preset === preset.label}
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      value: preset.value,
                      unit: preset.unit,
                      preset: preset.label,
                    }))
                  }
                >
                  {preset.label}
                </ToggleChip>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title={t("storage.panelAnswer.title")} subtitle={t("storage.panelAnswer.subtitle")} className="span-2">
          <div className="result-card">
            <div className="result-badge">{t("storage.resultLabel")}</div>
            <div className="result-line">{result.directAnswer}</div>
            <div className="result-subline">{t("storage.resultBinaryDisplay")} {result.binaryDisplay}</div>
            <div className="result-subline">{t("storage.resultDifference")}{formatPercent(result.differencePercent)}</div>
          </div>

          <div className="stat-row">
            <StatBlock label={t("storage.statExactBytes")} value={formatBytes(result.exactBytes)} />
            <StatBlock label={t("storage.statBinaryDisplay")} value={result.binaryDisplay} />
            <StatBlock label={t("storage.statUnitDiff")} value={formatPercent(result.differencePercent)} />
          </div>
        </Panel>

        <Panel title={t("storage.panelUnitExplain.title")} subtitle={t("storage.panelUnitExplain.subtitle")}>
          <InfoBox
            tone="blue"
            title={t("storage.panelUnitExplain.title")}
            text={result.unitExplanation}
          />
          <div className="note-copy">{scenarioCopy}</div>
        </Panel>

        <Panel title={t("storage.panelFormula.title")} subtitle={t("storage.panelFormula.subtitle")}>
          <FormulaBlock>{t("storage.formulaLine1")}</FormulaBlock>
          <FormulaBlock>{t("storage.formulaLine2")}</FormulaBlock>
        </Panel>

        <Panel title={t("storage.panelReality.title")} subtitle={t("storage.panelReality.subtitle")}>
          <InfoBox
            tone="red"
            title={t("storage.realityTitle")}
            text={result.realityNote}
          />
        </Panel>

        <Panel title={t("storage.panelExamples.title")} subtitle={t("storage.panelExamples.subtitle")}>
          <div className="examples-list">
            {[
              ["movie", result.exactBytes / (8 * 1024 ** 3)],
              ["photo", result.exactBytes / (4 * 1024 ** 2)],
              ["song", result.exactBytes / (10 * 1024 ** 2)],
            ].map(([key, val]) => {
              const count = formatExampleCount(val);
              if (!count) return null;
              return (
                <div className="example-item" key={key}>
                  <span>{t(`storage.examples.${key}`).replace("{0}", count)}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title={t("storage.panelShare.title")} subtitle={t("storage.panelShare.subtitle")} className="span-2">
          <ShareLink url={shareUrl} />
        </Panel>
      </div>
    </section>
  );
}

function NetworkPage() {
  const { t, lang } = useTranslation();
  const [state, setState] = useSyncedState(STATE_STORAGE_KEYS.network, LEGACY_STATE_STORAGE_KEYS.network, NETWORK_DEFAULTS, "/network", decodeNetworkState, encodeNetworkState);
  const result = useMemo(
    () =>
      calculateNetwork({
        bandwidthValue: state.bandwidthValue,
        bandwidthUnit: state.bandwidthUnit,
        sizeValue: state.sizeValue,
        sizeUnit: state.sizeUnit,
        efficiency: state.efficiency,
        scenario: state.scenario,
        locale: lang,
      }),
    [state.bandwidthValue, state.bandwidthUnit, state.sizeValue, state.sizeUnit, state.efficiency, state.scenario, lang],
  );
  const scenarioCopy = t(`network.scenarios.${state.scenario}`) ?? t("network.scenarios.public");
  const shareUrl = buildShareUrl("/network", {
    bandwidthValue: state.bandwidthValue,
    bandwidthUnit: state.bandwidthUnit,
    sizeValue: state.sizeValue,
    sizeUnit: state.sizeUnit,
    scenario: state.scenario,
    efficiency: state.efficiency,
  });

  return (
    <section className="page">
      <PageHeader
        title={t("network.title")}
        description={t("network.description")}
      />

      <div className="calculator-grid">
        <Panel title={t("network.panelInput.title")} subtitle={t("network.panelInput.subtitle")}>
          <FieldRow label={t("network.fieldBandwidth")} hint={t("network.hintBandwidth")}>
            <div className="inline-fields">
              <NumberInput
                value={state.bandwidthValue}
                min="0"
                step="1"
                onChange={(value) => setState((current) => ({ ...current, bandwidthValue: value, preset: "custom" }))}
              />
              <SelectInput
                value={state.bandwidthUnit}
                onChange={(value) => setState((current) => ({ ...current, bandwidthUnit: value, preset: "custom" }))}
                options={NETWORK_UNIT_OPTIONS}
              />
            </div>
          </FieldRow>

          <FieldRow label={t("network.fieldFileSize")}>
            <div className="inline-fields">
              <NumberInput
                value={state.sizeValue}
                min="0"
                step="0.1"
                onChange={(value) => setState((current) => ({ ...current, sizeValue: value, preset: "custom" }))}
              />
              <SelectInput
                value={state.sizeUnit}
                onChange={(value) => setState((current) => ({ ...current, sizeUnit: value, preset: "custom" }))}
                options={NETWORK_SIZE_OPTIONS}
              />
            </div>
          </FieldRow>

          <FieldRow label={t("network.fieldScenario")}>
            <div className="preset-wrap preset-wrap-tight">
              {NETWORK_SCENARIOS.map((scenario) => (
                <ToggleChip
                  key={scenario.value}
                  active={state.scenario === scenario.value}
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      scenario: scenario.value,
                      efficiency: scenario.efficiency,
                      preset: scenario.value,
                    }))
                  }
                >
                  {scenario.label}
                </ToggleChip>
              ))}
            </div>
          </FieldRow>

          <FieldRow label={t("network.fieldEfficiency")} hint={t("network.hintEfficiency")}>
            <div className="inline-fields">
              <NumberInput
                value={state.efficiency}
                min="1"
                max="100"
                step="1"
                onChange={(value) => setState((current) => ({ ...current, efficiency: value, scenario: "custom", preset: "custom" }))}
              />
              <div className="field-suffix">%</div>
            </div>
          </FieldRow>

          <div className="preset-stack">
            <div className="field-label">{t("network.fieldPresets")}</div>
            <div className="preset-wrap">
              {NETWORK_PRESETS.map((preset) => (
                <ToggleChip
                  key={preset.label}
                  active={state.preset === preset.label}
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      bandwidthValue: preset.bandwidthValue,
                      bandwidthUnit: preset.bandwidthUnit,
                      sizeValue: preset.sizeValue,
                      sizeUnit: preset.sizeUnit,
                      scenario: preset.scenario,
                      efficiency: preset.efficiency,
                      preset: preset.label,
                    }))
                  }
                >
                  {preset.label}
                </ToggleChip>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title={t("network.panelAnswer.title")} subtitle={t("network.panelAnswer.subtitle")} className="span-2">
          <div className="result-card">
            <div className="result-badge">{t("network.resultLabel")}</div>
            <div className="result-line">{result.theoryLine}</div>
            <div className="result-subline">{t("network.resultTheoryTime")}{result.theoreticalTimeLine}</div>
            <div className="result-subline">{lang === "en" ? "At " : "按 "}{formatPercent(result.efficiency)}{lang === "en" ? " effective throughput: " : " 有效吞吐估算："}{result.effectiveTimeLine}</div>
          </div>

          <div className="stat-row">
            <StatBlock label={t("network.statTheoryMBs")} value={`${formatNumber(result.theoreticalMBps, 2)} MB/s`} />
            <StatBlock label={t("network.statTheoryMiBs")} value={`${formatNumber(result.theoreticalMiBps, 2)} MiB/s`} />
            <StatBlock label={t("network.statEffectiveTime")} value={result.effectiveTimeLine} />
          </div>
        </Panel>

        <Panel title={t("network.panelUnitExplain.title")} subtitle={t("network.panelUnitExplain.subtitle")}>
          <InfoBox tone="blue" title={t("network.panelInput.title")} text={scenarioCopy} />
          <div className="note-copy">
            {t("network.noteUnitExplain")}
          </div>
        </Panel>

        <Panel title={t("network.panelFormula.title")} subtitle={t("network.panelFormula.subtitle")}>
          <FormulaBlock>{t("network.formulaLine1")}</FormulaBlock>
          <FormulaBlock>{t("network.formulaLine2")}</FormulaBlock>
        </Panel>

        <Panel title={t("network.panelReality.title")} subtitle={t("network.panelReality.subtitle")}>
          <InfoBox
            tone="red"
            title={t("network.realityTitle")}
            text={result.realityNote}
          />
        </Panel>

        <Panel title={t("network.panelExamples.title")} subtitle={t("network.panelExamples.subtitle")}>
          <div className="examples-list">
            {[
              ["movie", 8 * 1024 ** 3],
              ["episode", 1 * 1024 ** 3],
              ["song", 30 * 1024 ** 2],
            ].map(([key, sizeBytes]) => {
              const secs = (sizeBytes * 8) / (result.bandwidthBps * result.efficiency / 100);
              if (secs < 1) return null;
              return (
                <div className="example-item" key={key}>
                  <span>{t(`network.examples.${key}`).replace("{0}", formatDuration(secs, lang))}</span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title={t("network.panelShare.title")} subtitle={t("network.panelShare.subtitle")} className="span-2">
          <ShareLink url={shareUrl} />
        </Panel>
      </div>
    </section>
  );
}

function PowerPage() {
  const { t, lang } = useTranslation();
  const [state, setState] = useSyncedState(STATE_STORAGE_KEYS.power, LEGACY_STATE_STORAGE_KEYS.power, POWER_DEFAULTS, "/power", decodePowerState, encodePowerState);
  const result = useMemo(
    () =>
      calculatePower({
        watt: state.watt,
        hoursPerDay: state.hoursPerDay,
        daysPerYear: state.daysPerYear,
        price: state.price,
        locale: lang,
      }),
    [state.watt, state.hoursPerDay, state.daysPerYear, state.price, lang],
  );
  const shareUrl = buildShareUrl("/power", {
    watt: state.watt,
    hours: state.hoursPerDay,
    days: state.daysPerYear,
    price: state.price,
    currency: state.currency,
  });

  return (
    <section className="page">
      <PageHeader
        title={t("power.title")}
        description={t("power.description")}
      />

      <div className="calculator-grid">
        <Panel title={t("power.panelInput.title")} subtitle={t("power.panelInput.subtitle")}>
          <FieldRow label={t("power.fieldWatt")} hint={t("power.hintWatt")}>
            <div className="inline-fields">
              <NumberInput
                value={state.watt}
                min="0"
                step="1"
                onChange={(value) => setState((current) => ({ ...current, watt: value, preset: "custom" }))}
              />
              <div className="field-suffix">W</div>
            </div>
          </FieldRow>

          <FieldRow label={t("power.fieldHoursPerDay")}>
            <NumberInput
              value={state.hoursPerDay}
              min="0"
              max="24"
              step="1"
              onChange={(value) => setState((current) => ({ ...current, hoursPerDay: value, preset: "custom" }))}
            />
          </FieldRow>

          <FieldRow label={t("power.fieldDaysPerYear")}>
            <NumberInput
              value={state.daysPerYear}
              min="0"
              max="366"
              step="1"
              onChange={(value) => setState((current) => ({ ...current, daysPerYear: value, preset: "custom" }))}
            />
          </FieldRow>

          <FieldRow label={t("power.fieldPrice")} hint={t("power.hintPrice")}>
            <div className="inline-fields">
              <NumberInput
                value={state.price}
                min="0"
                step="0.01"
                onChange={(value) => setState((current) => ({ ...current, price: value, preset: "custom" }))}
              />
              <SelectInput
                value={state.currency}
                onChange={(value) => setState((current) => ({ ...current, currency: value, preset: "custom" }))}
                options={POWER_CURRENCY_OPTIONS}
              />
            </div>
          </FieldRow>

          <div className="preset-stack">
            <div className="field-label">{t("power.fieldPresets")}</div>
            <div className="preset-wrap">
              {POWER_PRESETS.map((preset) => (
                <ToggleChip
                  key={preset.label}
                  active={state.preset === preset.label}
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      watt: preset.watt,
                      preset: preset.label,
                    }))
                  }
                >
                  {preset.label}
                </ToggleChip>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title={t("power.panelAnswer.title")} subtitle={t("power.panelAnswer.subtitle")} className="span-2">
          <div className="result-card">
            <div className="result-badge">{t("power.resultLabel")}</div>
            <div className="result-line">{result.directAnswer}</div>
            <div className="result-subline">{t("power.resultDaily")}{formatNumber(result.dailyKWh, 2)} kWh</div>
            <div className="result-subline">{t("power.resultAnnual")}{formatCurrencyAmount(result.annualCost, state.currency, lang)}</div>
          </div>

          <div className="stat-row">
            <StatBlock label={t("power.statDaily")} value={`${formatNumber(result.dailyKWh, 2)} kWh`} />
            <StatBlock label={t("power.statMonthly")} value={`${formatNumber(result.monthlyKWh, 2)} kWh`} />
            <StatBlock label={t("power.statAnnual")} value={`${formatNumber(result.annualKWh, 2)} kWh`} />
          </div>
        </Panel>

        <Panel title={t("power.panelUnitExplain.title")} subtitle={t("power.panelUnitExplain.subtitle")}>
          <InfoBox
            tone="blue"
            title={t("power.unitExplainTitle")}
            text={t("power.unitExplainText")}
          />
          <div className="note-copy">{t("power.noteMonthly")}</div>
        </Panel>

        <Panel title={t("power.panelFormula.title")} subtitle={t("power.panelFormula.subtitle")}>
          <FormulaBlock>{t("power.formulaLine1")}</FormulaBlock>
          <FormulaBlock>{t("power.formulaLine2")}</FormulaBlock>
          <FormulaBlock>{t("power.formulaLine3")}</FormulaBlock>
        </Panel>

        <Panel title={t("power.panelReality.title")} subtitle={t("power.panelReality.subtitle")}>
          <InfoBox
            tone="red"
            title={t("power.realityTitle")}
            text={result.realityNote}
          />
        </Panel>

        <Panel title={t("power.panelExamples.title")} subtitle={t("power.panelExamples.subtitle")}>
          <div className="examples-list">
            {(() => {
              const items = [];
              const kwh = formatNumber(result.annualKWh, 1);
              if (result.annualKWh > 0) items.push(["kwh", kwh]);
              const ac = formatExampleCount(result.annualKWh / 2);
              if (ac) items.push(["ac", ac]);
              const led = formatExampleCount(result.annualKWh / (0.01 * 24));
              if (led) items.push(["led", led]);
              return items.map(([key, val]) => (
                <div className="example-item" key={key}>
                  <span>{t(`power.examples.${key}`).replace("{0}", val)}</span>
                </div>
              ));
            })()}
          </div>
        </Panel>

        <Panel title={t("power.panelShare.title")} subtitle={t("power.panelShare.subtitle")} className="span-2">
          <ShareLink url={shareUrl} />
        </Panel>
      </div>
    </section>
  );
}

function VideoPage() {
  const { t, lang } = useTranslation();
  const [state, setState] = useSyncedState(STATE_STORAGE_KEYS.video, LEGACY_STATE_STORAGE_KEYS.video, VIDEO_DEFAULTS, "/video", decodeVideoState, encodeVideoState);
  const result = useMemo(
    () =>
      calculateVideo({
        mode: state.mode,
        bitrateValue: state.bitrateValue,
        bitrateUnit: state.bitrateUnit,
        durationValue: state.durationValue,
        durationUnit: state.durationUnit,
        sizeValue: state.sizeValue,
        sizeUnit: state.sizeUnit,
        audioBitrateValue: state.audioBitrateValue,
        audioBitrateUnit: state.audioBitrateUnit,
        overheadPercent: state.overheadPercent,
        locale: lang,
      }),
    [
      state.mode,
      state.bitrateValue,
      state.bitrateUnit,
      state.durationValue,
      state.durationUnit,
      state.sizeValue,
      state.sizeUnit,
      state.audioBitrateValue,
      state.audioBitrateUnit,
      state.overheadPercent,
      lang,
    ],
  );

  const shareUrl = buildShareUrl("/video", {
    mode: state.mode,
    bitrateValue: state.bitrateValue,
    bitrateUnit: state.bitrateUnit,
    durationValue: state.durationValue,
    durationUnit: state.durationUnit,
    sizeValue: state.sizeValue,
    sizeUnit: state.sizeUnit,
    audioBitrateValue: state.audioBitrateValue,
    audioBitrateUnit: state.audioBitrateUnit,
    overhead: state.overheadPercent,
  });

  const solvingBitrate = state.mode === "bitrate";
  const solvingDuration = state.mode === "duration";
  const solvingSize = state.mode === "size";

  const solvingLabel = t("video.solvingLabel");

  return (
    <section className="page">
      <PageHeader
        title={t("video.title")}
        description={t("video.description")}
      />

      <div className="calculator-grid">
        <Panel title={t("video.panelInput.title")} subtitle={t("video.panelInput.subtitle")}>
          <FieldRow label={t("video.fieldTarget")}>
            <div className="preset-wrap preset-wrap-tight">
              {VIDEO_TARGET_OPTIONS.map((target) => (
                <ToggleChip
                  key={target.value}
                  active={state.mode === target.value}
                  onClick={() => setState((current) => ({ ...current, mode: target.value, preset: "custom" }))}
                >
                  {target.label}
                </ToggleChip>
              ))}
            </div>
          </FieldRow>

          <FieldRow label={(solvingBitrate ? t("video.fieldVideoBitrate") + solvingLabel : t("video.fieldVideoBitrate"))} hint={t("video.hintBitrate")}>
            <div className="inline-fields">
              <NumberInput
                value={state.bitrateValue}
                min="0"
                step="0.1"
                disabled={solvingBitrate}
                onChange={(value) => setState((current) => ({ ...current, bitrateValue: value, preset: "custom" }))}
              />
              <SelectInput
                value={state.bitrateUnit}
                disabled={solvingBitrate}
                onChange={(value) => setState((current) => ({ ...current, bitrateUnit: value, preset: "custom" }))}
                options={VIDEO_BITRATE_OPTIONS}
              />
            </div>
          </FieldRow>

          <FieldRow label={(solvingDuration ? t("video.fieldDuration") + solvingLabel : t("video.fieldDuration"))} hint={t("video.hintDuration")}>
            <div className="inline-fields">
              <NumberInput
                value={state.durationValue}
                min="0"
                step="0.1"
                disabled={solvingDuration}
                onChange={(value) => setState((current) => ({ ...current, durationValue: value, preset: "custom" }))}
              />
              <SelectInput
                value={state.durationUnit}
                disabled={solvingDuration}
                onChange={(value) => setState((current) => ({ ...current, durationUnit: value, preset: "custom" }))}
                options={VIDEO_DURATION_OPTIONS}
              />
            </div>
          </FieldRow>

          <FieldRow label={(solvingSize ? t("video.fieldFileSize") + solvingLabel : t("video.fieldFileSize"))}>
            <div className="inline-fields">
              <NumberInput
                value={state.sizeValue}
                min="0"
                step="0.1"
                disabled={solvingSize}
                onChange={(value) => setState((current) => ({ ...current, sizeValue: value, preset: "custom" }))}
              />
              <SelectInput
                value={state.sizeUnit}
                disabled={solvingSize}
                onChange={(value) => setState((current) => ({ ...current, sizeUnit: value, preset: "custom" }))}
                options={VIDEO_SIZE_OPTIONS}
              />
            </div>
          </FieldRow>

          <FieldRow label={t("video.fieldAudioBitrate")}>
            <div className="inline-fields">
              <NumberInput
                value={state.audioBitrateValue}
                min="0"
                step="1"
                onChange={(value) => setState((current) => ({ ...current, audioBitrateValue: value, preset: "custom" }))}
              />
              <SelectInput
                value={state.audioBitrateUnit}
                onChange={(value) => setState((current) => ({ ...current, audioBitrateUnit: value, preset: "custom" }))}
                options={VIDEO_BITRATE_OPTIONS}
              />
            </div>
          </FieldRow>

          <FieldRow label={t("video.fieldOverhead")} hint={t("video.hintOverhead")}>
            <div className="inline-fields">
              <NumberInput
                value={state.overheadPercent}
                min="0"
                max="100"
                step="0.5"
                onChange={(value) => setState((current) => ({ ...current, overheadPercent: value, preset: "custom" }))}
              />
              <div className="field-suffix">%</div>
            </div>
          </FieldRow>

          <div className="preset-stack">
            <div className="field-label">{t("video.fieldPresets")}</div>
            <div className="preset-wrap">
              {VIDEO_PRESETS.map((preset) => (
                <ToggleChip
                  key={preset.label}
                  active={state.preset === preset.label}
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      mode: preset.mode,
                      bitrateValue: preset.bitrateValue ?? current.bitrateValue,
                      bitrateUnit: preset.bitrateUnit ?? current.bitrateUnit,
                      durationValue: preset.durationValue ?? current.durationValue,
                      durationUnit: preset.durationUnit ?? current.durationUnit,
                      sizeValue: preset.sizeValue ?? current.sizeValue,
                      sizeUnit: preset.sizeUnit ?? current.sizeUnit,
                      audioBitrateValue: preset.audioBitrateValue,
                      audioBitrateUnit: preset.audioBitrateUnit,
                      overheadPercent: preset.overheadPercent,
                      preset: preset.label,
                    }))
                  }
                >
                  {preset.label}
                </ToggleChip>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title={t("video.panelAnswer.title")} subtitle={`${t("video.panelAnswer.subtitle")}${result.modeLabel}`} className="span-2">
          <div className="result-card">
            <div className="result-badge">{t("video.resultLabel")}</div>
            <div className="result-line">{result.directAnswer}</div>
            <div className="result-subline">{result.secondaryLine}</div>
            {result.warning ? (
              <div className="result-subline result-warning">{result.warning}</div>
            ) : null}
          </div>

          <div className="stat-row">
            <StatBlock label={t("video.statVideoBitrate")} value={formatBitrate(result.displayVideoBps)} />
            <StatBlock label={t("video.statDuration")} value={formatDuration(result.displayDurationSeconds, lang)} />
            <StatBlock
              label={t("video.statFileSize")}
              value={`${formatDecimalSize(result.displaySizeBytes)} / ${formatCompactSize(result.displaySizeBytes)}`}
            />
          </div>
        </Panel>

        <Panel title={t("video.panelUnitExplain.title")} subtitle={t("video.panelUnitExplain.subtitle")}>
          <InfoBox tone="blue" title={t("video.panelUnitExplain.title")} text={result.unitExplanation} />
          <div className="note-copy">{result.summary}</div>
        </Panel>

        <Panel title={t("video.panelFormula.title")} subtitle={t("video.panelFormula.subtitle")}>
          <FormulaBlock>{result.formula}</FormulaBlock>
        </Panel>

        <Panel title={t("video.panelReality.title")} subtitle={t("video.panelReality.subtitle")}>
          <InfoBox tone="red" title={t("video.realityTitle")} text={result.realityNote} />
        </Panel>

        <Panel title={t("video.panelExamples.title")} subtitle={t("video.panelExamples.subtitle")}>
          <div className="examples-list">
            {state.mode === "size" ? (() => {
              const count = formatExampleCount(result.solvedSizeBytes / (8 * 1024 ** 3));
              if (!count) return null;
              return (
                <div className="example-item">
                  <span>{t("video.examples.movie").replace("{0}", count)}</span>
                </div>
              );
            })() : null}
            {state.mode === "duration" ? (() => {
              const count = formatExampleCount(result.solvedDurationSeconds / (45 * 60));
              if (!count) return null;
              return (
                <div className="example-item">
                  <span>{t("video.examples.episode").replace("{0}", count)}</span>
                </div>
              );
            })() : null}
            {state.mode === "bitrate" && result.solvedBitrateBps > 0 ? (
              <div className="example-item">
                <span>{t("video.examples.hourSize").replace("{0}", (() => { const bytes = (result.displayVideoBps * 3600 * result.overheadFactor) / 8; if (bytes < 1024 * 1024) return "< 1 MB"; return formatDecimalSize(bytes, 2) + " / " + formatCompactSize(bytes, 2); })())}</span>
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel title={t("video.panelShare.title")} subtitle={t("video.panelShare.subtitle")} className="span-2">
          <ShareLink url={shareUrl} />
        </Panel>
      </div>
    </section>
  );
}

function AboutPage() {
  const { t } = useTranslation();

  return (
    <section className="page">
      <PageHeader
        title={t("about.title")}
        description={t("about.description")}
      />

      <div className="about-grid">
        <Panel title={t("about.panelWhat.title")} subtitle={t("about.panelWhat.subtitle")}>
          <div className="stacked-copy">
            <p>{t("about.whatP1")}</p>
            <p>{t("about.whatP2")}</p>
            <p>{t("about.whatP3")}</p>
          </div>
        </Panel>

        <Panel title={t("about.panelHow.title")} subtitle={t("about.panelHow.subtitle")}>
          <div className="stacked-copy">
            <p>{t("about.howP1")}</p>
            <p>{t("about.howP2")}</p>
          </div>
        </Panel>

        <Panel title={t("about.panelPrivacy.title")} subtitle={t("about.panelPrivacy.subtitle")}>
          <div className="stacked-copy">
            <p>{t("about.privacyP1")}</p>
            <p>{t("about.privacyP2")}</p>
            <p>{t("about.privacyP3")}</p>
          </div>
        </Panel>
      </div>
    </section>
  );
}

function PageHeader({ title, description }: any) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        <p className="lead compact">{description}</p>
      </div>
    </header>
  );
}

function Panel({ title, subtitle, children, className = "" }: any) {
  return (
    <section className={`panel ${className}`.trim()}>
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function MetricBadge({ label, value }: any) {
  return (
    <div className="metric-badge">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

function StatBlock({ label, value }: any) {
  return (
    <div className="stat-block">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function InfoBox({ tone, title, text }: any) {
  return (
    <div className={`info-box tone-${tone}`}>
      <div className="info-title">{title}</div>
      <div className="info-text">{text}</div>
    </div>
  );
}

function FormulaBlock({ children }: any) {
  return <div className="formula-block">{children}</div>;
}

function FieldRow({ label, children, hint }: any) {
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

function ToggleChip({ active, children, onClick }: any) {
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

function NumberInput({ value, onChange, ...props }: any) {
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

function SelectInput({ value, onChange, options, ...props }: any) {
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

function ShareLink({ url }: any) {
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

function NavLink({ to, active, onNavigate, children }: any) {
  return (
    <a
      className={`nav-link ${active ? "nav-link-active" : ""}`}
      href={to}
      aria-current={active ? "page" : undefined}
      onClick={(event) => {
        event.preventDefault();
        onNavigate(to);
      }}
    >
      {children}
    </a>
  );
}

function useAppNavigation(): [string, (path: string) => void] {
  const [path, setPath] = useState(() => currentPath());

  useEffect(() => {
    const handlePopState = () => setPath(currentPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (nextPath) => {
    if (nextPath === currentPath()) return;
    window.history.pushState({}, "", nextPath);
    setPath(currentPath());
  };

  return [path, navigate];
}

function useSyncedState(
  storageKey: string,
  legacyStorageKey: string,
  defaults: any,
  pathname: string,
  decode: (params: URLSearchParams) => any,
  encode: (state: any) => string,
): [any, React.Dispatch<React.SetStateAction<any>>] {
  const [state, setState] = useState(() => {
    const fromQuery = decode(new URLSearchParams(window.location.search));
    const fromStorage = readStoredState(storageKey, legacyStorageKey);
    return {
      ...defaults,
      ...fromStorage,
      ...fromQuery,
    };
  });

  useEffect(() => {
    writeStoredState(storageKey, state);
    const query = encode(state);
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState({}, "", nextUrl);
    }
  }, [state, storageKey, pathname, encode]);

  return [state, setState];
}

function decodeStorageState(params: URLSearchParams) {
  const value = parseNumber(params.get("value"));
  const unit = params.get("unit");
  const scenario = params.get("scenario");
  const preset = params.get("preset");

  return {
    value: Number.isFinite(value) ? value : STORAGE_DEFAULTS.value,
    unit: STORAGE_UNIT_OPTIONS.some((item) => item.value === unit) ? unit : STORAGE_DEFAULTS.unit,
    scenario: STORAGE_SCENARIOS.some((item) => item.value === scenario) ? scenario : STORAGE_DEFAULTS.scenario,
    preset: preset ?? STORAGE_DEFAULTS.preset,
  };
}

function encodeStorageState(state: any): string {
  const params = new URLSearchParams();
  params.set("value", String(state.value));
  params.set("unit", state.unit);
  params.set("scenario", state.scenario);
  return params.toString();
}

function decodeNetworkState(params: URLSearchParams) {
  const bandwidthValue = parseNumber(params.get("bandwidthValue"));
  const bandwidthUnit = params.get("bandwidthUnit");
  const sizeValue = parseNumber(params.get("sizeValue"));
  const sizeUnit = params.get("sizeUnit");
  const scenario = params.get("scenario");
  const efficiency = parseNumber(params.get("efficiency"));
  const preset = params.get("preset");

  return {
    bandwidthValue: Number.isFinite(bandwidthValue) ? bandwidthValue : NETWORK_DEFAULTS.bandwidthValue,
    bandwidthUnit: NETWORK_UNIT_OPTIONS.some((item) => item.value === bandwidthUnit) ? bandwidthUnit : NETWORK_DEFAULTS.bandwidthUnit,
    sizeValue: Number.isFinite(sizeValue) ? sizeValue : NETWORK_DEFAULTS.sizeValue,
    sizeUnit: NETWORK_SIZE_OPTIONS.some((item) => item.value === sizeUnit) ? sizeUnit : NETWORK_DEFAULTS.sizeUnit,
    scenario: NETWORK_SCENARIOS.some((item) => item.value === scenario) ? scenario : NETWORK_DEFAULTS.scenario,
    efficiency: Number.isFinite(efficiency) ? efficiency : NETWORK_DEFAULTS.efficiency,
    preset: preset ?? NETWORK_DEFAULTS.preset,
  };
}

function encodeNetworkState(state: any): string {
  const params = new URLSearchParams();
  params.set("bandwidthValue", String(state.bandwidthValue));
  params.set("bandwidthUnit", state.bandwidthUnit);
  params.set("sizeValue", String(state.sizeValue));
  params.set("sizeUnit", state.sizeUnit);
  params.set("scenario", state.scenario);
  params.set("efficiency", String(state.efficiency));
  return params.toString();
}

function decodePowerState(params: URLSearchParams) {
  const watt = parseNumber(params.get("watt"));
  const hoursPerDay = parseNumber(params.get("hours"));
  const daysPerYear = parseNumber(params.get("days"));
  const price = parseNumber(params.get("price"));
  const currency = params.get("currency");
  const preset = params.get("preset");

  return {
    watt: Number.isFinite(watt) ? watt : POWER_DEFAULTS.watt,
    hoursPerDay: Number.isFinite(hoursPerDay) ? hoursPerDay : POWER_DEFAULTS.hoursPerDay,
    daysPerYear: Number.isFinite(daysPerYear) ? daysPerYear : POWER_DEFAULTS.daysPerYear,
    price: Number.isFinite(price) ? price : POWER_DEFAULTS.price,
    currency: POWER_CURRENCY_OPTIONS.some((item) => item.value === currency) ? currency : POWER_DEFAULTS.currency,
    preset: preset ?? POWER_DEFAULTS.preset,
  };
}

function encodePowerState(state: any): string {
  const params = new URLSearchParams();
  params.set("watt", String(state.watt));
  params.set("hours", String(state.hoursPerDay));
  params.set("days", String(state.daysPerYear));
  params.set("price", String(state.price));
  params.set("currency", state.currency);
  return params.toString();
}

function decodeVideoState(params: URLSearchParams) {
  const mode = params.get("mode");
  const bitrateValue = parseNumber(params.get("bitrateValue"));
  const bitrateUnit = params.get("bitrateUnit");
  const durationValue = parseNumber(params.get("durationValue"));
  const durationUnit = params.get("durationUnit");
  const sizeValue = parseNumber(params.get("sizeValue"));
  const sizeUnit = params.get("sizeUnit");
  const audioBitrateValue = parseNumber(params.get("audioBitrateValue"));
  const audioBitrateUnit = params.get("audioBitrateUnit");
  const overheadPercent = parseNumber(params.get("overhead"));
  const preset = params.get("preset");

  return {
    mode: VIDEO_TARGET_OPTIONS.some((item) => item.value === mode) ? mode : VIDEO_DEFAULTS.mode,
    bitrateValue: Number.isFinite(bitrateValue) ? bitrateValue : VIDEO_DEFAULTS.bitrateValue,
    bitrateUnit: VIDEO_BITRATE_OPTIONS.some((item) => item.value === bitrateUnit) ? bitrateUnit : VIDEO_DEFAULTS.bitrateUnit,
    durationValue: Number.isFinite(durationValue) ? durationValue : VIDEO_DEFAULTS.durationValue,
    durationUnit: VIDEO_DURATION_OPTIONS.some((item) => item.value === durationUnit) ? durationUnit : VIDEO_DEFAULTS.durationUnit,
    sizeValue: Number.isFinite(sizeValue) ? sizeValue : VIDEO_DEFAULTS.sizeValue,
    sizeUnit: VIDEO_SIZE_OPTIONS.some((item) => item.value === sizeUnit) ? sizeUnit : VIDEO_DEFAULTS.sizeUnit,
    audioBitrateValue: Number.isFinite(audioBitrateValue) ? audioBitrateValue : VIDEO_DEFAULTS.audioBitrateValue,
    audioBitrateUnit: VIDEO_BITRATE_OPTIONS.some((item) => item.value === audioBitrateUnit) ? audioBitrateUnit : VIDEO_DEFAULTS.audioBitrateUnit,
    overheadPercent: Number.isFinite(overheadPercent) ? overheadPercent : VIDEO_DEFAULTS.overheadPercent,
    preset: preset ?? VIDEO_DEFAULTS.preset,
  };
}

function encodeVideoState(state: any): string {
  const params = new URLSearchParams();
  params.set("mode", state.mode);
  params.set("bitrateValue", String(state.bitrateValue));
  params.set("bitrateUnit", state.bitrateUnit);
  params.set("durationValue", String(state.durationValue));
  params.set("durationUnit", state.durationUnit);
  params.set("sizeValue", String(state.sizeValue));
  params.set("sizeUnit", state.sizeUnit);
  params.set("audioBitrateValue", String(state.audioBitrateValue));
  params.set("audioBitrateUnit", state.audioBitrateUnit);
  params.set("overhead", String(state.overheadPercent));
  return params.toString();
}

function currentPath(): string {
  return normalizeRoute(window.location.pathname);
}

function normalizeRoute(pathname: string): string {
  if (pathname === "/storage" || pathname === "/network" || pathname === "/video" || pathname === "/power" || pathname === "/about") {
    return pathname;
  }
  return "/";
}

function formatExampleCount(n: number): string | null {
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 0.5) return "< 1";
  return Math.round(n).toLocaleString();
}

function parseNumber(value: string | null, fallback: number = Number.NaN): number {
  if (value === null || value === "") return Number.NaN;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}


function buildShareUrl(pathname: string, state: Record<string, any>): string {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const query = params.toString();
  return `${pathname}${query ? `?${query}` : ""}`;
}

const NETWORK_PRESETS = [
  {
    label: "1TiB / 1000Mbps",
    bandwidthValue: 1000,
    bandwidthUnit: "Mbps",
    sizeValue: 1,
    sizeUnit: "TiB",
    scenario: "wired-lan",
    efficiency: 85,
  },
  {
    label: "100GB / 1000Mbps",
    bandwidthValue: 1000,
    bandwidthUnit: "Mbps",
    sizeValue: 100,
    sizeUnit: "GB",
    scenario: "wired-lan",
    efficiency: 90,
  },
  {
    label: "1TB / 2.5Gbps",
    bandwidthValue: 2.5,
    bandwidthUnit: "Gbps",
    sizeValue: 1,
    sizeUnit: "TB",
    scenario: "wired-lan",
    efficiency: 95,
  },
  {
    label: "100GB / VPN",
    bandwidthValue: 500,
    bandwidthUnit: "Mbps",
    sizeValue: 100,
    sizeUnit: "GB",
    scenario: "vpn",
    efficiency: 70,
  },
];

export { AppRoot as App };
