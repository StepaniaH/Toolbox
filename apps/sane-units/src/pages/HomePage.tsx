import {
  MetricBadge,
} from "../components/ui";
import { useTranslation } from "../lib/i18n";

export function HomePage({ onNavigate }: any) {
  const { t } = useTranslation();
  const cards = t("home.cards");

  return (
    <section className="page page-home">
      <header className="hero-block home-summary">
        <div className="hero-metrics" aria-label={t("home.metricShareable")}>
          <MetricBadge label={t("home.metricPureFrontend")} value={t("home.metricPureFrontendValue")} />
          <MetricBadge label={t("home.metricShareable")} value={t("home.metricShareableValue")} />
          <MetricBadge label={t("home.metricMobile")} value={t("home.metricMobileValue")} />
        </div>
      </header>

      <div className="card-grid">
        {Array.isArray(cards) && cards.map((card) => (
          <button
            key={card.title}
            className="home-card"
            type="button"
            onClick={() => onNavigate(card.path)}
          >
            <div className="home-card-meta">{card.meta}</div>
            <div className="home-card-title">{card.title}</div>
            <div className="home-card-desc">{card.description}</div>
            <div className="home-card-arrow" aria-hidden="true">→</div>
          </button>
        ))}
      </div>

      <aside className="principles-note">
        <p>{t("sidebar.note")}</p>
        <ul>
          <li>{t("sidebar.tbNote")}</li>
          <li>{t("sidebar.mbpsNote")}</li>
          <li>{t("sidebar.wattNote")}</li>
        </ul>
      </aside>
    </section>
  );
}
