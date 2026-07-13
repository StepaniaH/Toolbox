import { useEffect, useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import { decodeJwt, verifyJwtHs256, verifyJwtHs512 } from '@/lib/jwt'

export function JwtPanel() {
  const { t } = useTranslation()
  const [input, setInput] = useState('')
  const [secret, setSecret] = useState('')
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [signature, setSignature] = useState('')
  const [verified, setVerified] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (input.trim().length === 0) {
      setHeader('')
      setPayload('')
      setSignature('')
      setVerified(null)
      setError('')
      return
    }
    try {
      const decoded = decodeJwt(input)
      setHeader(JSON.stringify(decoded.header, null, 2))
      setPayload(JSON.stringify(decoded.payload, null, 2))
      setSignature(decoded.signature)
      setError('')
      if (secret.length === 0) {
        setVerified(null)
        return
      }
      const alg = decoded.header.alg
      let check: Promise<boolean>
      if (alg === 'HS256') {
        check = verifyJwtHs256(input, secret)
      } else if (alg === 'HS512') {
        check = verifyJwtHs512(input, secret)
      } else {
        setVerified(false)
        return
      }
      let cancelled = false
      check.then((ok) => {
        if (!cancelled) setVerified(ok)
      })
      return () => {
        cancelled = true
      }
    } catch (err) {
      setHeader('')
      setPayload('')
      setSignature('')
      setVerified(null)
      setError(err instanceof Error ? err.message : t('jwt.invalidToken'))
    }
  }, [input, secret, t])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="tool-label">{t('jwt.token')}</label>
        <textarea
          className="tool-input min-h-[6rem]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('jwt.tokenPlaceholder')}
          aria-label={t('jwt.token')}
        />
      </div>

      <div className="space-y-2">
        <label className="tool-label">{t('jwt.secret')}</label>
        <input
          type="text"
          className="tool-input w-full"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={t('jwt.secretPlaceholder')}
          aria-label={t('jwt.secret')}
        />
      </div>

      {error && <p className="tool-error">{t('common.error')}: {error}</p>}

      {verified !== null && (
        <p className={verified ? 'text-green text-sm' : 'text-red text-sm'}>
          {verified ? t('jwt.valid') : t('jwt.invalid')}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="tool-label">{t('jwt.header')}</label>
          <pre className="tool-input min-h-[10rem] overflow-auto whitespace-pre-wrap font-mono text-sm">
            {header}
          </pre>
        </div>
        <div className="space-y-2">
          <label className="tool-label">{t('jwt.payload')}</label>
          <pre className="tool-input min-h-[10rem] overflow-auto whitespace-pre-wrap font-mono text-sm">
            {payload}
          </pre>
        </div>
      </div>

      {signature && (
        <div className="space-y-2">
          <label className="tool-label">{t('jwt.signature')}</label>
          <pre className="tool-input min-h-[4rem] whitespace-pre-wrap break-all font-mono text-xs">
            {signature}
          </pre>
        </div>
      )}

      <ActionBar
        input={input}
        output={`${header}\n${payload}`}
        onInputChange={setInput}
        onOutputChange={() => {}}
        hideSwap
      />
    </div>
  )
}
