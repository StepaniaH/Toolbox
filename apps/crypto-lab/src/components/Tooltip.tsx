import { type ReactNode } from 'react'
import { Info } from 'lucide-react'

type TooltipProps = {
  text: string
  children?: ReactNode
}

export function Tooltip({ text, children }: TooltipProps) {
  return (
    <span className="cl-tooltip" tabIndex={0}>
      {children ?? <Info className="h-3.5 w-3.5 text-overlay" />}
      <span className="cl-tooltip-content">{text}</span>
    </span>
  )
}
