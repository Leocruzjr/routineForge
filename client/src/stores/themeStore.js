import { create } from 'zustand';

const THEME_KEY = 'rf_theme';

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
}

// Apply on load
applyTheme(getInitialTheme());

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      return { theme: next };
    });
  },

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
}));
