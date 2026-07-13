import { useState } from 'react'
import { useTranslation } from '@toolbox/i18n/react'
import { ActionBar } from './ActionBar'
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
    const bytes = crypto.getRandomValues(new Uint8Array(length))
    return bytesToHex(bytes)
  }

  function keyLength(): number {
    return algo === 'aesCbc' || algo === 'aesGcm' ? 32 : 32
  }

  function ivLength(): number {
    return algo === 'aesCbc' ? 16 : 12
  }

  async function encrypt() {
    setError('')
    try {
      let result = ''
      if (algo === 'aesGcm') {
        result = await aesGcmEncrypt(input, key, iv)
      } else if (algo === 'aesCbc') {
        result = await aesCbcEncrypt(input, key, iv)
      } else {
        result = chacha20Encrypt(input, key, iv)
      }
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
      if (algo === 'aesGcm') {
        result = await aesGcmDecrypt(input, key, iv)
      } else if (algo === 'aesCbc') {
        result = await aesCbcDecrypt(input, key, iv)
      } else {
        result = chacha20Decrypt(input, key, iv)
      }
      setOutput(result)
    } catch (err) {
      setOutput('')
      setError(err instanceof Error ? err.message : t('cipher.decryptFailed'))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="tool-label">{t('cipher.algorithm')}</label>
        <select
          className="tool-select"
          value={algo}
          onChange={(e) => {
            setAlgo(e.target.value as CipherAlgo)
            setOutput('')
            setError('')
          }}
          aria-label={t('cipher.algorithm')}
        >
          <option value="aesGcm">{t('cipher.aesGcm')}</option>
          <option value="aesCbc">{t('cipher.aesCbc')}</option>
          <option value="chacha20">{t('cipher.chacha20')}</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="tool-label">{t('cipher.key')}</label>
        <input
          type="text"
          className="tool-input w-auto min-w-[20rem] font-mono"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={t('cipher.keyPlaceholder')}
          aria-label={t('cipher.key')}
        />
        <button
          type="button"
          className="tool-btn tool-btn-ghost"
          onClick={() => setKey(randomHex(keyLength()))}
        >
          {t('common.generate')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="tool-label">{t('cipher.iv')}</label>
        <input
          type="text"
          className="tool-input w-auto min-w-[16rem] font-mono"
          value={iv}
          onChange={(e) => setIv(e.target.value)}
          placeholder={t('cipher.ivPlaceholder')}
          aria-label={t('cipher.iv')}
        />
        <button
          type="button"
          className="tool-btn tool-btn-ghost"
          onClick={() => setIv(randomHex(ivLength()))}
        >
          {t('common.generate')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <label className="tool-label">{t('common.input')}</label>
          <textarea
            className="tool-input min-h-[10rem]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('cipher.inputPlaceholder')}
            aria-label={t('common.input')}
          />
        </div>
        <div className="space-y-2">
          <label className="tool-label">{t('common.output')}</label>
          <textarea
            className={`tool-input min-h-[10rem] ${error ? 'border-destructive' : ''}`}
            value={error || output}
            readOnly
            aria-label={t('common.output')}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="tool-btn tool-btn-primary" onClick={encrypt}>
          {t('common.encrypt')}
        </button>
        <button type="button" className="tool-btn tool-btn-primary" onClick={decrypt}>
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
