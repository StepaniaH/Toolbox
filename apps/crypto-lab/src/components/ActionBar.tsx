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
  const [copiedInput, setCopiedInput] = useState(false)
  const [copiedOutput, setCopiedOutput] = useState(false)

  async function copy(value: string, setter: (v: boolean) => void) {
    await copyText(value)
    setter(true)
    setTimeout(() => setter(false), 1200)
  }

  function swap() {
    onInputChange(output)
    onOutputChange(input)
  }

  function clear() {
    onInputChange('')
    onOutputChange('')
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="tool-btn tool-btn-ghost"
        onClick={() => copy(input, setCopiedInput)}
        disabled={input.length === 0}
        aria-label={t('common.copyInput')}
      >
        {copiedInput ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {t('common.copyInput')}
      </button>
      <button
        type="button"
        className="tool-btn tool-btn-ghost"
        onClick={() => copy(output, setCopiedOutput)}
        disabled={output.length === 0}
        aria-label={t('common.copyOutput')}
      >
        {copiedOutput ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {t('common.copyOutput')}
      </button>
      {!hideSwap && (
        <button
          type="button"
          className="tool-btn tool-btn-ghost"
          onClick={swap}
          disabled={output.length === 0}
          aria-label={t('common.swap')}
        >
          <ArrowUpDown className="h-4 w-4" />
          {t('common.swap')}
        </button>
      )}
      <button
        type="button"
        className="tool-btn tool-btn-ghost"
        onClick={clear}
        aria-label={t('common.clear')}
      >
        <Trash2 className="h-4 w-4" />
        {t('common.clear')}
      </button>
    </div>
  )
}
