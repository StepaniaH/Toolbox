import { useMemo, useState, type ChangeEvent } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import {
  decryptShareMessage,
  encryptShareMessage,
  MAX_SHARE_MESSAGE_BYTES,
  ShareError,
  shareMessageByteLength,
} from '@/lib/share'
import { createShareQrDataUrl, readSharePacketFile, ShareImportError } from '@/lib/qr'
import {
  exportPrivateKeyPem,
  exportPublicKeyPem,
  generateRsaKeyPair,
} from '@/lib/rsa'
import { copyText } from '@/lib/utils'

type BusyAction = 'keys' | 'encrypt' | 'import' | 'decrypt' | null

function triggerDownload(url: string, filename: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
  triggerDownload(url, filename)
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function SharePanel() {
  const { t } = useTranslation()
  const [publicKey, setPublicKey] = useState('')
  const [privateKey, setPrivateKey] = useState('')
  const [message, setMessage] = useState('')
  const [packet, setPacket] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [decrypted, setDecrypted] = useState('')
  const [errorKey, setErrorKey] = useState('')
  const [statusKey, setStatusKey] = useState('')
  const [busy, setBusy] = useState<BusyAction>(null)
  const messageBytes = useMemo(() => shareMessageByteLength(message), [message])

  function reportError(error: unknown, fallback: string) {
    setStatusKey('')
    if (error instanceof ShareError) {
      setErrorKey(`share.errors.${error.code}`)
    } else if (error instanceof ShareImportError) {
      setErrorKey(`share.errors.${error.code}`)
    } else {
      setErrorKey(fallback)
    }
  }

  async function generateKeys() {
    setBusy('keys')
    setErrorKey('')
    setStatusKey('')
    try {
      const pair = await generateRsaKeyPair(2048, 'encryption')
      const [nextPublicKey, nextPrivateKey] = await Promise.all([
        exportPublicKeyPem(pair.publicKey),
        exportPrivateKeyPem(pair.privateKey),
      ])
      setPublicKey(nextPublicKey)
      setPrivateKey(nextPrivateKey)
      setStatusKey('share.status.keysReady')
    } catch (error) {
      reportError(error, 'share.errors.key-generation')
    } finally {
      setBusy(null)
    }
  }

  async function createPacket() {
    setBusy('encrypt')
    setErrorKey('')
    setStatusKey('')
    try {
      const nextPacket = await encryptShareMessage(message, publicKey)
      const nextQr = await createShareQrDataUrl(nextPacket)
      setPacket(nextPacket)
      setQrDataUrl(nextQr)
      setStatusKey('share.status.packetReady')
    } catch (error) {
      setQrDataUrl('')
      reportError(error, 'share.errors.encryption-failed')
    } finally {
      setBusy(null)
    }
  }

  async function importPacket(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setBusy('import')
    setErrorKey('')
    setStatusKey('')
    try {
      setPacket(await readSharePacketFile(file))
      setDecrypted('')
      setStatusKey('share.status.imported')
    } catch (error) {
      reportError(error, 'share.errors.import-failed')
    } finally {
      setBusy(null)
    }
  }

  async function decryptPacket() {
    setBusy('decrypt')
    setErrorKey('')
    setStatusKey('')
    try {
      setDecrypted(await decryptShareMessage(packet, privateKey))
      setStatusKey('share.status.decrypted')
    } catch (error) {
      setDecrypted('')
      reportError(error, 'share.errors.decryption-failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="cl-share">
      <header className="cl-module-intro">
        <p className="cl-eyebrow">RSA-OAEP-256 + AES-256-GCM</p>
        <h2>{t('share.title')}</h2>
        <p>{t('share.intro')}</p>
        <ul className="cl-inline-facts" aria-label={t('share.factsLabel')}>
          <li>{t('share.factLocal')}</li>
          <li>{t('share.factPrivate')}</li>
          <li>{t('share.factAuthenticated')}</li>
        </ul>
      </header>

      <section className="cl-share-section" aria-labelledby="share-keys-title">
        <div className="cl-section-heading">
          <span aria-hidden="true">1</span>
          <div>
            <h3 id="share-keys-title">{t('share.keys.title')}</h3>
            <p>{t('share.keys.detail')}</p>
          </div>
        </div>
        <div className="cl-section-actions">
          <button type="button" className="cl-btn cl-btn-primary" onClick={generateKeys} disabled={busy !== null}>
            {busy === 'keys' ? t('share.keys.generating') : t('share.keys.generate')}
          </button>
          <span className="cl-hint">{t('share.keys.standard')}</span>
        </div>
        <div className="cl-key-grid">
          <div>
            <label className="cl-label" htmlFor="share-public-key">{t('share.keys.public')}</label>
            <textarea
              id="share-public-key"
              className="cl-input min-h-[8rem] text-xs"
              value={publicKey}
              onChange={(event) => setPublicKey(event.target.value)}
              placeholder={t('share.keys.publicPlaceholder')}
              spellCheck={false}
            />
            <button type="button" className="cl-text-action" disabled={!publicKey} onClick={() => copyText(publicKey)}>
              {t('share.keys.copyPublic')}
            </button>
          </div>
          <details className="cl-private-key">
            <summary>{t('share.keys.privateSummary')}</summary>
            <label className="cl-label" htmlFor="share-private-key">{t('share.keys.private')}</label>
            <textarea
              id="share-private-key"
              className="cl-input min-h-[8rem] text-xs"
              value={privateKey}
              onChange={(event) => setPrivateKey(event.target.value)}
              placeholder={t('share.keys.privatePlaceholder')}
              spellCheck={false}
            />
            <div className="cl-private-actions">
              <button type="button" className="cl-text-action" disabled={!privateKey} onClick={() => copyText(privateKey)}>
                {t('share.keys.copyPrivate')}
              </button>
              <button type="button" className="cl-text-action" disabled={!privateKey} onClick={() => downloadText(privateKey, 'cryptolab-private-key.pem')}>
                {t('share.keys.downloadPrivate')}
              </button>
            </div>
            <p className="cl-security-note">{t('share.keys.privateWarning')}</p>
          </details>
        </div>
      </section>

      <section className="cl-share-section" aria-labelledby="share-encrypt-title">
        <div className="cl-section-heading">
          <span aria-hidden="true">2</span>
          <div>
            <h3 id="share-encrypt-title">{t('share.encrypt.title')}</h3>
            <p>{t('share.encrypt.detail')}</p>
          </div>
        </div>
        <label className="cl-label" htmlFor="share-message">{t('share.encrypt.message')}</label>
        <textarea
          id="share-message"
          className="cl-input min-h-[7rem]"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={t('share.encrypt.placeholder')}
          maxLength={MAX_SHARE_MESSAGE_BYTES}
        />
        <div className="cl-field-meta">
          <span className={messageBytes > MAX_SHARE_MESSAGE_BYTES ? 'cl-error' : ''}>
            {t('share.encrypt.bytes', { current: messageBytes, max: MAX_SHARE_MESSAGE_BYTES })}
          </span>
          <button type="button" className="cl-btn cl-btn-primary" onClick={createPacket} disabled={busy !== null || !publicKey || !message}>
            {busy === 'encrypt' ? t('share.encrypt.creating') : t('share.encrypt.create')}
          </button>
        </div>
        {qrDataUrl && (
          <div className="cl-share-result" aria-live="polite">
            <div className="cl-qr-preview">
              <img src={qrDataUrl} alt={t('share.encrypt.qrAlt')} />
              <p>{t('share.encrypt.qrHint')}</p>
            </div>
            <div>
              <label className="cl-label" htmlFor="share-packet-output">{t('share.packet')}</label>
              <textarea id="share-packet-output" className="cl-input min-h-[8rem] text-xs" value={packet} readOnly />
              <div className="cl-section-actions">
                <button type="button" className="cl-btn" onClick={() => copyText(packet)}>{t('share.encrypt.copyPacket')}</button>
                <button type="button" className="cl-btn" onClick={() => triggerDownload(qrDataUrl, 'cryptolab-secure-message.png')}>{t('share.encrypt.downloadQr')}</button>
                <button type="button" className="cl-btn" onClick={() => downloadText(packet, 'cryptolab-secure-message.cryptolab')}>{t('share.encrypt.downloadPacket')}</button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="cl-share-section" aria-labelledby="share-decrypt-title">
        <div className="cl-section-heading">
          <span aria-hidden="true">3</span>
          <div>
            <h3 id="share-decrypt-title">{t('share.decrypt.title')}</h3>
            <p>{t('share.decrypt.detail')}</p>
          </div>
        </div>
        <div className="cl-import-row">
          <label className="cl-btn cl-file-button">
            {busy === 'import' ? t('share.decrypt.importing') : t('share.decrypt.import')}
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.cryptolab,.txt,image/png,image/jpeg,image/webp,text/plain"
              onChange={importPacket}
              disabled={busy !== null}
            />
          </label>
          <span>{t('share.decrypt.importHint')}</span>
        </div>
        <label className="cl-label" htmlFor="share-packet-input">{t('share.packet')}</label>
        <textarea
          id="share-packet-input"
          className="cl-input min-h-[7rem] text-xs"
          value={packet}
          onChange={(event) => setPacket(event.target.value)}
          placeholder={t('share.decrypt.packetPlaceholder')}
          spellCheck={false}
        />
        <div className="cl-field-meta cl-field-meta-end">
          <span>{t('share.decrypt.privateReminder')}</span>
          <button type="button" className="cl-btn cl-btn-primary" onClick={decryptPacket} disabled={busy !== null || !packet || !privateKey}>
            {busy === 'decrypt' ? t('share.decrypt.decrypting') : t('share.decrypt.action')}
          </button>
        </div>
        {decrypted && (
          <div className="cl-decrypted" aria-live="polite">
            <label className="cl-label" htmlFor="share-decrypted-output">{t('share.decrypt.output')}</label>
            <textarea id="share-decrypted-output" className="cl-input min-h-[7rem]" value={decrypted} readOnly />
            <button type="button" className="cl-text-action" onClick={() => copyText(decrypted)}>{t('share.decrypt.copy')}</button>
          </div>
        )}
      </section>

      {(errorKey || statusKey) && (
        <p className={errorKey ? 'cl-error cl-share-status' : 'cl-success cl-share-status'} role={errorKey ? 'alert' : 'status'}>
          {t(errorKey || statusKey)}
        </p>
      )}
    </div>
  )
}
