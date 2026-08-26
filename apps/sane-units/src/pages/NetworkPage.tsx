import { useMemo } from "react";
import {
  NETWORK_PRESETS,
  NETWORK_SCENARIOS,
  NETWORK_SIZE_OPTIONS,
  NETWORK_UNIT_OPTIONS,
  calculateNetwork,
  formatDuration,
  formatNumber,
  formatPercent,
} from "../lib/units";
import {
  useSyncedState,
  buildShareUrl,
  decodeNetworkState,
  encodeNetworkState,
  NETWORK_DEFAULTS,
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
} from "../components/ui";
import { useTranslation, durationWords } from "../lib/i18n";

export function NetworkPage() {
  const { t } = useTranslation();
  const [state, setState] = useSyncedState(STATE_STORAGE_KEYS.network, LEGACY_STATE_STORAGE_KEYS.network, NETWORK_DEFAULTS, "/network", decodeNetworkState, encodeNetworkState);
  const result = useMemo(
    () =>
      calculateNetwork({
        bandwidthValue: state.bandwidthValue,
        bandwidthUnit: state.bandwidthUnit,
        sizeValue: state.sizeValue,
        sizeUnit: state.sizeUnit,
        efficiency: state.efficiency,
      }),
    [state.bandwidthValue, state.bandwidthUnit, state.sizeValue, state.sizeUnit, state.efficiency],
  );
  const dur = durationWords(t);
  const theoryLine = `${formatNumber(state.bandwidthValue, 6)} ${state.bandwidthUnit} = ${formatNumber(result.theoreticalMBps, 2)} MB/s ≈ ${formatNumber(result.theoreticalMiBps, 2)} MiB/s`;
  const theoreticalTimeLine = formatDuration(result.theoreticalSeconds, dur);
  const effectiveTimeLine = formatDuration(result.effectiveSeconds, dur);
  const effectiveLineText = String(t("network.effectiveLine"))
    .replace("{0}", formatPercent(result.efficiency))
    .replace("{1}", effectiveTimeLine);
  const scenarioLabel = String(t(`network.scenarioLabels.${state.scenario}`) ?? t("network.scenarioLabels.public"));
  const realityNote = String(t("network.realityNote")).replace("{0}", scenarioLabel);
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
                  {t(`network.scenarioLabels.${scenario.value}`)}
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
            <div className="result-line">{theoryLine}</div>
            <div className="result-subline">{t("network.resultTheoryTime")}{theoreticalTimeLine}</div>
            <div className="result-subline">{effectiveLineText}</div>
          </div>

          <div className="stat-row">
            <StatBlock label={t("network.statTheoryMBs")} value={`${formatNumber(result.theoreticalMBps, 2)} MB/s`} />
            <StatBlock label={t("network.statTheoryMiBs")} value={`${formatNumber(result.theoreticalMiBps, 2)} MiB/s`} />
            <StatBlock label={t("network.statEffectiveTime")} value={effectiveTimeLine} />
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
            text={realityNote}
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
                  <span>{t(`network.examples.${key}`).replace("{0}", formatDuration(secs, dur))}</span>
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
