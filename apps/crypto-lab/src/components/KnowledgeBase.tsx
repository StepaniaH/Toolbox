import { useTranslation } from '@toolbox/i18n/react'
import { type ReactNode } from 'react'

type KbSection = {
  id: string
  title: string
  body: ReactNode
}

const HASH_ROWS: Array<{ id: string; name: string }> = [
  { id: 'md5', name: 'MD5' },
  { id: 'sha1', name: 'SHA-1' },
  { id: 'sha256', name: 'SHA-256' },
  { id: 'sha512', name: 'SHA-512' },
  { id: 'sha3_256', name: 'SHA3-256' },
  { id: 'sha3_512', name: 'SHA3-512' },
]

const SYMMETRIC_ROWS: Array<{ id: string; name: string }> = [
  { id: 'aesGcm', name: 'AES-256-GCM' },
  { id: 'aesCbc', name: 'AES-256-CBC' },
  { id: 'chacha20', name: 'ChaCha20' },
]

const BASE_ROWS: Array<{ id: string; name: string; alphabet: string }> = [
  { id: 'base64', name: 'Base64', alphabet: 'A-Za-z0-9+/' },
  { id: 'base64url', name: 'Base64URL', alphabet: 'A-Za-z0-9-_' },
  { id: 'base32', name: 'Base32', alphabet: 'A-Z2-7' },
  { id: 'base58', name: 'Base58', alphabet: '' },
  { id: 'hex', name: 'Hex', alphabet: '0-9a-f' },
]

function EncodingSection() {
  const { t } = useTranslation()
  return (
    <>
      <p>
        <b>{t('kbContent.encoding.encodingTerm')}</b>
        {t('kbContent.encoding.encodingBody')}
      </p>
      <p>
        <b>{t('kbContent.encoding.hashingTerm')}</b>
        {t('kbContent.encoding.hashingBody')}
      </p>
      <p>
        <b>{t('kbContent.encoding.encryptionTerm')}</b>
        {t('kbContent.encoding.encryptionBody')}
      </p>
    </>
  )
}

