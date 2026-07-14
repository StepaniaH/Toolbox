import { useEffect, useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import { Dropdown } from './Dropdown'
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
        result = direction === 'encode' ? encodeHtmlEntities(input) : decodeHtmlEntities(input)
      } else if (kind === 'hex') {
        result = direction === 'encode' ? encodeHex(input, { delimiter, prefix }) : decodeHex(input)
      } else if (kind === 'base32') {
        result = direction === 'encode' ? encodeBase32(input) : decodeBase32(input)
      } else if (kind === 'base58') {
        result = direction === 'encode' ? encodeBase58(input) : decodeBase58(input)
      } else if (kind === 'radix') {
        const from = Number.parseInt(fromBase, 10)
        const to = Number.parseInt(toBase, 10)
        result = convertRadix(input, from, to, alphabet.trim() || undefined)
      }
      setOutput(result)
      setError('')
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('encoding.invalidInput'))
    }
  }, [input, kind, direction, delimiter, prefix, fromBase, toBase, alphabet, t])

  const kindOptions = [
    { value: 'base64', label: 'Base64' },
    { value: 'base64url', label: 'Base64URL' },
    { value: 'url', label: t('encoding.url') },
    { value: 'urlComponent', label: t('encoding.urlComponent') },
    { value: 'html', label: t('encoding.html') },
    { value: 'hex', label: 'Hex' },
    { value: 'base32', label: 'Base32' },
    { value: 'base58', label: 'Base58' },
    { value: 'radix', label: t('encoding.radix') },
  ]

  const dirOptions = [
    { value: 'encode', label: t('encoding.encode') },
    { value: 'decode', label: t('encoding.decode') },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          value={kind}
          options={kindOptions}
          onChange={(v) => setKind(v as EncodingKind)}
          ariaLabel={t('encoding.kind')}
        />
        <Dropdown
          value={direction}
          options={dirOptions}
          onChange={(v) => setDirection(v as 'encode' | 'decode')}
          ariaLabel={t('encoding.direction')}
        />
      </div>

      {kind === 'hex' && direction === 'encode' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="cl-label">{t('encoding.delimiter')}</label>
          <input
            type="text"
            className="cl-text w-20"
            value={delimiter}
            onChange={(e) => setDelimiter(e.target.value)}
          />
          <label className="cl-label">{t('encoding.prefix')}</label>
          <input
            type="text"
            className="cl-text w-20"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
        </div>
      )}

      {kind === 'radix' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="cl-label">{t('encoding.fromBase')}</label>
          <input
            type="number"
            min={2}
            max={64}
            className="cl-text w-16"
            value={fromBase}
            onChange={(e) => setFromBase(e.target.value)}
          />
          <span className="text-faint">→</span>
          <label className="cl-label">{t('encoding.toBase')}</label>
          <input
            type="number"
            min={2}
            max={64}
            className="cl-text w-16"
            value={toBase}
            onChange={(e) => setToBase(e.target.value)}
          />
          <input
            type="text"
            className="cl-text min-w-[10rem] flex-1"
            value={alphabet}
            onChange={(e) => setAlphabet(e.target.value)}
            placeholder={t('encoding.alphabetPlaceholder')}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="cl-label">{t('common.input')}</label>
          </div>
          <textarea
            className="cl-input min-h-[12rem]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('encoding.inputPlaceholder')}
            aria-label={t('common.input')}
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="cl-label">
              {t('common.output')}
              {error && <span className="cl-error ml-2">{t('common.error')}</span>}
            </label>
          </div>
          <textarea
            className={`cl-input min-h-[12rem] ${error ? 'border-red' : ''}`}
            value={error || output}
            readOnly
            aria-label={t('common.output')}
            aria-invalid={error.length > 0}
          />
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
