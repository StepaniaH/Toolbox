import { useState, type ReactNode } from 'react'
import { NavBar } from '@toolbox/nav'
import { useTranslation } from '@toolbox/i18n/react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { EncodingPanel } from '@/components/EncodingPanel'
import { HashPanel } from '@/components/HashPanel'
import { CipherPanel } from '@/components/CipherPanel'
import { RsaPanel } from '@/components/RsaPanel'
import { JwtPanel } from '@/components/JwtPanel'
import '@toolbox/nav/nav-bar.css'

type Tab = 'encoding' | 'hash' | 'cipher' | 'rsa' | 'jwt'

function App() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('encoding')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'encoding', label: t('nav.encoding') },
    { id: 'hash', label: t('nav.hash') },
    { id: 'cipher', label: t('nav.cipher') },
    { id: 'rsa', label: t('nav.rsa') },
    { id: 'jwt', label: t('nav.jwt') },
  ]

  const panels: Record<Tab, ReactNode> = {
    encoding: <EncodingPanel />,
    hash: <HashPanel />,
    cipher: <CipherPanel />,
    rsa: <RsaPanel />,
    jwt: <JwtPanel />,
  }

  return (
    <>
      <NavBar currentApp="crypto-lab" />
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <Header />

        <div
          className="mb-6 flex flex-wrap gap-2"
          role="tablist"
          aria-label={t('nav.aria')}
        >
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`tool-btn ${tab === item.id ? 'tool-btn-primary' : 'tool-btn-ghost'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className="tool-section" aria-live="polite">
          {panels[tab]}
        </section>

        <Footer />
      </div>
    </>
  )
}

export default App
