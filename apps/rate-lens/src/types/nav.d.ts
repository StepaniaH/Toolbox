// Type declaration for @toolbox/nav
// Bridges the raw .tsx source for TypeScript project references
declare module '@toolbox/nav' {
  import type { FC } from 'react'
  
  export interface NavApp {
    id: string
    label: string
    href: string
    description?: string
  }
  
  export interface NavBarProps {
    currentApp?: string
    apps?: NavApp[]
    onToggleTheme?: () => void
    rightSlot?: import('react').ReactNode
  }
  
  export const NavBar: FC<NavBarProps>
  export const NAV_APPS: NavApp[]
}
