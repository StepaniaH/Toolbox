/* ==========================================================================
   Theme adapter — delegates to the shared @toolbox/theme runtime
   (apps/homepage/toggle.js → window.ToolboxTheme).
   Keeps the page's own #themeToggle button wired to the shared toggle.
   The pre-paint script in index.html applies the stored theme before
   first paint; toggle.js owns persistence (localStorage "toolbox-theme").
   ========================================================================== */

function toggleTheme() {
  if (window.ToolboxTheme && typeof window.ToolboxTheme.toggleTheme === "function") {
    window.ToolboxTheme.toggleTheme();
  }
}

// Wire the page's #themeToggle button to the shared toggle.
document.addEventListener("DOMContentLoaded", function () {
  var btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", toggleTheme);
});