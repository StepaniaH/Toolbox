import { useCallback, useEffect, useState } from 'react'
import {
  DEFAULT_THEME,
  isTheme,
  THEME_ATTRIBUTE,
  THEME_STORAGE_KEY,
} from '@toolbox/theme/contract'
import type { ToolboxTheme } from '@toolbox/theme/contract'

export type Theme = ToolboxTheme

export { THEME_STORAGE_KEY }
export const LEGACY_THEME_STORAGE_KEY = 'ratelens-theme'

function readInitial(): Theme {
  const attr = document.documentElement.getAttribute(THEME_ATTRIBUTE)
  try {
    const shared = localStorage.getItem(THEME_STORAGE_KEY)
    const stored = shared ?? localStorage.getItem(LEGACY_THEME_STORAGE_KEY)
    if (shared === null && isTheme(stored)) {
      localStorage.setItem(THEME_STORAGE_KEY, stored)
    }
    if (isTheme(stored)) return stored
  } catch {
    /* ignore */
  }
  if (isTheme(attr)) return attr
  return DEFAULT_THEME
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
    document.documentElement.setAttribute(THEME_ATTRIBUTE, theme)
  }, [theme])

  const apply = useCallback((t: Theme) => {
    document.documentElement.setAttribute(THEME_ATTRIBUTE, t)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t)
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
        stored = localStorage.getItem(THEME_STORAGE_KEY)
      } catch {
        /* ignore */
      }
      if (!isTheme(stored)) {
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
