import { useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import { Dropdown } from './Dropdown'
import { Tooltip } from './Tooltip'
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

type RsaSize = 2048 | 4096

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
      setOutput(await rsaEncrypt(message, key))
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('rsa.encryptFailed'))
    }
  }

  async function decrypt() {
    setError('')
    try {
      const key = await importPrivateKeyPem(privateKeyPem, 'encryption')
      setOutput(await rsaDecrypt(message, key))
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('rsa.decryptFailed'))
    }
  }

  async function sign() {
    setError('')
    try {
      let privPem = privateKeyPem
      if (!privPem) {
        const pair = await generateRsaKeyPair(size, 'signing')
        privPem = await exportPrivateKeyPem(pair.privateKey)
        setPrivateKeyPem(privPem)
        setPublicKeyPem(await exportPublicKeyPem(pair.publicKey))
      }
      const key = await importPrivateKeyPem(privPem, 'signing')
      setOutput(await rsaSign(message, key))
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

  const sizeOptions = [
    { value: '2048', label: '2048 bit' },
    { value: '4096', label: '4096 bit' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <Dropdown
          value={String(size)}
          options={sizeOptions}
          onChange={(v) => setSize(Number(v) as RsaSize)}
          ariaLabel={t('rsa.keySize')}
        />
        <button
          type="button"
          className="cl-btn cl-btn-primary"
          onClick={generateKeys}
          disabled={busy}
        >
          {busy ? t('rsa.generating') : t('rsa.generateEncryptionKeys')}
        </button>
        <Tooltip text={t('tip.rsaKeySize')} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className="cl-label">{t('rsa.publicKey')}</label>
          <textarea
            className="cl-input min-h-[7rem] text-xs"
            value={publicKeyPem}
            onChange={(e) => setPublicKeyPem(e.target.value)}
            placeholder={t('rsa.publicKeyPlaceholder')}
          />
        </div>
        <div>
          <label className="cl-label">{t('rsa.privateKey')}</label>
          <textarea
            className="cl-input min-h-[7rem] text-xs"
            value={privateKeyPem}
            onChange={(e) => setPrivateKeyPem(e.target.value)}
            placeholder={t('rsa.privateKeyPlaceholder')}
          />
        </div>
      </div>

      <div>
        <label className="cl-label">{t('rsa.message')}</label>
        <textarea
          className="cl-input min-h-[5rem]"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('rsa.messagePlaceholder')}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="cl-btn cl-btn-primary" onClick={encrypt}>
          {t('common.encrypt')}
        </button>
        <button type="button" className="cl-btn cl-btn-primary" onClick={decrypt}>
          {t('common.decrypt')}
        </button>
        <span className="w-px self-stretch bg-line" />
        <button type="button" className="cl-btn cl-btn-primary" onClick={sign}>
          {t('common.sign')}
        </button>
        <button type="button" className="cl-btn cl-btn-primary" onClick={verify}>
          {t('common.verify')}
        </button>
      </div>

      {output && (
        <div>
          <label className="cl-label">{t('common.output')}</label>
          <textarea
            className={`cl-input min-h-[5rem] ${error ? 'border-red' : ''}`}
            value={error || output}
            readOnly
          />
        </div>
      )}

      <ActionBar
        input={message}
        output={output}
        onInputChange={setMessage}
        onOutputChange={setOutput}
      />
    </div>
  )
}
