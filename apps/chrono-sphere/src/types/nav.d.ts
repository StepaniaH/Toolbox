declare module '@toolbox/nav' {
  import type { FC } from 'react'
  export interface NavApp { id: string; label: string; labelEn?: string; href: string; desc: string; descEn?: string; keywords: readonly string[]; keywordsEn?: readonly string[] }
  export interface NavBarProps { currentApp?: string; apps?: NavApp[]; onToggleTheme?: () => void; rightSlot?: import('react').ReactNode }
  export const NavBar: FC<NavBarProps>
  export const NAV_APPS: NavApp[]
}
