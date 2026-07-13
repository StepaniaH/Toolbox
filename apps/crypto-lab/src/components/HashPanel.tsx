import { useEffect, useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import { computeAllHashes, hmacSha256, hmacSha512, digestToHex, digestToBase64 } from '@/lib/hash'

type HashRow = {
  name: string
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
  const [error, setError] = useState('')

  useEffect(() => {
    if (input.length === 0) {
      setRows([])
      setError('')
      return
    }
    let cancelled = false
    computeAllHashes(input)
      .then((all) => {
        if (cancelled) return
        setRows([
          { name: 'MD5', ...all.md5 },
          { name: 'SHA-1', ...all.sha1 },
          { name: 'SHA-256', ...all.sha256 },
          { name: 'SHA-512', ...all.sha512 },
          { name: 'SHA3-256', ...all.sha3_256 },
          { name: 'SHA3-512', ...all.sha3_512 },
        ])
        setError('')
      })
      .catch((err: Error) => {
        if (cancelled) return
        setError(err.message)
        setRows([])
      })
    return () => {
      cancelled = true
    }
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
        setHmacOutput(
          `${t('hash.lower')}: ${digestToHex(digest)}\n${t('hash.upper')}: ${digestToHex(digest).toUpperCase()}\n${t('hash.base64')}: ${digestToBase64(digest)}`,
        )
      })
      .catch(() => {
        if (cancelled) return
        setHmacOutput('')
      })
    return () => {
      cancelled = true
    }
  }, [input, hmacKey, hmacAlgo, t])

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="tool-label">{t('common.input')}</label>
        <textarea
          className="tool-input min-h-[8rem]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('hash.inputPlaceholder')}
          aria-label={t('common.input')}
        />
      </div>

      {error && <p className="tool-error">{t('common.error')}: {error}</p>}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-2 pr-4">{t('hash.algorithm')}</th>
                <th className="py-2 pr-4">{t('hash.lower')}</th>
                <th className="py-2 pr-4">{t('hash.upper')}</th>
                <th className="py-2">{t('hash.base64')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name} className="border-b border-line/50">
                  <td className="py-2 pr-4 font-medium">{row.name}</td>
                  <td className="py-2 pr-4 font-mono text-faint break-all">{row.lower}</td>
                  <td className="py-2 pr-4 font-mono text-faint break-all">{row.upper}</td>
                  <td className="py-2 font-mono text-faint break-all">{row.base64}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="space-y-3 border-t border-line pt-4">
        <h3 className="font-medium">{t('hash.hmac')}</h3>
        <div className="flex flex-wrap items-center gap-3">
          <label className="tool-label">{t('hash.hmacKey')}</label>
          <input
            type="text"
            className="tool-input w-auto min-w-[12rem]"
            value={hmacKey}
            onChange={(e) => setHmacKey(e.target.value)}
            placeholder={t('hash.hmacKeyPlaceholder')}
            aria-label={t('hash.hmacKey')}
          />
          <select
            className="tool-select"
            value={hmacAlgo}
            onChange={(e) => setHmacAlgo(e.target.value as 'sha256' | 'sha512')}
            aria-label={t('hash.hmacAlgo')}
          >
            <option value="sha256">HMAC-SHA256</option>
            <option value="sha512">HMAC-SHA512</option>
          </select>
        </div>
        {hmacOutput && (
          <pre className="tool-input min-h-[5rem] whitespace-pre-wrap font-mono text-sm">
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
