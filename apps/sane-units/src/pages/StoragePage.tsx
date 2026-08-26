import { useMemo } from "react";
import {
  STORAGE_PRESETS,
  STORAGE_SCENARIOS,
  STORAGE_UNIT_OPTIONS,
  calculateStorage,
  formatBytes,
  formatCompactSize,
  formatNumber,
  formatPercent,
} from "../lib/units";
import {
  useSyncedState,
  buildShareUrl,
  decodeStorageState,
  encodeStorageState,
  STORAGE_DEFAULTS,
} from "../lib/persisted-url-state";
import { STATE_STORAGE_KEYS, LEGACY_STATE_STORAGE_KEYS } from "../lib/storage";
import {
  PageHeader,
  Panel,
  StatBlock,
  InfoBox,
  FormulaBlock,
  FieldRow,
  ToggleChip,
  NumberInput,
  SelectInput,
  ShareLink,
  formatExampleCount,
} from "../components/ui";
import { useTranslation } from "../lib/i18n";

export function StoragePage() {
  const { t } = useTranslation();
  const [state, setState] = useSyncedState(STATE_STORAGE_KEYS.storage, LEGACY_STATE_STORAGE_KEYS.storage, STORAGE_DEFAULTS, "/storage", decodeStorageState, encodeStorageState);
  const result = useMemo(() => calculateStorage(state.value, state.unit), [state.value, state.unit]);
  const binaryDisplay = formatCompactSize(result.exactBytes, 2);
  const directAnswer = `${formatNumber(state.value, 6)} ${state.unit} = ${formatBytes(result.exactBytes)} bytes`;
  const isBinaryUnit = state.unit.includes("i");
  const scenarioOptions = STORAGE_SCENARIOS.map((scenario) => ({
    value: scenario.value,
    label: String(t(`storage.scenarioLabels.${scenario.value}`)),
  }));
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
              options={scenarioOptions}
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
            <div className="result-line">{directAnswer}</div>
            <div className="result-subline">{t("storage.resultBinaryDisplay")} {binaryDisplay}</div>
            <div className="result-subline">{t("storage.resultDifference")}{formatPercent(result.differencePercent)}</div>
          </div>

          <div className="stat-row">
            <StatBlock label={t("storage.statExactBytes")} value={formatBytes(result.exactBytes)} />
            <StatBlock label={t("storage.statBinaryDisplay")} value={binaryDisplay} />
            <StatBlock label={t("storage.statUnitDiff")} value={formatPercent(result.differencePercent)} />
          </div>
        </Panel>

        <Panel title={t("storage.panelUnitExplain.title")} subtitle={t("storage.panelUnitExplain.subtitle")}>
          <InfoBox
            tone="blue"
            title={t("storage.panelUnitExplain.title")}
            text={String(t(isBinaryUnit ? "storage.explainBinary" : "storage.explainDecimal")).replace("{0}", state.unit)}
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
            text={String(t("storage.realityNote"))}
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
