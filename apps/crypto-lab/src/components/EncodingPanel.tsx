import { useEffect, useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import {
  decodeBase64,
  decodeBase64Url,
  decodeBase32,
  decodeBase58,
  decodeHex,
  decodeHtmlEntities,
  decodeUrl,
  decodeUrlComponent,
  encodeBase64,
  encodeBase64Url,
  encodeBase32,
  encodeBase58,
  encodeHex,
  encodeHtmlEntities,
  encodeUrl,
  encodeUrlComponent,
  convertRadix,
} from '@/lib/encoding'

type EncodingKind =
  | 'base64'
  | 'base64url'
  | 'url'
  | 'urlComponent'
  | 'html'
  | 'hex'
  | 'base32'
  | 'base58'
  | 'radix'

export function EncodingPanel() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [kind, setKind] = useState<EncodingKind>('base64')
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode')
  const [delimiter, setDelimiter] = useState(' ')
  const [prefix, setPrefix] = useState('\\x')
  const [fromBase, setFromBase] = useState('10')
  const [toBase, setToBase] = useState('16')
  const [alphabet, setAlphabet] = useState('')

  useEffect(() => {
    if (input.length === 0) {
      setOutput('')
      setError('')
      return
    }
    try {
      let result = ''
      if (kind === 'base64') {
        result = direction === 'encode' ? encodeBase64(input) : decodeBase64(input)
      } else if (kind === 'base64url') {
        result = direction === 'encode' ? encodeBase64Url(input) : decodeBase64Url(input)
      } else if (kind === 'url') {
        result = direction === 'encode' ? encodeUrl(input) : decodeUrl(input)
      } else if (kind === 'urlComponent') {
        result = direction === 'encode' ? encodeUrlComponent(input) : decodeUrlComponent(input)
      } else if (kind === 'html') {
        result =
          direction === 'encode'
            ? encodeHtmlEntities(input)
            : decodeHtmlEntities(input)
      } else if (kind === 'hex') {
        result =
          direction === 'encode'
            ? encodeHex(input, { delimiter, prefix })
            : decodeHex(input)
      } else if (kind === 'base32') {
        result = direction === 'encode' ? encodeBase32(input) : decodeBase32(input)
      } else if (kind === 'base58') {
        result = direction === 'encode' ? encodeBase58(input) : decodeBase58(input)
      } else if (kind === 'radix') {
        const from = Number.parseInt(fromBase, 10)
        const to = Number.parseInt(toBase, 10)
        const alpha = alphabet.trim() || undefined
        result = convertRadix(input, from, to, alpha)
      }
      setOutput(result)
      setError('')
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('encoding.invalidInput'))
    }
  }, [input, kind, direction, delimiter, prefix, fromBase, toBase, alphabet, t])

  const kinds: { value: EncodingKind; label: string }[] = [
    { value: 'base64', label: t('encoding.base64') },
    { value: 'base64url', label: t('encoding.base64Url') },
    { value: 'url', label: t('encoding.url') },
    { value: 'urlComponent', label: t('encoding.urlComponent') },
    { value: 'html', label: t('encoding.html') },
    { value: 'hex', label: t('encoding.hex') },
    { value: 'base32', label: t('encoding.base32') },
    { value: 'base58', label: t('encoding.base58') },
    { value: 'radix', label: t('encoding.radix') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="tool-label">{t('encoding.kind')}</label>
        <select
          className="tool-select"
          value={kind}
          onChange={(e) => setKind(e.target.value as EncodingKind)}
          aria-label={t('encoding.kind')}
        >
          {kinds.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>

        <label className="tool-label ml-2">{t('encoding.direction')}</label>
        <select
          className="tool-select"
          value={direction}
          onChange={(e) => setDirection(e.target.value as 'encode' | 'decode')}
          aria-label={t('encoding.direction')}
        >
          <option value="encode">{t('encoding.encode')}</option>
          <option value="decode">{t('encoding.decode')}</option>
        </select>
      </div>

      {kind === 'hex' && direction === 'encode' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="tool-label">{t('encoding.delimiter')}</label>
          <input
            type="text"
            className="tool-input w-auto min-w-[6rem]"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
            aria-label={t('encoding.delimiter')}
          />
          <label className="tool-label">{t('encoding.prefix')}</label>
          <input
            type="text"
            className="tool-input w-auto min-w-[6rem]"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            aria-label={t('encoding.prefix')}
          />
        </div>
      )}

      {kind === 'radix' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="tool-label">{t('encoding.fromBase')}</label>
          <input
            type="number"
            min={2}
            max={64}
            className="tool-input w-auto min-w-[5rem]"
            value={fromBase}
            onChange={(e) => setFromBase(e.target.value)}
            aria-label={t('encoding.fromBase')}
          />
          <label className="tool-label">{t('encoding.toBase')}</label>
          <input
            type="number"
            min={2}
            max={64}
            className="tool-input w-auto min-w-[5rem]"
            value={toBase}
            onChange={(e) => setToBase(e.target.value)}
            aria-label={t('encoding.toBase')}
          />
          <label className="tool-label">{t('encoding.alphabet')}</label>
          <input
            type="text"
            className="tool-input w-auto min-w-[12rem]"
            value={alphabet}
            onChange={(e) => setAlphabet(e.target.value)}
            placeholder={t('encoding.alphabetPlaceholder')}
            aria-label={t('encoding.alphabet')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="tool-label">{t('common.input')}</label>
          <textarea
            className="tool-input min-h-[10rem]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('encoding.inputPlaceholder')}
            aria-label={t('common.input')}
          />
        </div>
        <div className="space-y-2">
          <label className="tool-label">{t('common.output')}</label>
          <textarea
            className={`tool-input min-h-[10rem] ${error ? 'border-destructive' : ''}`}
            value={error || output}
            readOnly
            aria-label={t('common.output')}
            aria-invalid={error.length > 0}
          />
          {error && <p className="tool-error">{t('common.error')}: {error}</p>}
        </div>
      </div>

      <ActionBar
        input={input}
        output={output}
        onInputChange={setInput}
        onOutputChange={setOutput}
      />
    </div>
  )
}
