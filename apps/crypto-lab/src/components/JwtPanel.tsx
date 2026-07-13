import { useEffect, useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import { Tooltip } from './Tooltip'
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
      return () => { cancelled = true }
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
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <label className="cl-label">{t('jwt.token')}</label>
          <Tooltip text={t('tip.jwt')} />
        </div>
        <textarea
          className="cl-input min-h-[5rem]"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t('jwt.tokenPlaceholder')}
          aria-label={t('jwt.token')}
        />
      </div>

      <div>
        <label className="cl-label">{t('jwt.secret')}</label>
        <input
          type="text"
          className="cl-text w-full"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={t('jwt.secretPlaceholder')}
        />
      </div>

      {error && <p className="cl-error">{error}</p>}

      {verified !== null && (
        <p className={verified ? 'text-sm text-green' : 'text-sm text-red'}>
          {verified ? t('jwt.valid') : t('jwt.invalid')}
        </p>
      )}

      {header && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div>
            <label className="cl-label">{t('jwt.header')}</label>
            <pre className="cl-input min-h-[8rem] overflow-auto whitespace-pre-wrap text-xs">
              {header}
            </pre>
          </div>
          <div>
            <label className="cl-label">{t('jwt.payload')}</label>
            <pre className="cl-input min-h-[8rem] overflow-auto whitespace-pre-wrap text-xs">
              {payload}
            </pre>
          </div>
        </div>
      )}

      {signature && (
        <div>
          <label className="cl-label">{t('jwt.signature')}</label>
          <pre className="cl-input min-h-[3rem] whitespace-pre-wrap break-all text-xs">
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
