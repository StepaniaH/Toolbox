/* ==========================================================================
   main.js — Tool card data & rendering
   ========================================================================== */

import "./platform.js";
import { getLang, setLang, toggleLang } from "./i18n.js";
import { getStableApps } from "@toolbox/app-manifest";

const CARD_PRESENTATION = {
  "rate-lens": {
    id: "ratelens",
    titleKey: "card.ratelens.title",
    subtitleKey: "card.ratelens.subtitle",
    descKey: "card.ratelens.desc",
    badges: ["React", "TypeScript", "Vite", "Tailwind"],
    svgPath: '<rect x="8" y="8" width="32" height="32" rx="6" stroke="currentColor" stroke-width="2" fill="none"/>' + '<circle cx="24" cy="20" r="7" stroke="currentColor" stroke-width="2" fill="none"/>' + '<line x1="24" y1="12" x2="24" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' + '<circle cx="22" cy="19" r="1.5" fill="currentColor" opacity="0.6"/>'
  },
  "chrono-sphere": {
    id: "chrono",
    titleKey: "card.chrono.title",
    subtitleKey: "card.chrono.subtitle",
    descKey: "card.chrono.desc",
    badges: ["React", "TypeScript", "Vite"],
    svgPath: '<circle cx="24" cy="24" r="19" stroke="currentColor" stroke-width="2" fill="none"/>' +
      '<circle cx="24" cy="24" r="2" fill="currentColor"/>' +
      '<line x1="24" y1="24" x2="24" y2="11" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
      '<line x1="24" y1="24" x2="31" y2="18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>' +
      '<path d="M38 24a14 14 0 1 1-28 0 14 14 0 0 1 28 0z" stroke="currentColor" stroke-width="1" fill="none" opacity="0.25"/>',
  },
  "monitor-choice": {
    id: "monitor",
    titleKey: "card.monitor.title",
    subtitleKey: "card.monitor.subtitle",
    descKey: "card.monitor.desc",
    badges: ["Vanilla JS", "Canvas 2D"],
    svgPath: '<rect x="8" y="8" width="32" height="22" rx="3" stroke="currentColor" stroke-width="2" fill="none"/>' +
      '<line x1="20" y1="34" x2="28" y2="34" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<line x1="24" y1="30" x2="24" y2="36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>' +
      '<rect x="16" y="12" width="16" height="12" rx="1" stroke="currentColor" stroke-width="1" fill="none" opacity="0.4"/>',
  },
  "sane-units": {
    id: "sane",
    titleKey: "card.sane.title",
    subtitleKey: "card.sane.subtitle",
    descKey: "card.sane.desc",
    badges: ["React", "Vite"],
    svgPath: '<path d="M8 40h32" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="14" y1="40" x2="14" y2="14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="24" y1="40" x2="24" y2="8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="34" y1="40" x2="34" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="14" cy="11" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>' +
      '<circle cx="24" cy="5" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>' +
      '<circle cx="34" cy="19" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  },
};

const tools = getStableApps()
  .filter((app) => app.path !== "/")
  .map((app) => {
    const presentation = CARD_PRESENTATION[app.id];
    if (!presentation) {
      throw new Error(`Missing Homepage card presentation for ${app.id}`);
    }
    return { ...presentation, url: app.path };
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
    '<svg class="card-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">' +
    tool.svgPath +
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

  // i18n
  setLang(getLang());
  var langToggle = document.getElementById("langToggle");
  if (langToggle) langToggle.addEventListener("click", toggleLang);

  // Theme — #themeToggle is wired by js/theme.js (delegates to window.ToolboxTheme).
});
