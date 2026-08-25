/* ==========================================================================
   main.js — Tool card rendering from the canonical manifest
   ========================================================================== */

import "./platform.js";
import { getLang, setLang, toggleLang, registerCardStrings } from "./i18n.js";
import { getStableApps } from "@toolbox/app-manifest";
import { applyHomepagePrefs, readHomepagePrefs } from "@toolbox/prefs";
import { autoMountToolboxFooters } from "@toolbox/nav/toolbox-footer.js";

const tools = getStableApps()
  .filter((app) => app.path !== "/" && app.presentation?.card !== false)
  .map((app) => ({
    id: app.id,
    name: app.name,
    presentation: app.presentation,
    url: app.path,
    icon: app.icon,
  }));

registerCardStrings(tools);

const visibleTools = applyHomepagePrefs(
  tools,
  readHomepagePrefs(tools.map((tool) => tool.id)),
);

/* ---- CTA arrow SVG ---- */
const ARROW_SVG =
  '<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
  '<path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' +
  '</svg>';

/* ---- Render a single card ---- */
function renderCard(tool) {
  const article = document.createElement("article");
  article.className = "tool-card";

  const title = tool.presentation?.title
    ? '<h2 class="card-title" data-i18n="card.' + tool.id + '.title"></h2>'
    : '<h2 class="card-title">' + tool.name + '</h2>';

  article.innerHTML =
    '<svg class="card-icon toolbox-app-icon" viewBox="' + tool.icon.viewBox + '" aria-hidden="true">' +
    tool.icon.svg +
    '</svg>' +
    title +
    '<p class="card-subtitle" data-i18n="card.' + tool.id + '.subtitle"></p>' +
    '<p class="card-desc" data-i18n="card.' + tool.id + '.desc"></p>' +
    '<div class="card-badges">' +
    (tool.presentation?.badges ?? [])
      .map(function (b) { return '<span class="card-badge">' + b + '</span>'; })
      .join("") +
    '</div>' +
    '<a class="card-cta" href="' + tool.url + '">' +
    '<span data-i18n="card.cta"></span>' + ARROW_SVG +
    '</a>';

  return article;
}

/* ---- Init ---- */
document.addEventListener("DOMContentLoaded", function () {
  var grid = document.getElementById("tools-grid");
  visibleTools.forEach(function (tool) {
    grid.appendChild(renderCard(tool));
  });
  autoMountToolboxFooters();

  // i18n
  setLang(getLang());
  var langToggle = document.getElementById("langToggle");
  if (langToggle) langToggle.addEventListener("click", toggleLang);

  // Theme — #themeToggle is wired by js/theme.js (delegates to window.ToolboxTheme).
});
