const STORAGE_KEY = "portfolio-theme";
const THEMES = new Set(["light", "dark"]);

export function initTheme() {
  const root = document.documentElement;
  const toggle = document.querySelector("[data-theme-toggle]");
  const systemQuery = window.matchMedia("(prefers-color-scheme: light)");

  const getSystemTheme = () => (systemQuery.matches ? "light" : "dark");

  const getStoredTheme = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return THEMES.has(stored) ? stored : null;
    } catch {
      return null;
    }
  };

  const setStoredTheme = (theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Some privacy modes disable localStorage; the current page can still switch.
    }
  };

  const updateMetaColor = (theme) => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const color = getComputedStyle(root).getPropertyValue("--theme-color").trim();
    meta.setAttribute("content", color || (theme === "light" ? "#f6f8fc" : "#04040f"));
  };

  const updateToggle = (theme, source) => {
    if (!toggle) return;
    const next = theme === "dark" ? "light" : "dark";
    const sourceLabel = source === "system" ? "browser setting" : "saved choice";
    toggle.setAttribute("aria-label", `Switch to ${next} mode. Current mode follows ${sourceLabel}.`);
    toggle.setAttribute("title", `Switch to ${next} mode`);
  };

  const applyTheme = (theme, source = "manual") => {
    root.dataset.theme = theme;
    root.dataset.themeSource = source;
    root.style.colorScheme = theme;
    updateMetaColor(theme);
    updateToggle(theme, source);
    window.dispatchEvent(new CustomEvent("portfolio-theme-change", {
      detail: { theme, source }
    }));
  };

  const syncTheme = () => {
    const stored = getStoredTheme();
    applyTheme(stored || getSystemTheme(), stored ? "manual" : "system");
  };

  if (toggle) {
    toggle.addEventListener("click", () => {
      const current = root.dataset.theme === "light" ? "light" : "dark";
      const next = current === "dark" ? "light" : "dark";
      setStoredTheme(next);
      applyTheme(next, "manual");
    });
  }

  if (systemQuery.addEventListener) {
    systemQuery.addEventListener("change", () => {
      if (!getStoredTheme()) syncTheme();
    });
  } else if (systemQuery.addListener) {
    systemQuery.addListener(() => {
      if (!getStoredTheme()) syncTheme();
    });
  }

  syncTheme();
}
