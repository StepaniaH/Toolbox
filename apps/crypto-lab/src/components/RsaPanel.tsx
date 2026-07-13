import { useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import {
  generateRsaKeyPair,
  exportPublicKeyPem,
  exportPrivateKeyPem,
  importPublicKeyPem,
  importPrivateKeyPem,
  rsaEncrypt,
  rsaDecrypt,
  rsaSign,
  rsaVerify,
} from '@/lib/rsa'

type RsaSize = 1024 | 2048 | 4096

export function RsaPanel() {
  const { t } = useTranslation()
  const [size, setSize] = useState<RsaSize>(2048)
  const [publicKeyPem, setPublicKeyPem] = useState('')
  const [privateKeyPem, setPrivateKeyPem] = useState('')
  const [message, setMessage] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function generateKeys() {
    setBusy(true)
    setError('')
    try {
      const pair = await generateRsaKeyPair(size, 'encryption')
      const [pub, priv] = await Promise.all([
        exportPublicKeyPem(pair.publicKey),
        exportPrivateKeyPem(pair.privateKey),
      ])
      setPublicKeyPem(pub)
      setPrivateKeyPem(priv)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('rsa.generateFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function encrypt() {
    setError('')
    try {
      const key = await importPublicKeyPem(publicKeyPem, 'encryption')
      const result = await rsaEncrypt(message, key)
      setOutput(result)
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('rsa.encryptFailed'))
    }
  }

  async function decrypt() {
    setError('')
    try {
      const key = await importPrivateKeyPem(privateKeyPem, 'encryption')
      const result = await rsaDecrypt(message, key)
      setOutput(result)
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('rsa.decryptFailed'))
    }
  }

  async function sign() {
    setError('')
    try {
      // For signing we need a signing key pair. If the current keys are encryption keys, generate a signing pair on demand.
      let privPem = privateKeyPem
      let pubPem = publicKeyPem
      if (!privPem) {
        const pair = await generateRsaKeyPair(size, 'signing')
        privPem = await exportPrivateKeyPem(pair.privateKey)
        pubPem = await exportPublicKeyPem(pair.publicKey)
        setPrivateKeyPem(privPem)
        setPublicKeyPem(pubPem)
      }
      const key = await importPrivateKeyPem(privPem, 'signing')
      const result = await rsaSign(message, key)
      setOutput(result)
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('rsa.signFailed'))
    }
  }

  async function verify() {
    setError('')
    try {
      const key = await importPublicKeyPem(publicKeyPem, 'signing')
      const parts = message.split('\n')
      const signature = parts[0] ?? ''
      const msg = parts.slice(1).join('\n')
      const valid = await rsaVerify(msg, signature, key)
      setOutput(valid ? t('rsa.valid') : t('rsa.invalid'))
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('rsa.verifyFailed'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="tool-label">{t('rsa.keySize')}</label>
        <select
          className="tool-select"
          value={size}
          onChange={(e) => setSize(Number(e.target.value) as RsaSize)}
          aria-label={t('rsa.keySize')}
        >
          <option value={1024}>1024</option>
          <option value={2048}>2048</option>
          <option value={4096}>4096</option>
        </select>
        <button
          type="button"
          className="tool-btn tool-btn-primary"
          onClick={generateKeys}
          disabled={busy}
        >
          {busy ? t('rsa.generating') : t('rsa.generateEncryptionKeys')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="tool-label">{t('rsa.publicKey')}</label>
          <textarea
            className="tool-input min-h-[8rem] text-xs"
            value={publicKeyPem}
            onChange={(e) => setPublicKeyPem(e.target.value)}
            placeholder={t('rsa.publicKeyPlaceholder')}
            aria-label={t('rsa.publicKey')}
          />
        </div>
        <div className="space-y-2">
          <label className="tool-label">{t('rsa.privateKey')}</label>
          <textarea
            className="tool-input min-h-[8rem] text-xs"
            value={privateKeyPem}
            onChange={(e) => setPrivateKeyPem(e.target.value)}
            placeholder={t('rsa.privateKeyPlaceholder')}
            aria-label={t('rsa.privateKey')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="tool-label">{t('rsa.message')}</label>
        <textarea
          className="tool-input min-h-[6rem]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('rsa.messagePlaceholder')}
          aria-label={t('rsa.message')}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="tool-btn tool-btn-primary" onClick={encrypt}>
          {t('common.encrypt')}
        </button>
        <button type="button" className="tool-btn tool-btn-primary" onClick={decrypt}>
          {t('common.decrypt')}
        </button>
        <button type="button" className="tool-btn tool-btn-primary" onClick={sign}>
          {t('common.sign')}
        </button>
        <button type="button" className="tool-btn tool-btn-primary" onClick={verify}>
          {t('common.verify')}
        </button>
      </div>

      {output && (
        <div className="space-y-2">
          <label className="tool-label">{t('common.output')}</label>
          <textarea
            className={`tool-input min-h-[6rem] ${error ? 'border-destructive' : ''}`}
            value={error || output}
            readOnly
            aria-label={t('common.output')}
          />
        </div>
      )}

      {error && <p className="tool-error">{t('common.error')}: {error}</p>}

      <ActionBar
        input={message}
        output={output}
        onInputChange={setMessage}
        onOutputChange={setOutput}
      />
    </div>
  )
}
