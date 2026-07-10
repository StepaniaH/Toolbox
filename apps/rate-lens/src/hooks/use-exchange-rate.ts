import { useCallback, useEffect, useRef, useState } from 'react'

export type ExchangeSource = 'auto' | 'manual' | 'default'

export interface ExchangeRateState {
  rate: number | null
  loading: boolean
  error: string | null
  source: ExchangeSource
}

export type RateFetcher = () => Promise<number>

const RATE_REQUEST_TIMEOUT_MS = 8_000

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    RATE_REQUEST_TIMEOUT_MS,
  )

  try {
    return await fetch(url, { signal: controller.signal })
  } finally {
    globalThis.clearTimeout(timeout)
  }
}

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
      const res = await fetchWithTimeout(ep.url)
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
 * 默认使用本地参考汇率。只有调用 `refetch()` 时才会主动访问第三方，
 * 同时保留手动覆盖与多端点 fallback。
 *
 * ⚠️ `defaultRate` 通过 ref 读取, 不进入 effect 依赖, 避免重取循环.
 */
export function useExchangeRate(
  defaultRate = 7.2,
  fetcher: RateFetcher = defaultRateFetcher,
): ExchangeRateState & {
  setManual: (n: number) => void
  refetch: () => Promise<void>
} {
  const [state, setState] = useState<ExchangeRateState>({
    rate: defaultRate,
    loading: false,
    error: null,
    source: 'default',
  })

  const defaultRef = useRef(defaultRate)
  defaultRef.current = defaultRate
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher
  const cancelledRef = useRef(false)
  const requestIdRef = useRef(0)

  const run = useCallback(async () => {
    const requestId = ++requestIdRef.current
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const v = await fetcherRef.current()
      if (cancelledRef.current || requestId !== requestIdRef.current) return
      setState({ rate: v, loading: false, error: null, source: 'auto' })
    } catch (e) {
      if (cancelledRef.current || requestId !== requestIdRef.current) return
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
    return () => {
      cancelledRef.current = true
      requestIdRef.current += 1
    }
  }, [])

  const setManual = useCallback((n: number) => {
    if (!Number.isFinite(n) || n <= 0) return
    requestIdRef.current += 1
    setState({ rate: n, loading: false, error: null, source: 'manual' })
  }, [])

  const refetch = useCallback(() => {
    return run()
  }, [run])

  return { ...state, setManual, refetch }
}
