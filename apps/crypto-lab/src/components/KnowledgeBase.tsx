import { useTranslation } from '@toolbox/i18n/react'
import { type ReactNode } from 'react'

type KbSection = {
  id: string
  title: string
  body: ReactNode
}

type Lang = 'zh' | 'en'

function useLang(): Lang {
  const { lang } = useTranslation() as { lang: Lang }
  return lang
}

function EncodingSection({ lang }: { lang: Lang }) {
  return {
    zh: (
      <>
        <p>
          <b>编码（Encoding）</b>不是加密，它只是用另一种形式表示同一数据，任何人都可以无损还原。Base64、Hex、URL 编码都属于此类，它们没有密钥，也不提供安全性。
        </p>
        <p>
          <b>哈希（Hashing）</b>是单向的：将任意数据映射为固定长度的摘要，不可逆。它用于校验完整性或签名验证，而非保密。
        </p>
        <p>
          <b>加密（Encryption）</b>用密钥将明文变为密文，只有拥有对应密钥的人才能还原。加密分为对称（同一密钥加解密）和非对称（公钥/私钥对）两类。
        </p>
      </>
    ),
    en: (
      <>
        <p>
          <b>Encoding</b> is not encryption — it simply represents the same data in a different form and is losslessly reversible by anyone. Base64, Hex and URL encoding fall into this category; they have no key and provide no security.
        </p>
        <p>
          <b>Hashing</b> is one-way: it maps arbitrary data to a fixed-length digest that cannot be reversed. It is used for integrity checks and signature verification, not confidentiality.
        </p>
        <p>
          <b>Encryption</b> uses a key to transform plaintext into ciphertext; only someone with the correct key can restore it. Encryption is either symmetric (same key) or asymmetric (public/private key pair).
        </p>
      </>
    ),
  }[lang]
}

