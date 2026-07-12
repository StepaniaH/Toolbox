/* ==========================================================================
   main.js — Tool card data & rendering
   ========================================================================== */

import "./platform.js";
import { getLang, setLang, toggleLang } from "./i18n.js";
import { getStableApps } from "@toolbox/app-manifest";
import { autoMountToolboxFooters } from "@toolbox/nav/toolbox-footer.js";

const CARD_PRESENTATION = {
  "rate-lens": {
    id: "ratelens",
    titleKey: "card.ratelens.title",
    subtitleKey: "card.ratelens.subtitle",
    descKey: "card.ratelens.desc",
    badges: ["React", "TypeScript", "Vite", "Tailwind"],
  },
  "chrono-sphere": {
    id: "chrono",
    titleKey: "card.chrono.title",
    subtitleKey: "card.chrono.subtitle",
    descKey: "card.chrono.desc",
    badges: ["React", "TypeScript", "Vite"],
  },
  "monitor-choice": {
    id: "monitor",
    titleKey: "card.monitor.title",
    subtitleKey: "card.monitor.subtitle",
    descKey: "card.monitor.desc",
    badges: ["Vanilla JS", "Canvas 2D"],
  },
  "sane-units": {
    id: "sane",
    titleKey: "card.sane.title",
    subtitleKey: "card.sane.subtitle",
    descKey: "card.sane.desc",
    badges: ["React", "Vite"],
  },
};

const tools = getStableApps()
  .filter((app) => app.path !== "/")
  .map((app) => {
    const presentation = CARD_PRESENTATION[app.id];
    if (!presentation) {
      throw new Error(`Missing Homepage card presentation for ${app.id}`);
    }
    return { ...presentation, url: app.path, icon: app.icon };
  });

/* ---- CTA arrow SVG ---- */
const ARROW_SVG =
  '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
  '<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
  '</svg>';

/* ---- Render a single card ---- */
function renderCard(tool) {
  const article = document.createElement("article");
  article.className = "tool-card";

  article.innerHTML =
    '<svg class="card-icon toolbox-app-icon" viewBox="' + tool.icon.viewBox + '" aria-hidden="true">' +
    tool.icon.svg +
    '</svg>' +
    '<h2 class="card-title" data-i18n="' + tool.titleKey + '"></h2>' +
    '<p class="card-subtitle" data-i18n="' + tool.subtitleKey + '"></p>' +
    '<p class="card-desc" data-i18n="' + tool.descKey + '"></p>' +
    '<div class="card-badges">' +
    tool.badges.map(function (b) { return '<span class="card-badge">' + b + '</span>'; }).join("") +
    '</div>' +
    '<a class="card-cta" href="' + tool.url + '">' +
    '<span data-i18n="card.cta"></span>' + ARROW_SVG +
    '</a>';

  return article;
}

/* ---- Init ---- */
document.addEventListener("DOMContentLoaded", function () {
  var grid = document.getElementById("tools-grid");
  tools.forEach(function (tool) {
    grid.appendChild(renderCard(tool));
  });
  autoMountToolboxFooters();

  // i18n
  setLang(getLang());
  var langToggle = document.getElementById("langToggle");
  if (langToggle) langToggle.addEventListener("click", toggleLang);

  // Theme — #themeToggle is wired by js/theme.js (delegates to window.ToolboxTheme).
});
