const THEME_STORAGE_KEY = "vueuse-color-scheme";

export function initThemeToggle() {
  const toggleButton = document.getElementById("dark-toggle");

  toggleButton?.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    storeTheme(isDark ? "dark" : "light");
  });
}

function storeTheme(theme: "dark" | "light") {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    return;
  }
}
