import { useCallback } from 'react'
import { NavBar } from '@toolbox/nav'
import { useTranslation } from '@toolbox/i18n/react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GlossaryPanel } from '@/components/GlossaryPanel'
import { ModeSwitcher } from '@/components/ModeSwitcher'
import { StepIndicator } from '@/components/StepIndicator'
import { PresetButtons, type Preset } from '@/components/PresetButtons'
import { FundingInputs } from '@/components/FundingInputs'
import { ExchangeRateDisplay } from '@/components/ExchangeRateDisplay'
import { ForwardCalculator } from '@/components/ForwardCalculator'
import { ReverseCalculator } from '@/components/ReverseCalculator'
import { useTheme } from '@/hooks/use-theme'
import { useExchangeRate } from '@/hooks/use-exchange-rate'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { parseNum } from '@/lib/utils'
import '@toolbox/nav/nav-bar.css'
import type {
  AppState,
  CalcMode,
  ModelProvider,
  PriceKind,
  ReversePaidInput,
} from '@/types'

const DEFAULT_STATE: AppState = {
  mode: 'forward',
  recharge: '',
  arrived: '',
  groupRate: '',
  exchangeRate: '',
  provider: 'claude',
  reverseModelId: null,
  reversePaid: { input: null, output: null, cacheWrite: null, cacheRead: null },
  cacheExpanded: false,
}

const EMPTY_PAID: ReversePaidInput = {
  input: null,
  output: null,
  cacheWrite: null,
  cacheRead: null,
}

function App() {
  const { t } = useTranslation()
  const { toggle } = useTheme()
  const { rate, loading, source, setManual, refetch } = useExchangeRate(7.2)

  const [state, setState] = useLocalStorage<AppState>(
    'ratelens-state',
    DEFAULT_STATE,
  )

  const patch = useCallback(
    <K extends keyof AppState>(key: K, value: AppState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }))
    },
    [setState],
  )

  const onPreset = useCallback(
    (p: Preset) => {
      setState((prev) => ({
        ...prev,
        ...(p.recharge !== undefined ? { recharge: String(p.recharge) } : {}),
        ...(p.arrived !== undefined ? { arrived: String(p.arrived) } : {}),
        ...(p.groupRate !== undefined ? { groupRate: String(p.groupRate) } : {}),
      }))
    },
    [setState],
  )

  const onPaidField = useCallback(
    (kind: PriceKind, value: string) => {
      setState((prev) => ({
        ...prev,
        reversePaid: { ...prev.reversePaid, [kind]: parseNum(value) },
      }))
    },
    [setState],
  )

  const onClearPaid = useCallback(() => {
    setState((prev) => ({ ...prev, reversePaid: EMPTY_PAID }))
  }, [setState])

  return (
    <>
      <NavBar currentApp="rate-lens" onToggleTheme={toggle} />
      <div className="mx-auto max-w-4xl px-4 pb-12">
        <Header />

      <div className="flex flex-col gap-4">
        <GlossaryPanel />

        <div className="flex justify-center">
          <ModeSwitcher
            mode={state.mode}
            onChange={(m: CalcMode) => patch('mode', m)}
          />
        </div>

        <StepIndicator mode={state.mode} />

        <PresetButtons mode={state.mode} onPreset={onPreset} />

        <FundingInputs
          recharge={state.recharge}
          arrived={state.arrived}
          onRecharge={(v) => patch('recharge', v)}
          onArrived={(v) => patch('arrived', v)}
        />

        <ExchangeRateDisplay
          rate={rate}
          loading={loading}
          source={source}
          onManual={setManual}
          onRefetch={refetch}
        />

        {state.mode === 'forward' ? (
          <ForwardCalculator
            key="forward"
            recharge={state.recharge}
            arrived={state.arrived}
            groupRate={state.groupRate}
            onGroupRate={(v) => patch('groupRate', v)}
            rate={rate}
            provider={state.provider}
            onProvider={(p: ModelProvider) => patch('provider', p)}
          />
        ) : (
          <ReverseCalculator
            key="reverse"
            recharge={state.recharge}
            arrived={state.arrived}
            rate={rate}
            reverseModelId={state.reverseModelId}
            onReverseModelId={(id) => patch('reverseModelId', id)}
            reversePaid={state.reversePaid}
            onPaidField={onPaidField}
            cacheExpanded={state.cacheExpanded}
            onCacheExpanded={(v) => patch('cacheExpanded', v)}
          />
        )}

        {state.mode === 'reverse' && (
          <button
            type="button"
            onClick={onClearPaid}
            className="self-center text-xs text-faint transition-colors hover:text-red"
          >
            {t('app.clearPaid')}
          </button>
        )}
      </div>

      <Footer />
      </div>
    </>
  )
}

export default App
