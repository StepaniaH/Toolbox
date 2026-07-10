import { useCallback, useEffect, useRef, useState } from 'react'

export type ExchangeSource = 'auto' | 'manual' | 'default'

export interface ExchangeRateState {
  rate: number | null
  loading: boolean
  error: string | null
  source: ExchangeSource
}

export type RateFetcher = () => Promise<number>

/** 默认多端点 fallback: open.er-api → fawazahmed0 CDN. */
export const defaultRateFetcher: RateFetcher = async () => {
  const endpoints: Array<{ url: string; pick: (j: unknown) => number }> = [
    {
      url: 'https://open.er-api.com/v6/latest/USD',
      pick: (j) => (j as { rates?: Record<string, number> }).rates?.CNY,
    },
    {
      url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json',
      pick: (j) =>
        (j as { usd?: Record<string, number> }).usd?.cny,
    },
  ]
  let lastErr: unknown
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep.url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const v = ep.pick(json)
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v
      throw new Error('invalid rate')
    } catch (e) {
      lastErr = e
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('fetch failed')
}

/**
 * 自动获取 USD→CNY 汇率 + 手动覆盖 + 多 API fallback.
 *
 * ⚠️ `defaultRate` 通过 ref 读取, 不进入 effect 依赖, 避免重取循环.
 */
export function useExchangeRate(
  defaultRate = 7.2,
  fetcher: RateFetcher = defaultRateFetcher,
): ExchangeRateState & {
  setManual: (n: number) => void
  refetch: () => void
} {
  const [state, setState] = useState<ExchangeRateState>({
    rate: null,
    loading: true,
    error: null,
    source: 'auto',
  })

  const defaultRef = useRef(defaultRate)
  defaultRef.current = defaultRate
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const cancelledRef = useRef(false)

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const v = await fetcherRef.current()
      if (cancelledRef.current) return
      setState({ rate: v, loading: false, error: null, source: 'auto' })
    } catch (e) {
      if (cancelledRef.current) return
      setState({
        rate: defaultRef.current,
        loading: false,
        error: e instanceof Error ? e.message : 'fetch failed',
        source: 'default',
      })
    }
  }, [])

  useEffect(() => {
    cancelledRef.current = false
    void run()
    return () => {
      cancelledRef.current = true
    }
  }, [run])

  const setManual = useCallback((n: number) => {
    if (!Number.isFinite(n) || n <= 0) return
    setState({ rate: n, loading: false, error: null, source: 'manual' })
  }, [])

  const refetch = useCallback(() => {
    void run()
  }, [run])

  return { ...state, setManual, refetch }
}
