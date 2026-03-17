import { create } from 'zustand';

const THEME_KEY = 'rf_theme';
const PRIMARY_COLOR_KEY = 'rf_primary_color';
const ACCENT_COLOR_KEY = 'rf_accent_color';

// Primary colors control the app background
const PASTEL_COLORS = {
  cream: {
    name: 'Soft Cream',
    bg: '#FEFCE8',
    bgDark: '#0F172A',
    500: '#F59E0B', 100: '#FEF3C7', 50: '#FFFBEB', 600: '#D97706', 900: '#78350F', 400: '#FBBF24', 300: '#FCD34D', 200: '#FDE68A',
    text: '#78350F', textDark: '#FEF3C7',
  },
  sage: {
    name: 'Sage Green',
    bg: '#ECFDF5',
    bgDark: '#0B1A14',
    500: '#10B981', 100: '#D1FAE5', 50: '#ECFDF5', 600: '#059669', 900: '#064E3B', 400: '#34D399', 300: '#6EE7B7', 200: '#A7F3D0',
    text: '#064E3B', textDark: '#D1FAE5',
  },
  blue: {
    name: 'Pastel Blue',
    bg: '#F0F9FF',
    bgDark: '#0B1929',
    500: '#0EA5E9', 100: '#E0F2FE', 50: '#F0F9FF', 600: '#0284C7', 900: '#0C4A6E', 400: '#38BDF8', 300: '#7DD3FC', 200: '#BAE6FD',
    text: '#0C4A6E', textDark: '#E0F2FE',
  },
  lavender: {
    name: 'Lavender',
    bg: '#F5F3FF',
    bgDark: '#110E24',
    500: '#8B5CF6', 100: '#EDE9FE', 50: '#F5F3FF', 600: '#7C3AED', 900: '#4C1D95', 400: '#A78BFA', 300: '#C4B5FD', 200: '#DDD6FE',
    text: '#4C1D95', textDark: '#EDE9FE',
  },
};

// Accent colors control modals and card highlights
const ACCENT_COLORS = {
  cream: {
    name: 'Soft Cream',
    cardBg: '#FFFBEB', cardBgDark: '#1E1B0F',
    500: '#F59E0B', 100: '#FEF3C7', 50: '#FFFBEB', 600: '#D97706', 900: '#78350F', 400: '#FBBF24', 300: '#FCD34D', 200: '#FDE68A',
  },
  sage: {
    name: 'Sage Green',
    cardBg: '#ECFDF5', cardBgDark: '#0D1F17',
    500: '#10B981', 100: '#D1FAE5', 50: '#ECFDF5', 600: '#059669', 900: '#064E3B', 400: '#34D399', 300: '#6EE7B7', 200: '#A7F3D0',
  },
  blue: {
    name: 'Pastel Blue',
    cardBg: '#F0F9FF', cardBgDark: '#0D1A2B',
    500: '#0EA5E9', 100: '#E0F2FE', 50: '#F0F9FF', 600: '#0284C7', 900: '#0C4A6E', 400: '#38BDF8', 300: '#7DD3FC', 200: '#BAE6FD',
  },
  lavender: {
    name: 'Lavender',
    cardBg: '#F5F3FF', cardBgDark: '#151228',
    500: '#8B5CF6', 100: '#EDE9FE', 50: '#F5F3FF', 600: '#7C3AED', 900: '#4C1D95', 400: '#A78BFA', 300: '#C4B5FD', 200: '#DDD6FE',
  },
};

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'dark' || stored === 'light') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  localStorage.setItem(THEME_KEY, theme);
}

function applyColorVar(prefix, palette) {
  const root = document.documentElement.style;
  for (const shade of ['50', '100', '200', '300', '400', '500', '600', '900']) {
    if (palette[shade]) root.setProperty(`--color-${prefix}-${shade}`, palette[shade]);
  }
  if (palette['500']) root.setProperty(`--color-${prefix}`, palette['500']);
}

function applyPrimaryBg(palette, theme) {
  const root = document.documentElement.style;
  root.setProperty('--color-surface-light', palette.bg);
  root.setProperty('--color-surface-dark', palette.bgDark);
}

function applyAccentCard(palette, theme) {
  const root = document.documentElement.style;
  root.setProperty('--color-card-light', palette.cardBg);
  root.setProperty('--color-card-dark', palette.cardBgDark);
}

function getInitialColor(key, fallback) {
  return localStorage.getItem(key) || fallback;
}

// Apply on load
applyTheme(getInitialTheme());

const initialPrimary = getInitialColor(PRIMARY_COLOR_KEY, 'cream');
const initialAccent = getInitialColor(ACCENT_COLOR_KEY, 'cream');
if (PASTEL_COLORS[initialPrimary]) {
  applyColorVar('primary', PASTEL_COLORS[initialPrimary]);
  applyPrimaryBg(PASTEL_COLORS[initialPrimary], getInitialTheme());
}
if (ACCENT_COLORS[initialAccent]) {
  applyColorVar('accent', ACCENT_COLORS[initialAccent]);
  applyAccentCard(ACCENT_COLORS[initialAccent], getInitialTheme());
}

export const useThemeStore = create((set, get) => ({
  theme: getInitialTheme(),
  primaryColor: initialPrimary,
  accentColor: initialAccent,

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

  setPrimaryColor: (colorName) => {
    const palette = PASTEL_COLORS[colorName];
    if (!palette) return;
    applyColorVar('primary', palette);
    applyPrimaryBg(palette, get().theme);
    localStorage.setItem(PRIMARY_COLOR_KEY, colorName);
    set({ primaryColor: colorName });
  },

  setAccentColor: (colorName) => {
    const palette = ACCENT_COLORS[colorName];
    if (!palette) return;
    applyColorVar('accent', palette);
    applyAccentCard(palette, get().theme);
    localStorage.setItem(ACCENT_COLOR_KEY, colorName);
    set({ accentColor: colorName });
  },
}));

export { PASTEL_COLORS, ACCENT_COLORS };
