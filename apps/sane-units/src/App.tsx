import React, { useEffect } from "react";
import { NavBar } from "@toolbox/nav";
import { AppIcon } from "@toolbox/nav/AppIcon.tsx";
import { ToolboxFooter } from "@toolbox/nav/ToolboxFooter.tsx";
import "@toolbox/nav/nav-bar.css";
import { useTranslation, LanguageProvider } from "./lib/i18n";
import { normalizeRoute, useAppNavigation, NavLink } from "./lib/router";
import {
  HomePage,
  StoragePage,
  NetworkPage,
  VideoPage,
  PowerPage,
  AboutPage,
} from "./pages";

function App() {
  const [path, navigate] = useAppNavigation();
  const route = normalizeRoute(path);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [route]);

  const { t } = useTranslation();

  useEffect(() => {
    document.title = t(`pageTitles.${route}`) ?? "SaneUnits";
  }, [route, t]);

  const routes = [
    { path: "/", label: t("nav.home") },
    { path: "/storage", label: t("nav.storage") },
    { path: "/network", label: t("nav.network") },
    { path: "/video", label: t("nav.video") },
    { path: "/power", label: t("nav.power") },
    { path: "/about", label: t("nav.about") },
  ];

  return (
    <>
      <NavBar currentApp="sane-units" />
      <div className="app-shell">
        <header className="sane-app-header">
          <div className="brand-lockup">
            <div className="brand-mark toolbox-app-mark" aria-hidden="true">
              <AppIcon appId="sane-units" />
            </div>
            <div>
              <h1 className="brand-name">{t("brand.name")}</h1>
              <p className="brand-subtitle">{t("home.heroLead")}</p>
            </div>
          </div>

          <nav className="section-nav" aria-label={t("nav.home")}>
            {routes.map((item) => (
              <NavLink key={item.path} to={item.path} active={route === item.path} onNavigate={navigate}>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="workspace">
          {route === "/" ? <HomePage onNavigate={navigate} /> : null}
          {route === "/storage" ? <StoragePage /> : null}
          {route === "/network" ? <NetworkPage /> : null}
          {route === "/video" ? <VideoPage /> : null}
          {route === "/power" ? <PowerPage /> : null}
          {route === "/about" ? <AboutPage /> : null}
        </main>

        <ToolboxFooter appId="sane-units" className="sane-footer" />
      </div>
    </>
  );
}

function AppRoot() {
  return React.createElement(
    LanguageProvider,
    null,
    React.createElement(App),
  );
}

export { AppRoot as App };
