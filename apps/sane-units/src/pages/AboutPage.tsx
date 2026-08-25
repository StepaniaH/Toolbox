import {
  PageHeader,
  Panel,
} from "../components/ui";
import { useTranslation } from "../lib/i18n";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <section className="page">
      <PageHeader
        title={t("about.title")}
        description={t("about.description")}
      />

      <div className="about-grid">
        <Panel title={t("about.panelWhat.title")} subtitle={t("about.panelWhat.subtitle")}>
          <div className="stacked-copy">
            <p>{t("about.whatP1")}</p>
            <p>{t("about.whatP2")}</p>
            <p>{t("about.whatP3")}</p>
          </div>
        </Panel>

        <Panel title={t("about.panelHow.title")} subtitle={t("about.panelHow.subtitle")}>
          <div className="stacked-copy">
            <p>{t("about.howP1")}</p>
            <p>{t("about.howP2")}</p>
          </div>
        </Panel>

        <Panel title={t("about.panelPrivacy.title")} subtitle={t("about.panelPrivacy.subtitle")}>
          <div className="stacked-copy">
            <p>{t("about.privacyP1")}</p>
            <p>{t("about.privacyP2")}</p>
            <p>{t("about.privacyP3")}</p>
          </div>
        </Panel>
      </div>
    </section>
  );
}
