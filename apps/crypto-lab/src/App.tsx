import {
  Suspense,
  lazy,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { NavBar } from '@toolbox/nav'
import { useTranslation } from '@toolbox/i18n/react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { EncodingPanel } from '@/components/EncodingPanel'
import '@toolbox/nav/nav-bar.css'

const SharePanel = lazy(() => import('@/components/SharePanel').then((module) => ({ default: module.SharePanel })))
const HashPanel = lazy(() => import('@/components/HashPanel').then((module) => ({ default: module.HashPanel })))
const CipherPanel = lazy(() => import('@/components/CipherPanel').then((module) => ({ default: module.CipherPanel })))
const RsaPanel = lazy(() => import('@/components/RsaPanel').then((module) => ({ default: module.RsaPanel })))
const JwtPanel = lazy(() => import('@/components/JwtPanel').then((module) => ({ default: module.JwtPanel })))
const KnowledgeBase = lazy(() => import('@/components/KnowledgeBase').then((module) => ({ default: module.KnowledgeBase })))
const AboutPanel = lazy(() => import('@/components/AboutPanel').then((module) => ({ default: module.AboutPanel })))

type Tab = 'share' | 'encoding' | 'hash' | 'cipher' | 'rsa' | 'jwt' | 'kb' | 'about'

function App() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<Tab>('encoding')
  const [visitedTabs, setVisitedTabs] = useState<Set<Tab>>(() => new Set(['encoding']))
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'encoding', label: t('nav.encoding') },
    { id: 'share', label: t('nav.share') },
    { id: 'hash', label: t('nav.hash') },
    { id: 'cipher', label: t('nav.cipher') },
    { id: 'rsa', label: t('nav.rsa') },
    { id: 'jwt', label: t('nav.jwt') },
    { id: 'kb', label: t('nav.kb') },
    { id: 'about', label: t('nav.about') },
  ]

  const panels: Record<Tab, ReactNode> = {
    share: <SharePanel />,
    encoding: <EncodingPanel />,
    hash: <HashPanel />,
    cipher: <CipherPanel />,
    rsa: <RsaPanel />,
    jwt: <JwtPanel />,
    kb: <KnowledgeBase />,
    about: <AboutPanel />,
  }

  useEffect(() => {
    document.title = t('meta.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', t('meta.description'))
  }, [t])

  function selectTab(nextTab: Tab, focus = false) {
    setVisitedTabs((current) => {
      if (current.has(nextTab)) return current
      const next = new Set(current)
      next.add(nextTab)
      return next
    })
    if (focus) {
      const nextIndex = tabs.findIndex((item) => item.id === nextTab)
      tabRefs.current[nextIndex]?.focus()
    }
    setTab(nextTab)
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1
    if (nextIndex === undefined) return
    event.preventDefault()
    selectTab(tabs[nextIndex].id, true)
  }

  return (
    <>
      <NavBar currentApp="crypto-lab" />
      <div className="mx-auto max-w-6xl px-4 pb-12">
        <Header />

        <nav className="cl-tabs mb-6" role="tablist" aria-label={t('nav.aria')}>
          {tabs.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => { tabRefs.current[index] = element }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-controls={`panel-${item.id}`}
              aria-selected={tab === item.id}
              tabIndex={tab === item.id ? 0 : -1}
              className="cl-tab"
              onClick={() => selectTab(item.id)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <main>
          {tabs.map((item) => visitedTabs.has(item.id) && (
            <section
              key={item.id}
              id={`panel-${item.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${item.id}`}
              tabIndex={0}
              className="cl-tab-panel"
              hidden={tab !== item.id}
            >
              <Suspense fallback={<p className="cl-loading" role="status">{t('common.loading')}</p>}>
                {panels[item.id]}
              </Suspense>
            </section>
          ))}
        </main>

        <Footer />
      </div>
    </>
  )
}

export default App
