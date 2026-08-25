import { useMemo } from "react";
import {
  POWER_CURRENCY_OPTIONS,
  POWER_PRESETS,
  calculatePower,
  formatCurrencyAmount,
  formatNumber,
} from "../lib/units";
import {
  useSyncedState,
  buildShareUrl,
  decodePowerState,
  encodePowerState,
  POWER_DEFAULTS,
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

export function PowerPage() {
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
