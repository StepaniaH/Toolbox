import { getAppById } from "@toolbox/app-manifest";

export function createAppIcon(appId, className) {
  var app = getAppById(appId);
  if (!app) throw new Error("Unknown Toolbox app icon: " + appId);
  var icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", app.icon.viewBox);
  icon.setAttribute("aria-hidden", "true");
  icon.setAttribute(
    "class",
    ["toolbox-app-icon", className].filter(Boolean).join(" ")
  );
  icon.innerHTML = app.icon.svg;
  return icon;
}

export function mountAppIcon(target, appId, className) {
  var node = typeof target === "string" ? document.querySelector(target) : target;
  if (!node) throw new Error("Toolbox app icon mount target not found");
  node.replaceChildren(createAppIcon(appId, className));
}
