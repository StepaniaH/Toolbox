import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { useTheme } from '@/hooks/use-theme'

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
      useLocalStorage('ratelens-state', { a: 1 }),
    )
    act(() => result.current[1]({ a: 99 }))
    expect(result.current[0]).toEqual({ a: 99 })
    unmount()

    // 新实例应从 localStorage 恢复
    const { result: result2 } = renderHook(() =>
      useLocalStorage('ratelens-state', { a: 1 }),
    )
    expect(result2.current[0]).toEqual({ a: 99 })
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
    expect(localStorage.getItem('ratelens-theme')).toBe('light')

    act(() => result.current.toggle())
    expect(result.current.theme).toBe('dark')
    expect(localStorage.getItem('ratelens-theme')).toBe('dark')
  })
})
