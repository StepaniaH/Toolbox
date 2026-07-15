import { useEffect, useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import { Tooltip } from './Tooltip'
import {
  decodeJwt,
  inspectJwtTimeClaims,
  MAX_JWT_CHARS,
  verifyJwtHs256,
  verifyJwtHs512,
  type JwtTimeInspection,
} from '@/lib/jwt'

type VerificationState = 'unverified' | 'verifying' | 'valid' | 'invalid' | 'unsupported'

export function JwtPanel() {
  const { lang, t } = useTranslation()
  const [input, setInput] = useState('')
  const [secret, setSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [header, setHeader] = useState('')
  const [payload, setPayload] = useState('')
  const [signature, setSignature] = useState('')
  const [algorithm, setAlgorithm] = useState('')
  const [verification, setVerification] = useState<VerificationState>('unverified')
  const [timeClaims, setTimeClaims] = useState<JwtTimeInspection[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function inspect() {
      if (input.trim().length === 0) {
        setHeader('')
        setPayload('')
        setSignature('')
        setAlgorithm('')
        setVerification('unverified')
        setTimeClaims([])
        setError('')
        return
      }
      if (input.length > MAX_JWT_CHARS) {
        setHeader('')
        setPayload('')
        setSignature('')
        setAlgorithm('')
        setVerification('unverified')
        setTimeClaims([])
        setError(t('jwt.inputTooLarge'))
        return
      }

      try {
        const decoded = decodeJwt(input)
        if (cancelled) return
        const nextAlgorithm = typeof decoded.header.alg === 'string' ? decoded.header.alg : ''
        setHeader(JSON.stringify(decoded.header, null, 2))
        setPayload(JSON.stringify(decoded.payload, null, 2))
        setSignature(decoded.signature)
        setAlgorithm(nextAlgorithm || 'unknown')
        setTimeClaims(inspectJwtTimeClaims(decoded.payload))
        setError('')

        if (nextAlgorithm !== 'HS256' && nextAlgorithm !== 'HS512') {
          setVerification('unsupported')
          return
        }
        if (secret.length === 0) {
          setVerification('unverified')
          return
        }
        setVerification('verifying')
        const valid = nextAlgorithm === 'HS256'
          ? await verifyJwtHs256(input, secret)
          : await verifyJwtHs512(input, secret)
        if (!cancelled) setVerification(valid ? 'valid' : 'invalid')
      } catch {
        if (cancelled) return
        setHeader('')
        setPayload('')
        setSignature('')
        setAlgorithm('')
        setVerification('unverified')
        setTimeClaims([])
        setError(t('jwt.invalidToken'))
      }
    }

    void inspect()
    return () => { cancelled = true }
  }, [input, secret, t])

  function formatNumericDate(value: number): string {
    return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(value * 1000))
  }

  const verificationText = verification === 'unsupported'
    ? t('jwt.verification.unsupported', { algorithm })
    : t(`jwt.verification.${verification}`)

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <label className="cl-label" htmlFor="jwt-token">{t('jwt.token')}</label>
          <Tooltip text={t('tip.jwt')} />
        </div>
        <textarea
          id="jwt-token"
          className="cl-input min-h-[6rem]"
          value={input}
          maxLength={MAX_JWT_CHARS + 1}
          onChange={(event) => setInput(event.target.value)}
          placeholder={t('jwt.tokenPlaceholder')}
          spellCheck={false}
        />
      </div>

      <div>
        <label className="cl-label" htmlFor="jwt-secret">{t('jwt.secret')}</label>
        <div className="cl-secret-field">
          <input
            id="jwt-secret"
            type={showSecret ? 'text' : 'password'}
            className="cl-text"
            value={secret}
            maxLength={4096}
            onChange={(event) => setSecret(event.target.value)}
            placeholder={t('jwt.secretPlaceholder')}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="button" className="cl-btn" onClick={() => setShowSecret((current) => !current)}>
            {t(showSecret ? 'jwt.hideSecret' : 'jwt.showSecret')}
          </button>
        </div>
        <p className="cl-hint cl-field-note">{t('jwt.secretHint')}</p>
      </div>

      {error && <p className="cl-error" role="alert">{error}</p>}

      {header && (
        <>
          <section className="cl-status-section" aria-labelledby="jwt-verification-title">
            <h3 id="jwt-verification-title">{t('jwt.verification.title')}</h3>
            <p className={`cl-status-line cl-status-${verification}`} role="status">{verificationText}</p>
          </section>

          <section className="cl-status-section" aria-labelledby="jwt-time-title">
            <h3 id="jwt-time-title">{t('jwt.time.title')}</h3>
            {timeClaims.length === 0 ? (
              <p className="cl-hint">{t('jwt.time.none')}</p>
            ) : (
              <dl className="cl-claim-list">
                {timeClaims.map((item) => (
                  <div key={item.claim}>
                    <dt>{item.claim}</dt>
                    <dd className={item.status === 'valid' ? 'text-green' : item.status === 'invalid' ? 'text-red' : 'text-yellow'}>
                      {t(`jwt.time.${item.status}`, {
                        date: item.value === undefined ? '' : formatNumericDate(item.value),
                      })}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="cl-label">{t('jwt.header')}</label>
              <pre className="cl-input min-h-[8rem] overflow-auto whitespace-pre-wrap text-xs">{header}</pre>
            </div>
            <div>
              <label className="cl-label">{t('jwt.payload')}</label>
              <pre className="cl-input min-h-[8rem] overflow-auto whitespace-pre-wrap text-xs">{payload}</pre>
            </div>
          </div>

          <div>
            <label className="cl-label">{t('jwt.signature')}</label>
            <pre className="cl-input min-h-[3rem] whitespace-pre-wrap break-all text-xs">{signature}</pre>
          </div>
        </>
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
