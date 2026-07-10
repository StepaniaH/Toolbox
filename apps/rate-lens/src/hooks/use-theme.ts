import { useCallback, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'ratelens-theme'

function readInitial(): Theme {
  const attr = document.documentElement.getAttribute('data-theme')
  if (attr === 'light' || attr === 'dark') return attr
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  return 'dark'
}

/** Dark/Light 主题切换 + localStorage 持久化. */
export function useTheme(): {
  theme: Theme
  toggle: () => void
  setTheme: (t: Theme) => void
} {
  const [theme, setThemeState] = useState<Theme>(readInitial)

  // 保持 DOM data-theme 属性与 state 同步 (兜底，即使 pre-paint 脚本未执行)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const apply = useCallback((t: Theme) => {
    document.documentElement.setAttribute('data-theme', t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* ignore */
    }
  }, [])

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t)
      apply(t)
    },
    [apply],
  )

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      apply(next)
      return next
    })
  }, [apply])

  // 跟随系统偏好变化 (仅当用户未显式选择时)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = (e: MediaQueryListEvent) => {
      let stored: string | null = null
      try {
        stored = localStorage.getItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
      if (stored !== 'light' && stored !== 'dark') {
        const next: Theme = e.matches ? 'light' : 'dark'
        setThemeState(next)
        apply(next)
      }
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [apply])

  return { theme, toggle, setTheme }
}
