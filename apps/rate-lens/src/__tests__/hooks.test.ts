import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_CONTRACT_VERSION,
  THEME_STORAGE_KEY,
} from '@toolbox/theme/contract'
import { useLocalStorage } from '@/hooks/use-local-storage'
import {
  THEME_STORAGE_KEY as HOOK_THEME_STORAGE_KEY,
  useTheme,
} from '@/hooks/use-theme'
import { useExchangeRate } from '@/hooks/use-exchange-rate'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns initial value when nothing stored', () => {
    const { result } = renderHook(() => useLocalStorage('k', { a: 1 }))
    expect(result.current[0]).toEqual({ a: 1 })
  })

  it('persists and restores across remounts (Gate 6 persistence)', () => {
    const { result, unmount } = renderHook(() =>
      useLocalStorage('toolbox.rate-lens.state', { a: 1 }),
    )
    act(() => result.current[1]({ a: 99 }))
    expect(result.current[0]).toEqual({ a: 99 })
    unmount()

    // 新实例应从 localStorage 恢复
    const { result: result2 } = renderHook(() =>
      useLocalStorage('toolbox.rate-lens.state', { a: 1 }),
    )
    expect(result2.current[0]).toEqual({ a: 99 })
  })

  it('migrates the legacy state key without losing data', () => {
    localStorage.setItem('ratelens-state', JSON.stringify({ a: 42 }))
    const { result } = renderHook(() =>
      useLocalStorage('toolbox.rate-lens.state', { a: 1 }, 'ratelens-state'),
    )
    expect(result.current[0]).toEqual({ a: 42 })
    expect(localStorage.getItem('toolbox.rate-lens.state')).toBe('{"a":42}')
  })

  it('supports updater function', () => {
    const { result } = renderHook(() => useLocalStorage('cnt', 0))
    act(() => result.current[1]((n) => n + 5))
    expect(result.current[0]).toBe(5)
    act(() => result.current[1]((n) => n + 1))
    expect(result.current[0]).toBe(6)
  })
})

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('defaults to dark and toggles to light (Gate 6 theme switching)', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    act(() => result.current.toggle())
    expect(result.current.theme).toBe('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem('toolbox-theme')).toBe('light')

    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('toolbox-theme')).toBe('dark')
  })

  it('consumes the shared v1 theme contract', () => {
    expect(THEME_CONTRACT_VERSION).toBe(1)
    expect(HOOK_THEME_STORAGE_KEY).toBe(THEME_STORAGE_KEY)
    expect(THEME_ATTRIBUTE).toBe('data-theme')
    expect(DEFAULT_THEME).toBe('dark')
  })

  it('reads the legacy theme key when the shared key is absent', () => {
    localStorage.setItem('ratelens-theme', 'light')
    document.documentElement.setAttribute('data-theme', 'light')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
    expect(localStorage.getItem('toolbox-theme')).toBe('light')
  })
})

describe('useExchangeRate privacy contract', () => {
  it('starts with the local reference rate and does not call the network fetcher', () => {
    const fetcher = vi.fn(async () => 7.3)
    const { result } = renderHook(() => useExchangeRate(7.2, fetcher))

    expect(result.current.rate).toBe(7.2)
    expect(result.current.loading).toBe(false)
    expect(result.current.source).toBe('default')
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('fetches a live rate only after an explicit refetch action', async () => {
    let resolveRate!: (rate: number) => void
    const fetcher = vi.fn(
      () => new Promise<number>((resolve) => {
        resolveRate = resolve
      }),
    )
    const { result } = renderHook(() => useExchangeRate(7.2, fetcher))
    let request!: Promise<void>

    act(() => {
      request = result.current.refetch()
    })

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result.current.loading).toBe(true)
    await act(async () => {
      resolveRate(7.3)
      await request
    })
    expect(result.current.rate).toBe(7.3)
    expect(result.current.source).toBe('auto')
    expect(result.current.error).toBeNull()
  })

  it('falls back to the local reference rate when an explicit fetch fails', async () => {
    const fetcher = vi.fn(async () => {
      throw new Error('offline')
    })
    const { result } = renderHook(() => useExchangeRate(7.2, fetcher))

    await act(async () => {
      await result.current.refetch()
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.rate).toBe(7.2)
    expect(result.current.source).toBe('default')
    expect(result.current.error).toBe('offline')
  })

  it('supports a fully local manual override without calling the fetcher', () => {
    const fetcher = vi.fn(async () => 7.3)
    const { result } = renderHook(() => useExchangeRate(7.2, fetcher))

    act(() => result.current.setManual(7.25))

    expect(result.current.rate).toBe(7.25)
    expect(result.current.source).toBe('manual')
    expect(result.current.error).toBeNull()
    expect(fetcher).not.toHaveBeenCalled()
  })
})
