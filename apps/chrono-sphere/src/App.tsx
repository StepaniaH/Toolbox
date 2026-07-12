import { lazy, Suspense, useEffect, useState } from 'react';
import { RefreshCw, Layers, Sparkles, ShieldCheck } from 'lucide-react';
import { NavBar } from '@toolbox/nav';
import { AppIcon } from '@toolbox/nav/AppIcon.tsx';
import { ToolboxFooter } from '@toolbox/nav/ToolboxFooter.tsx';
import { useTranslation } from '@toolbox/i18n/react';
import { usePreferences } from './context/usePreferences';
import '@toolbox/nav/nav-bar.css';
import './App.css';

const OffsetCalculator = lazy(() =>
  import('./components/OffsetCalculator').then(m => ({ default: m.OffsetCalculator })),
);
const IntervalCalculator = lazy(() =>
  import('./components/IntervalCalculator').then(m => ({ default: m.IntervalCalculator })),
);
const LunarCalculator = lazy(() =>
  import('./components/LunarCalculator').then(m => ({ default: m.LunarCalculator })),
);

function CalculatorFallback() {
  return (
    <div className="calculator-fallback" role="status" aria-live="polite">
      <span className="calculator-fallback-spinner" aria-hidden="true" />
      <span className="calculator-fallback-text">Loading...</span>
    </div>
  );
}

function App() {
  const { lang, t } = useTranslation();
  const { toggleTheme } = usePreferences();
  const [activeTab, setActiveTab] = useState<'offset' | 'interval' | 'lunar'>('offset');

  useEffect(() => {
    document.title =
      lang === 'zh'
        ? 'ChronoSphere - 高精度日期计算与时区夏令时审计服务'
        : 'ChronoSphere - Precision date, timezone, and DST calculator';

    const description =
      lang === 'zh'
        ? 'ChronoSphere 是一款支持时区感知与夏令时变更审计的日期计算工具，支持日期偏移、日期区间、农历转换，且全部计算在浏览器本地完成。'
        : 'ChronoSphere is a local-first date calculator with timezone and DST auditing, supporting offsets, intervals, and lunar calendar conversion.';

    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (meta) {
      meta.content = description;
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    }
  }, [lang]);

  return (
    <>
      <NavBar currentApp="chrono-sphere" onToggleTheme={toggleTheme} />
      <div className="app-container">
      <header className="app-header">
        <div className="app-header-row">
          <div className="logo-container">
            <span className="logo-mark">
              <AppIcon appId="chrono-sphere" className="logo-icon" />
            </span>
            <h1 className="app-title">ChronoSphere</h1>
          </div>
        </div>
        <p className="app-subtitle">{t('app.subtitle')}</p>
      </header>

      <div className="tabs-container" role="tablist" aria-label={t('tabs.label') || 'Calculator tabs'}>
        <button
          role="tab"
          aria-selected={activeTab === 'offset'}
          className={`tab-btn ${activeTab === 'offset' ? 'active' : ''}`}
          onClick={() => setActiveTab('offset')}
        >
          <RefreshCw size={16} />
          {t('tabs.offset')}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'interval'}
          className={`tab-btn ${activeTab === 'interval' ? 'active' : ''}`}
          onClick={() => setActiveTab('interval')}
        >
          <Layers size={16} />
          {t('tabs.interval')}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'lunar'}
          className={`tab-btn ${activeTab === 'lunar' ? 'active' : ''}`}
          onClick={() => setActiveTab('lunar')}
        >
          <Sparkles size={16} />
          {t('tabs.lunar')}
        </button>
      </div>

      <main className="main-card">
        <Suspense fallback={<CalculatorFallback />}>
          {activeTab === 'offset' && <OffsetCalculator />}
          {activeTab === 'interval' && <IntervalCalculator />}
          {activeTab === 'lunar' && <LunarCalculator />}
        </Suspense>
      </main>

      <section className="privacy-note" aria-label={t('privacy.label')}>
        <ShieldCheck className="privacy-note-icon" size={18} />
        <span>
          <strong>{t('privacy.label')}</strong>
          {` · ${t('privacy.body')}`}
        </span>
      </section>

      <ToolboxFooter appId="chrono-sphere" />
    </div>
    </>
  );
}

export default App;