function HashCompareSection({ lang }: { lang: Lang }) {
  const rows = lang === 'zh' ? [
    ['MD5', '128 bit', '已被攻破', '仅用于校验/调试，不应用于安全场景'],
    ['SHA-1', '160 bit', '已被攻破', '遗留系统兼容，新项目应避免'],
    ['SHA-256', '256 bit', '安全', 'TLS 证书、区块链等主流场景'],
    ['SHA-512', '512 bit', '安全', '64 位平台性能更优'],
    ['SHA3-256', '256 bit', '安全', 'Keccak 海绵结构，抗长度扩展'],
    ['SHA3-512', '512 bit', '安全', 'NIST 2015 标准化，与 SHA-2 结构不同'],
  ] : [
    ['MD5', '128-bit', 'Broken', 'Legacy checksums only; never for security'],
    ['SHA-1', '160-bit', 'Broken', 'Legacy compat; avoid for new projects'],
    ['SHA-256', '256-bit', 'Secure', 'TLS certs, blockchain, mainstream'],
    ['SHA-512', '512-bit', 'Secure', 'Better on 64-bit platforms'],
    ['SHA3-256', '256-bit', 'Secure', 'Keccak sponge, length-extension resistant'],
    ['SHA3-512', '512-bit', 'Secure', 'NIST 2015; structurally distinct from SHA-2'],
  ]
  return (
    <>
      <div className="cl-kb-body">
        {lang === 'zh' ? (
          <p>哈希算法将任意数据映射为固定长度摘要。好的哈希应具备抗碰撞（难找到两个不同输入产生相同输出）和雪崩效应（输入微小变化导致输出剧烈变化）。</p>
        ) : (
          <p>A hash algorithm maps arbitrary data to a fixed-length digest. A good hash is collision-resistant (hard to find two inputs with the same output) and exhibits the avalanche effect (tiny input change → drastic output change).</p>
        )}
      </div>
      <table className="cl-kb-table">
        <thead>
          <tr>
            <th>{lang === 'zh' ? '算法' : 'Algorithm'}</th>
            <th>{lang === 'zh' ? '输出' : 'Output'}</th>
            <th>{lang === 'zh' ? '安全性' : 'Security'}</th>
            <th>{lang === 'zh' ? '备注' : 'Notes'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <td><code>{r[0]}</code></td>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
              <td>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function HmacSection({ lang }: { lang: Lang }) {
  return {
    zh: (
      <>
        <p>
          <b>HMAC</b>（Hash-based Message Authentication Code）用密钥和哈希函数生成带密钥的摘要。它能同时验证数据的<b>完整性</b>和<b>身份认证</b>：只有知道密钥的人才能生成正确的 HMAC，攻击者即使篡改数据也无法伪造匹配的签名。
        </p>
        <p>
          常见组合：<code>HMAC-SHA256</code> 用于 API 签名、<code>HMAC-SHA512</code> 用于更高安全级别。JWT 的 HS256/HS512 就是 HMAC-SHA256/SHA512。
        </p>
      </>
    ),
    en: (
      <>
        <p>
          <b>HMAC</b> (Hash-based Message Authentication Code) uses a key plus a hash function to produce a keyed digest. It verifies both <b>integrity</b> and <b>authenticity</b>: only someone with the key can produce a valid HMAC, so an attacker cannot tamper with data and forge a matching signature.
        </p>
        <p>
          Common pairings: <code>HMAC-SHA256</code> for API signatures, <code>HMAC-SHA512</code> for higher security. JWT's HS256/HS512 are HMAC-SHA256/SHA512 respectively.
        </p>
      </>
    ),
  }[lang]
}

function SymmetricSection({ lang }: { lang: Lang }) {
  const rows = lang === 'zh' ? [
    ['AES-256-GCM', '认证加密', '推荐', '自带认证标签，可检测篡改；TLS 1.3 使用'],
    ['AES-256-CBC', '经典分组', '兼容', '无内置认证，需配合 HMAC；旧系统兼容'],
    ['ChaCha20', '流密码', '需另加认证', '本工具为裸流密码；新协议应使用 ChaCha20-Poly1305'],
  ] : [
    ['AES-256-GCM', 'AEAD', 'Recommended', 'Built-in auth tag detects tampering; used in TLS 1.3'],
    ['AES-256-CBC', 'Legacy block', 'Compatibility', 'No built-in auth; pair with HMAC; legacy systems'],
    ['ChaCha20', 'Stream cipher', 'Needs authentication', 'This tool exposes the raw stream cipher; use ChaCha20-Poly1305 in new protocols'],
  ]
  return (
    <>
      <div className="cl-kb-body">
        {lang === 'zh' ? (
          <p>对称加密使用<b>同一密钥</b>加密和解密。AES 是 NIST 标准，GCM 模式同时提供加密和认证（AEAD），CBC 仅加密。ChaCha20 是流密码，适合无硬件加速的场景。</p>
        ) : (
          <p>Symmetric encryption uses the <b>same key</b> for encryption and decryption. AES is a NIST standard; GCM mode provides both encryption and authentication (AEAD), while CBC only encrypts. ChaCha20 is a stream cipher ideal for environments without hardware AES acceleration.</p>
        )}
      </div>
      <table className="cl-kb-table">
        <thead>
          <tr>
            <th>{lang === 'zh' ? '算法' : 'Algorithm'}</th>
            <th>{lang === 'zh' ? '类型' : 'Type'}</th>
            <th>{lang === 'zh' ? '推荐度' : 'Recommendation'}</th>
            <th>{lang === 'zh' ? '备注' : 'Notes'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <td><code>{r[0]}</code></td>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
              <td>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function RsaSection({ lang }: { lang: Lang }) {
  return {
    zh: (
      <>
        <p>
          <b>RSA</b>是非对称加密：公钥加密/验签，私钥解密/签名。密钥越长越安全，但生成和运算越慢。
        </p>
        <p>
          <b>RSA-OAEP</b>用于加解密，引入随机填充使同一明文每次密文不同。<b>RSA-PSS</b>用于签名，同样引入随机化。两者算法不同，<b>不能共用同一密钥对</b>。
        </p>
        <p>
          1024 位已不推荐用于新系统；2048 位是当前最低安全基线；4096 位提供更高余量但性能更低。
        </p>
      </>
    ),
    en: (
      <>
        <p>
          <b>RSA</b> is asymmetric: the public key encrypts/verifies, the private key decrypts/signs. Longer keys are more secure but slower to generate and operate.
        </p>
        <p>
          <b>RSA-OAEP</b> is for encryption/decryption with randomized padding (same plaintext → different ciphertext each time). <b>RSA-PSS</b> is for signing with randomization. The algorithms differ, so <b>the same key pair cannot be used for both</b>.
        </p>
        <p>
          1024-bit is deprecated for new systems; 2048-bit is the current minimum; 4096-bit provides extra margin at lower performance.
        </p>
      </>
    ),
  }[lang]
}

function JwtSection({ lang }: { lang: Lang }) {
  return {
    zh: (
      <>
        <p>
          <b>JWT</b>（JSON Web Token）由三部分组成：<code>Header.Payload.Signature</code>，用点号连接。Header 声明算法和类型，Payload 携带声明（claims），Signature 是对前两部分的签名。
        </p>
        <p>
          <b>注意</b>：JWT 的 Payload 是 Base64Url 编码而非加密，任何人都能解码读取。签名只保证<b>未被篡改</b>，不保证保密。如果需要保密，应在外层加密。
        </p>
        <p>
          <code>HS256</code>使用 HMAC-SHA256 + 共享密钥；<code>HS512</code>使用 HMAC-SHA512。验证签名时必须检查 Header 中的 <code>alg</code> 字段，避免算法混淆攻击。
        </p>
      </>
    ),
    en: (
      <>
        <p>
          <b>JWT</b> (JSON Web Token) has three parts: <code>Header.Payload.Signature</code>, joined by dots. The Header declares the algorithm and type, the Payload carries claims, and the Signature covers the first two parts.
        </p>
        <p>
          <b>Important</b>: the Payload is Base64Url-encoded, not encrypted — anyone can decode and read it. The signature guarantees <b>integrity</b>, not confidentiality. For confidentiality, encrypt at an outer layer.
        </p>
        <p>
          <code>HS256</code> uses HMAC-SHA256 with a shared secret; <code>HS512</code> uses HMAC-SHA512. Always verify the <code>alg</code> field in the Header to prevent algorithm-confusion attacks.
        </p>
      </>
    ),
  }[lang]
}

function BaseEncodingSection({ lang }: { lang: Lang }) {
  const rows = lang === 'zh' ? [
    ['Base64', 'A-Za-z0-9+/', '最通用', 'URL 中 +/ 需编码，用 Base64URL 替代'],
    ['Base64URL', 'A-Za-z0-9-_', 'URL 安全', '去掉填充，适合 URL/文件名'],
    ['Base32', 'A-Z2-7', '不区分大小写友好', '编码率低于 Base64，适合手抄/二维码'],
    ['Base58', '去除易混字符', '区块链常用', '去 0/O/l/I，避免视觉混淆'],
    ['Hex', '0-9a-f', '最可读', '每字节 2 字符，体积翻倍但人类可辨'],
  ] : [
    ['Base64', 'A-Za-z0-9+/', 'Most common', '+/ need encoding in URLs; use Base64URL'],
    ['Base64URL', 'A-Za-z0-9-_', 'URL-safe', 'No padding; ideal for URLs/filenames'],
    ['Base32', 'A-Z2-7', 'Case-insensitive friendly', 'Lower density than Base64; good for manual entry'],
    ['Base58', 'No ambiguous chars', 'Blockchain standard', 'Drops 0/O/l/I to avoid visual confusion'],
    ['Hex', '0-9a-f', 'Most readable', '2 chars per byte; doubles size but human-legible'],
  ]
  return (
    <>
      <table className="cl-kb-table">
        <thead>
          <tr>
            <th>{lang === 'zh' ? '编码' : 'Encoding'}</th>
            <th>{lang === 'zh' ? '字符集' : 'Alphabet'}</th>
            <th>{lang === 'zh' ? '特点' : 'Trait'}</th>
            <th>{lang === 'zh' ? '备注' : 'Notes'}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <td><code>{r[0]}</code></td>
              <td>{r[1]}</td>
              <td>{r[2]}</td>
              <td>{r[3]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export function KnowledgeBase() {
  const lang = useLang()
  const { t } = useTranslation()

  const sections: KbSection[] = [
    { id: 'concept', title: t('kb.concept'), body: <EncodingSection lang={lang} /> },
    { id: 'hash', title: t('kb.hash'), body: <HashCompareSection lang={lang} /> },
    { id: 'hmac', title: t('kb.hmac'), body: <HmacSection lang={lang} /> },
    { id: 'symmetric', title: t('kb.symmetric'), body: <SymmetricSection lang={lang} /> },
    { id: 'rsa', title: t('kb.rsa'), body: <RsaSection lang={lang} /> },
    { id: 'jwt', title: t('kb.jwt'), body: <JwtSection lang={lang} /> },
    { id: 'base', title: t('kb.base'), body: <BaseEncodingSection lang={lang} /> },
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
