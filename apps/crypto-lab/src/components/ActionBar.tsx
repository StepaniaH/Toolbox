import { Copy, ArrowUpDown, Trash2, Check } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { copyText } from '@/lib/utils'

type ActionBarProps = {
  input: string
  output: string
  onInputChange: (value: string) => void
  onOutputChange: (value: string) => void
  hideSwap?: boolean
}

export function ActionBar({
  input,
  output,
  onInputChange,
  onOutputChange,
  hideSwap,
}: ActionBarProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState<'in' | 'out' | null>(null)

  async function copy(value: string, which: 'in' | 'out') {
    await copyText(value)
    setCopied(which)
    setTimeout(() => setCopied(null), 1200)
  }

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        className="cl-icon-btn"
        onClick={() => copy(input, 'in')}
        disabled={input.length === 0}
        title={t('common.copyInput')}
        aria-label={t('common.copyInput')}
      >
        {copied === 'in' ? <Check className="h-4 w-4 text-green" /> : <Copy className="h-4 w-4" />}
      </button>
      <button
        type="button"
        className="cl-icon-btn"
        onClick={() => copy(output, 'out')}
        disabled={output.length === 0}
        title={t('common.copyOutput')}
        aria-label={t('common.copyOutput')}
      >
        {copied === 'out' ? <Check className="h-4 w-4 text-green" /> : <Copy className="h-4 w-4" />}
      </button>
      {!hideSwap && (
        <button
          type="button"
          className="cl-icon-btn"
          onClick={() => {
            onInputChange(output)
            onOutputChange(input)
          }}
          disabled={output.length === 0}
          title={t('common.swap')}
          aria-label={t('common.swap')}
        >
          <ArrowUpDown className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        className="cl-icon-btn"
        onClick={() => {
          onInputChange('')
          onOutputChange('')
        }}
        title={t('common.clear')}
        aria-label={t('common.clear')}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
