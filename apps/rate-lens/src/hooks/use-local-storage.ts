import { useCallback, useEffect, useState } from 'react'

/**
 * 泛型 localStorage 封装 — JSON 序列化, 跨标签同步.
 * SSR / 访问失败时回退到 initialValue.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const read = useCallback((): T => {
    try {
      const raw = localStorage.getItem(key)
      if (raw === null) return initialValue
      return JSON.parse(raw) as T
    } catch {
      return initialValue
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const [value, setValue] = useState<T>(read)

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved =
          typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        try {
          localStorage.setItem(key, JSON.stringify(resolved))
        } catch {
          /* quota / private mode — ignore */
        }
        return resolved
      })
    },
    [key],
  )

  // 跨标签页同步
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue === null) return
      try {
        setValue(JSON.parse(e.newValue) as T)
      } catch {
        /* ignore malformed */
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [key])

  return [value, set]
}
