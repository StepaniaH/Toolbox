import { useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import { Dropdown } from './Dropdown'
import { Tooltip } from './Tooltip'
import {
  exportPrivateKeyPem,
  exportPublicKeyPem,
  generateRsaKeyPair,
  importPrivateKeyPem,
  importPublicKeyPem,
  MAX_RSA_PEM_CHARS,
  RsaError,
  rsaDecrypt,
  rsaEncrypt,
  rsaOaepMaxMessageBytes,
  rsaOaepMaxMessageBytesForBits,
  rsaSign,
  rsaVerify,
  type RsaUse,
} from '@/lib/rsa'
import { utf8ToBytes } from '@/lib/utils'

type RsaSize = 2048 | 4096

export function RsaPanel() {
  const { t } = useTranslation()
  const [purpose, setPurpose] = useState<RsaUse>('encryption')
  const [size, setSize] = useState<RsaSize>(2048)
  const [publicKeyPem, setPublicKeyPem] = useState('')
  const [privateKeyPem, setPrivateKeyPem] = useState('')
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [oaepMaxBytes, setOaepMaxBytes] = useState(rsaOaepMaxMessageBytesForBits(2048))
  const [busy, setBusy] = useState(false)
  const messageBytes = utf8ToBytes(message).length

  function clearResult() {
    setOutput('')
    setError('')
  }

  function changePurpose(nextPurpose: RsaUse) {
    if (nextPurpose === purpose) return
    setPurpose(nextPurpose)
    setPublicKeyPem('')
    setPrivateKeyPem('')
    setMessage('')
    setSignature('')
    clearResult()
  }

  async function generateKeys() {
    setBusy(true)
    clearResult()
    setSignature('')
    try {
      const pair = await generateRsaKeyPair(size, purpose)
      const [publicPem, privatePem] = await Promise.all([
        exportPublicKeyPem(pair.publicKey),
        exportPrivateKeyPem(pair.privateKey),
      ])
      setPublicKeyPem(publicPem)
      setPrivateKeyPem(privatePem)
      if (purpose === 'encryption') setOaepMaxBytes(rsaOaepMaxMessageBytes(pair.publicKey))
    } catch {
      setError(t('rsa.generateFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function encrypt() {
    clearResult()
    try {
      const key = await importPublicKeyPem(publicKeyPem, 'encryption')
      const maxBytes = rsaOaepMaxMessageBytes(key)
      setOaepMaxBytes(maxBytes)
      setOutput(await rsaEncrypt(message, key))
    } catch (caught) {
      if (caught instanceof RsaError) {
        setError(t('rsa.messageTooLong', { current: messageBytes, max: caught.maxBytes }))
      } else {
        setError(t('rsa.encryptFailed'))
      }
    }
  }

  async function decrypt() {
    clearResult()
    try {
      const key = await importPrivateKeyPem(privateKeyPem, 'encryption')
      setOutput(await rsaDecrypt(message, key))
    } catch {
      setError(t('rsa.decryptFailed'))
    }
  }

  async function sign() {
    clearResult()
    try {
      const key = await importPrivateKeyPem(privateKeyPem, 'signing')
      setSignature(await rsaSign(message, key))
    } catch {
      setSignature('')
      setError(t('rsa.signFailed'))
    }
  }

  async function verify() {
    clearResult()
    try {
      const key = await importPublicKeyPem(publicKeyPem, 'signing')
      const valid = await rsaVerify(message, signature, key)
      setOutput(valid ? t('rsa.valid') : t('rsa.invalid'))
    } catch {
      setError(t('rsa.verifyFailed'))
    }
  }

  const purposeOptions = [
    { value: 'encryption', label: t('rsa.encryption') },
    { value: 'signing', label: t('rsa.signing') },
  ]
  const sizeOptions = [
    { value: '2048', label: '2048 bit' },
    { value: '4096', label: '4096 bit' },
  ]

  return (
    <div className="space-y-5">
      <div className="cl-workbench-toolbar">
        <Dropdown
          value={purpose}
          options={purposeOptions}
          onChange={(value) => changePurpose(value as RsaUse)}
          ariaLabel={t('rsa.purpose')}
        />
        <Dropdown
          value={String(size)}
          options={sizeOptions}
          onChange={(value) => {
            const nextSize = Number(value) as RsaSize
            setSize(nextSize)
            setOaepMaxBytes(rsaOaepMaxMessageBytesForBits(nextSize))
            setPublicKeyPem('')
            setPrivateKeyPem('')
            setSignature('')
            clearResult()
          }}
          ariaLabel={t('rsa.keySize')}
        />
        <button type="button" className="cl-btn cl-btn-primary" onClick={generateKeys} disabled={busy}>
          {busy
            ? t('rsa.generating')
            : t(purpose === 'encryption' ? 'rsa.generateEncryptionKeys' : 'rsa.generateSigningKeys')}
        </button>
        <Tooltip text={t('tip.rsaKeySize')} />
      </div>

      <p className="cl-security-note">{t('rsa.purposeNotice')}</p>

      <div className="cl-key-grid">
        <div>
          <label className="cl-label" htmlFor="rsa-public-key">{t('rsa.publicKey')}</label>
          <textarea
            id="rsa-public-key"
            className="cl-input min-h-[7rem] text-xs"
            value={publicKeyPem}
            maxLength={MAX_RSA_PEM_CHARS}
            onChange={(event) => {
              setPublicKeyPem(event.target.value)
              clearResult()
            }}
            placeholder={t('rsa.publicKeyPlaceholder')}
            spellCheck={false}
          />
        </div>
        <details className="cl-private-key">
          <summary>{t('rsa.privateSummary')}</summary>
          <label className="cl-label" htmlFor="rsa-private-key">{t('rsa.privateKey')}</label>
          <textarea
            id="rsa-private-key"
            className="cl-input min-h-[7rem] text-xs"
            value={privateKeyPem}
            maxLength={MAX_RSA_PEM_CHARS}
            onChange={(event) => {
              setPrivateKeyPem(event.target.value)
              clearResult()
            }}
            placeholder={t('rsa.privateKeyPlaceholder')}
            spellCheck={false}
          />
        </details>
      </div>

      <div>
        <label className="cl-label" htmlFor="rsa-message">
          {t(purpose === 'encryption' ? 'rsa.encryptionInput' : 'rsa.signingMessage')}
        </label>
        <textarea
          id="rsa-message"
          className="cl-input min-h-[6rem]"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value)
            clearResult()
          }}
          placeholder={t(purpose === 'encryption' ? 'rsa.encryptionPlaceholder' : 'rsa.signingPlaceholder')}
        />
        {purpose === 'encryption' && (
          <p className={messageBytes > oaepMaxBytes ? 'cl-error cl-field-note' : 'cl-hint cl-field-note'}>
            {t('rsa.oaepBytes', { current: messageBytes, max: oaepMaxBytes })}
          </p>
        )}
      </div>

      {purpose === 'signing' && (
        <div>
          <label className="cl-label" htmlFor="rsa-signature">{t('rsa.signature')}</label>
          <textarea
            id="rsa-signature"
            className="cl-input min-h-[5rem] text-xs"
            value={signature}
            onChange={(event) => {
              setSignature(event.target.value)
              clearResult()
            }}
            placeholder={t('rsa.signaturePlaceholder')}
            spellCheck={false}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {purpose === 'encryption' ? (
          <>
            <button
              type="button"
              className="cl-btn cl-btn-primary"
              onClick={encrypt}
              disabled={!publicKeyPem || !message}
            >
              {t('common.encrypt')}
            </button>
            <button type="button" className="cl-btn" onClick={decrypt} disabled={!privateKeyPem || !message}>
              {t('common.decrypt')}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="cl-btn cl-btn-primary" onClick={sign} disabled={!privateKeyPem || !message}>
              {t('common.sign')}
            </button>
            <button type="button" className="cl-btn" onClick={verify} disabled={!publicKeyPem || !message || !signature}>
              {t('common.verify')}
            </button>
          </>
        )}
      </div>

      {error && <p className="cl-error" role="alert">{error}</p>}
      {output && (
        <div>
          <label className="cl-label" htmlFor="rsa-output">{t('common.output')}</label>
          <textarea id="rsa-output" className="cl-input min-h-[5rem]" value={output} readOnly />
        </div>
      )}

      <ActionBar
        input={message}
        output={purpose === 'signing' ? signature : output}
        onInputChange={setMessage}
        onOutputChange={purpose === 'signing' ? setSignature : setOutput}
        hideSwap={purpose === 'signing'}
      />
    </div>
  )
}
