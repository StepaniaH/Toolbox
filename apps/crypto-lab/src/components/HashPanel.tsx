import { useEffect, useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import { Dropdown } from './Dropdown'
import { Tooltip } from './Tooltip'
import { computeAllHashes, hmacSha256, hmacSha512, digestToHex, digestToBase64 } from '@/lib/hash'

type HashRow = {
  id: string
  name: string
  tipKey: string
  lower: string
  upper: string
  base64: string
}

export function HashPanel() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [rows, setRows] = useState<HashRow[]>([])
  const [hmacKey, setHmacKey] = useState('')
  const [hmacAlgo, setHmacAlgo] = useState<'sha256' | 'sha512'>('sha256')
  const [hmacOutput, setHmacOutput] = useState('')

  useEffect(() => {
    if (input.length === 0) {
      setRows([])
      return
    }
    let cancelled = false
    computeAllHashes(input)
      .then((all) => {
        if (cancelled) return
        setRows([
          { id: 'md5', name: 'MD5', tipKey: 'tip.md5', ...all.md5 },
          { id: 'sha1', name: 'SHA-1', tipKey: 'tip.sha1', ...all.sha1 },
          { id: 'sha256', name: 'SHA-256', tipKey: 'tip.sha256', ...all.sha256 },
          { id: 'sha512', name: 'SHA-512', tipKey: 'tip.sha512', ...all.sha512 },
          { id: 'sha3_256', name: 'SHA3-256', tipKey: 'tip.sha3', ...all.sha3_256 },
          { id: 'sha3_512', name: 'SHA3-512', tipKey: 'tip.sha3', ...all.sha3_512 },
        ])
      })
      .catch(() => {
        if (cancelled) return
        setRows([])
      })
    return () => { cancelled = true }
  }, [input])

  useEffect(() => {
    if (input.length === 0 || hmacKey.length === 0) {
      setHmacOutput('')
      return
    }
    let cancelled = false
    const compute = hmacAlgo === 'sha256' ? hmacSha256 : hmacSha512
    compute(input, hmacKey)
      .then((digest) => {
        if (cancelled) return
        const hex = digestToHex(digest)
        setHmacOutput(`${hex}\n${hex.toUpperCase()}\n${digestToBase64(digest)}`)
      })
      .catch(() => {
        if (cancelled) return
        setHmacOutput('')
      })
    return () => { cancelled = true }
  }, [input, hmacKey, hmacAlgo])

  const hmacOptions = [
    { value: 'sha256', label: 'HMAC-SHA256' },
    { value: 'sha512', label: 'HMAC-SHA512' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <label className="cl-label">{t('common.input')}</label>
        <textarea
          className="cl-input min-h-[7rem]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('hash.inputPlaceholder')}
          aria-label={t('common.input')}
        />
      </div>

      {rows.length > 0 && (
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[7rem_1fr] items-start gap-2 py-1">
              <div className="flex items-center gap-1 pt-0.5 text-sm font-medium">
                <span>{row.name}</span>
                <Tooltip text={t(row.tipKey)} />
              </div>
              <div className="mono break-all text-xs leading-relaxed text-faint">
                {row.lower}
              </div>
            </div>
          ))}
        </div>
      )}

      <hr className="cl-divider" />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{t('hash.hmac')}</h3>
          <Tooltip text={t('tip.hmac')} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            className="cl-text min-w-[12rem] flex-1"
            value={hmacKey}
            onChange={(e) => setHmacKey(e.target.value)}
            placeholder={t('hash.hmacKeyPlaceholder')}
            aria-label={t('hash.hmacKey')}
          />
          <Dropdown
            value={hmacAlgo}
            options={hmacOptions}
            onChange={(v) => setHmacAlgo(v as 'sha256' | 'sha512')}
            ariaLabel={t('hash.hmacAlgo')}
          />
        </div>
        {hmacOutput && (
          <pre className="cl-input min-h-[4rem] whitespace-pre-wrap break-all text-xs">
            {hmacOutput}
          </pre>
        )}
      </div>

      <ActionBar
        input={input}
        output={rows.map((r) => `${r.name}: ${r.lower}`).join('\n')}
        onInputChange={setInput}
        onOutputChange={() => {}}
        hideSwap
      />
    </div>
  )
}
