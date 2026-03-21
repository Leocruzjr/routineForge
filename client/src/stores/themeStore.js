import { create } from 'zustand';
import { ACCENT_THEMES } from '../../../shared/constants.js';

const THEME_KEY = 'rf_theme';
const ACCENT_KEY = 'rf_accent_theme';

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getInitialAccent() {
  return localStorage.getItem(ACCENT_KEY) || 'default';
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
  document.body.style.backgroundColor = theme === 'dark' ? '#000000' : '#F2F2F7';
}

function applyAccentTheme(accentKey) {
  const theme = ACCENT_THEMES[accentKey] || ACCENT_THEMES.default;
  const root = document.documentElement;

  // Apply primary color CSS variables
  Object.entries(theme.primary).forEach(([shade, color]) => {
    root.style.setProperty(`--color-primary-${shade}`, color);
  });

  // Apply accent color CSS variables
  Object.entries(theme.accent).forEach(([shade, color]) => {
    root.style.setProperty(`--color-accent-${shade}`, color);
  });

  localStorage.setItem(ACCENT_KEY, accentKey);
}

// Apply on load
applyTheme(getInitialTheme());
applyAccentTheme(getInitialAccent());

export const useThemeStore = create((set) => ({
  theme: getInitialTheme(),
  accentTheme: getInitialAccent(),

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

  setAccentTheme: (accentKey) => {
    applyAccentTheme(accentKey);
    set({ accentTheme: accentKey });
  },
}));
