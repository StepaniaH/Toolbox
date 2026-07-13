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
import { KnowledgeBase } from '@/components/KnowledgeBase'
import '@toolbox/nav/nav-bar.css'

type Tab = 'encoding' | 'hash' | 'cipher' | 'rsa' | 'jwt' | 'kb'

function App() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('encoding')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'encoding', label: t('nav.encoding') },
    { id: 'hash', label: t('nav.hash') },
    { id: 'cipher', label: t('nav.cipher') },
    { id: 'rsa', label: t('nav.rsa') },
    { id: 'jwt', label: t('nav.jwt') },
    { id: 'kb', label: t('nav.kb') },
  ]

  const panels: Record<Tab, ReactNode> = {
    encoding: <EncodingPanel />,
    hash: <HashPanel />,
    cipher: <CipherPanel />,
    rsa: <RsaPanel />,
    jwt: <JwtPanel />,
    kb: <KnowledgeBase />,
  }

  return (
    <>
      <NavBar currentApp="crypto-lab" />
      <div className="mx-auto max-w-4xl px-4 pb-12">
        <Header />

        <nav className="cl-tabs mb-6" role="tablist" aria-label={t('nav.aria')}>
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className="cl-tab"
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div aria-live="polite">{panels[tab]}</div>

        <Footer />
      </div>
    </>
  )
}

export default App