function HashCompareSection() {
  const { t } = useTranslation()
  return (
    <>
      <div className="cl-kb-body">
        <p>{t('kbContent.hash.intro')}</p>
      </div>
      <table className="cl-kb-table">
        <thead>
          <tr>
            <th>{t('kbContent.columns.algorithm')}</th>
            <th>{t('kbContent.columns.output')}</th>
            <th>{t('kbContent.columns.security')}</th>
            <th>{t('kbContent.columns.notes')}</th>
          </tr>
        </thead>
        <tbody>
          {HASH_ROWS.map(({ id, name }) => (
            <tr key={id}>
              <td><code>{name}</code></td>
              <td>{t(`kbContent.hash.rows.${id}.output`)}</td>
              <td>{t(`kbContent.hash.rows.${id}.security`)}</td>
              <td>{t(`kbContent.hash.rows.${id}.notes`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function HmacSection() {
  const { t } = useTranslation()
  return (
    <>
      <p>
        <b>{t('kbContent.hmac.hmacTerm')}</b>
        {t('kbContent.hmac.hmacBodyA')}
        <b>{t('kbContent.hmac.integrityTerm')}</b>
        {t('kbContent.hmac.hmacBodyB')}
        <b>{t('kbContent.hmac.authenticityTerm')}</b>
        {t('kbContent.hmac.hmacBodyC')}
      </p>
      <p>
        {t('kbContent.hmac.pairingsA')}
        <code>HMAC-SHA256</code>
        {t('kbContent.hmac.pairingsB')}
        <code>HMAC-SHA512</code>
        {t('kbContent.hmac.pairingsC')}
      </p>
    </>
  )
}

function SymmetricSection() {
  const { t } = useTranslation()
  return (
    <>
      <div className="cl-kb-body">
        <p>
          {t('kbContent.symmetric.introA')}
          <b>{t('kbContent.symmetric.sameKeyTerm')}</b>
          {t('kbContent.symmetric.introB')}
        </p>
      </div>
      <table className="cl-kb-table">
        <thead>
          <tr>
            <th>{t('kbContent.columns.algorithm')}</th>
            <th>{t('kbContent.columns.type')}</th>
            <th>{t('kbContent.columns.recommendation')}</th>
            <th>{t('kbContent.columns.notes')}</th>
          </tr>
        </thead>
        <tbody>
          {SYMMETRIC_ROWS.map(({ id, name }) => (
            <tr key={id}>
              <td><code>{name}</code></td>
              <td>{t(`kbContent.symmetric.rows.${id}.type`)}</td>
              <td>{t(`kbContent.symmetric.rows.${id}.recommendation`)}</td>
              <td>{t(`kbContent.symmetric.rows.${id}.notes`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function RsaSection() {
  const { t } = useTranslation()
  return (
    <>
      <p>
        <b>{t('kbContent.rsa.rsaTerm')}</b>
        {t('kbContent.rsa.rsaBody')}
      </p>
      <p>
        <b>{t('kbContent.rsa.oaepTerm')}</b>
        {t('kbContent.rsa.oaepBody')}
        <b>{t('kbContent.rsa.pssTerm')}</b>
        {t('kbContent.rsa.pssBody')}
        <b>{t('kbContent.rsa.pairWarnTerm')}</b>
        {t('kbContent.rsa.pairWarnBody')}
      </p>
      <p>{t('kbContent.rsa.keyLengths')}</p>
    </>
  )
}

function JwtSection() {
  const { t } = useTranslation()
  return (
    <>
      <p>
        <b>{t('kbContent.jwt.jwtTerm')}</b>
        {t('kbContent.jwt.jwtBodyA')}
        <code>Header.Payload.Signature</code>
        {t('kbContent.jwt.jwtBodyB')}
      </p>
      <p>
        <b>{t('kbContent.jwt.noteTerm')}</b>
        {t('kbContent.jwt.noteBodyA')}
        <b>{t('kbContent.jwt.integrityTerm')}</b>
        {t('kbContent.jwt.noteBodyB')}
      </p>
      <p>
        <code>HS256</code>
        {t('kbContent.jwt.hs256Body')}
        <code>HS512</code>
        {t('kbContent.jwt.hs512BodyA')}
        <code>alg</code>
        {t('kbContent.jwt.hs512BodyB')}
      </p>
    </>
  )
}

function BaseEncodingSection() {
  const { t } = useTranslation()
  return (
    <>
      <table className="cl-kb-table">
        <thead>
          <tr>
            <th>{t('kbContent.columns.encoding')}</th>
            <th>{t('kbContent.columns.alphabet')}</th>
            <th>{t('kbContent.columns.trait')}</th>
            <th>{t('kbContent.columns.notes')}</th>
          </tr>
        </thead>
        <tbody>
          {BASE_ROWS.map(({ id, name, alphabet }) => (
            <tr key={id}>
              <td><code>{name}</code></td>
              <td>{alphabet ? <code>{alphabet}</code> : t(`kbContent.base.rows.${id}.alphabet`)}</td>
              <td>{t(`kbContent.base.rows.${id}.trait`)}</td>
              <td>{t(`kbContent.base.rows.${id}.notes`)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export function KnowledgeBase() {
  const { t } = useTranslation()

  const sections: KbSection[] = [
    { id: 'concept', title: t('kb.concept'), body: <EncodingSection /> },
    { id: 'hash', title: t('kb.hash'), body: <HashCompareSection /> },
    { id: 'hmac', title: t('kb.hmac'), body: <HmacSection /> },
    { id: 'symmetric', title: t('kb.symmetric'), body: <SymmetricSection /> },
    { id: 'rsa', title: t('kb.rsa'), body: <RsaSection /> },
    { id: 'jwt', title: t('kb.jwt'), body: <JwtSection /> },
    { id: 'base', title: t('kb.base'), body: <BaseEncodingSection /> },
  ]

  return (
    <div className="divide-y divide-line">
      {sections.map((s) => (
        <section key={s.id} className="cl-kb-section">
          <h3 className="cl-kb-title">{s.title}</h3>
          <div className="cl-kb-body">{s.body}</div>
        </section>
      ))}
    </div>
  )
}
