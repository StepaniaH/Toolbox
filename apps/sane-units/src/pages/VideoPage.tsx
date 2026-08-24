import { useMemo } from "react";
import {
  VIDEO_BITRATE_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  VIDEO_PRESETS,
  VIDEO_SIZE_OPTIONS,
  VIDEO_TARGET_OPTIONS,
  calculateVideo,
  formatBitrate,
  formatCompactSize,
  formatDecimalSize,
  formatDuration,
} from "../lib/units";
import {
  useSyncedState,
  buildShareUrl,
  decodeVideoState,
  encodeVideoState,
  VIDEO_DEFAULTS,
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

export function VideoPage() {
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
