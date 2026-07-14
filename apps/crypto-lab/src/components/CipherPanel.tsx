import { useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
import { Dropdown } from './Dropdown'
import { Tooltip } from './Tooltip'
import {
  aesGcmEncrypt,
  aesGcmDecrypt,
  aesCbcEncrypt,
  aesCbcDecrypt,
  chacha20Encrypt,
  chacha20Decrypt,
} from '@/lib/cipher'
import { bytesToHex } from '@/lib/utils'

type CipherAlgo = 'aesGcm' | 'aesCbc' | 'chacha20'

export function CipherPanel() {
  const { t } = useTranslation()
  const [algo, setAlgo] = useState<CipherAlgo>('aesGcm')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [key, setKey] = useState('')
  const [iv, setIv] = useState('')

  function randomHex(length: number): string {
    return bytesToHex(crypto.getRandomValues(new Uint8Array(length)))
  }

  const ivLength = algo === 'aesCbc' ? 16 : 12

  async function encrypt() {
    setError('')
    try {
      let result = ''
      if (algo === 'aesGcm') result = await aesGcmEncrypt(input, key, iv)
      else if (algo === 'aesCbc') result = await aesCbcEncrypt(input, key, iv)
      else result = chacha20Encrypt(input, key, iv)
      setOutput(result)
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('cipher.encryptFailed'))
    }
  }

  async function decrypt() {
    setError('')
    try {
      let result = ''
      if (algo === 'aesGcm') result = await aesGcmDecrypt(input, key, iv)
      else if (algo === 'aesCbc') result = await aesCbcDecrypt(input, key, iv)
      else result = chacha20Decrypt(input, key, iv)
      setOutput(result)
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('cipher.decryptFailed'))
    }
  }

  const algoOptions = [
    { value: 'aesGcm', label: 'AES-256-GCM' },
    { value: 'aesCbc', label: 'AES-256-CBC' },
    { value: 'chacha20', label: 'ChaCha20' },
  ]

  const algoTipKey: Record<CipherAlgo, string> = {
    aesGcm: 'tip.aesGcm',
    aesCbc: 'tip.aesCbc',
    chacha20: 'tip.chacha20',
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dropdown
          value={algo}
          options={algoOptions}
          onChange={(v) => {
            setAlgo(v as CipherAlgo)
            setOutput('')
            setError('')
          }}
          ariaLabel={t('cipher.algorithm')}
        />
        <Tooltip text={t(algoTipKey[algo])} />
      </div>

      <p className="cl-security-note">{t(`cipher.notice.${algo}`)}</p>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="cl-label">
            {t('cipher.key')}
            <span className="cl-hint ml-1">32 bytes · hex</span>
          </label>
          <button
            type="button"
            className="cl-icon-btn"
            onClick={() => setKey(randomHex(32))}
            title={t('common.generate')}
            aria-label={t('common.generate')}
          >
            <span className="text-xs">{t('common.generate')}</span>
          </button>
        </div>
        <input
          type="text"
          className="cl-text w-full"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t('cipher.keyPlaceholder')}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label className="cl-label">
            {t('cipher.iv')}
            <span className="cl-hint ml-1">{ivLength} bytes · hex</span>
          </label>
          <button
            type="button"
            className="cl-icon-btn"
            onClick={() => setIv(randomHex(ivLength))}
            title={t('common.generate')}
            aria-label={t('common.generate')}
          >
            <span className="text-xs">{t('common.generate')}</span>
          </button>
        </div>
        <input
          type="text"
          className="cl-text w-full"
          value={iv}
          onChange={(e) => setIv(e.target.value)}
          placeholder={t('cipher.ivPlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <label className="cl-label">{t('common.input')}</label>
          <textarea
            className="cl-input min-h-[10rem]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('cipher.inputPlaceholder')}
          />
        </div>
        <div>
          <label className="cl-label">
            {t('common.output')}
            {error && <span className="cl-error ml-2">{error}</span>}
          </label>
          <textarea
            className={`cl-input min-h-[10rem] ${error ? 'border-red' : ''}`}
            value={output}
            readOnly
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" className="cl-btn cl-btn-primary" onClick={encrypt}>
          {t('common.encrypt')}
        </button>
        <button type="button" className="cl-btn cl-btn-primary" onClick={decrypt}>
          {t('common.decrypt')}
        </button>
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
