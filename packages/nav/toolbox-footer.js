import { getAppById, TOOLBOX_RELEASE } from "@toolbox/app-manifest";

function currentLang() {
  if (window.ToolboxI18n && typeof window.ToolboxI18n.getLang === "function") {
    return window.ToolboxI18n.getLang();
  }
  try {
    return localStorage.getItem("toolbox-lang") === "en" ? "en" : "zh";
  } catch {
    return "zh";
  }
}

function link(href, text) {
  var anchor = document.createElement("a");
  anchor.href = href;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.textContent = text;
  return anchor;
}

function separator() {
  var node = document.createElement("span");
  node.setAttribute("aria-hidden", "true");
  node.textContent = "·";
  return node;
}

export function mountToolboxFooter(target, appId) {
  var node = typeof target === "string" ? document.querySelector(target) : target;
  var app = getAppById(appId);
  if (!node) throw new Error("Toolbox footer mount target not found");
  if (!app) throw new Error("Unknown Toolbox footer app: " + appId);

  node.classList.add("toolbox-footer");
  var description = document.createElement("p");
  description.className = "toolbox-footer-description";
  var meta = document.createElement("div");
  meta.className = "toolbox-footer-meta";
  meta.appendChild(link("https://github.com/StepaniaH/Toolbox", "GitHub"));
  meta.appendChild(separator());
  meta.appendChild(link("https://github.com/StepaniaH/Toolbox/blob/main/LICENSE", "MIT"));
  meta.appendChild(separator());
  var release = document.createElement("span");
  release.textContent = TOOLBOX_RELEASE;
  meta.appendChild(release);
  node.replaceChildren(description, meta);

  var render = function () {
    description.textContent = currentLang() === "en"
      ? app.description.en
      : app.description.zh;
  };
  render();

  if (window.ToolboxI18n && typeof window.ToolboxI18n.onChange === "function") {
    window.ToolboxI18n.onChange(render);
  }
  window.addEventListener("toolbox-lang-change", render);
  return node;
}

export function autoMountToolboxFooters() {
  document.querySelectorAll("[data-toolbox-footer]").forEach(function (node) {
    mountToolboxFooter(node, node.getAttribute("data-toolbox-footer"));
  });
}
