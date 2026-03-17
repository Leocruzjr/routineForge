import { create } from 'zustand';

const THEME_KEY = 'rf_theme';
const PRIMARY_COLOR_KEY = 'rf_primary_color';
const ACCENT_COLOR_KEY = 'rf_accent_color';

const PASTEL_COLORS = {
  amber: { 500: '#F59E0B', 100: '#FEF3C7', 50: '#FFFBEB', 600: '#D97706', 900: '#78350F' },
  rose: { 500: '#F43F5E', 100: '#FFE4E6', 50: '#FFF1F2', 600: '#E11D48', 900: '#881337' },
  violet: { 500: '#8B5CF6', 100: '#EDE9FE', 50: '#F5F3FF', 600: '#7C3AED', 900: '#4C1D95' },
  sky: { 500: '#0EA5E9', 100: '#E0F2FE', 50: '#F0F9FF', 600: '#0284C7', 900: '#0C4A6E' },
  emerald: { 500: '#10B981', 100: '#D1FAE5', 50: '#ECFDF5', 600: '#059669', 900: '#064E3B' },
  pink: { 500: '#EC4899', 100: '#FCE7F3', 50: '#FDF2F8', 600: '#DB2777', 900: '#831843' },
  teal: { 500: '#14B8A6', 100: '#CCFBF1', 50: '#F0FDFA', 600: '#0D9488', 900: '#134E4A' },
  slate: { 500: '#64748B', 100: '#F1F5F9', 50: '#F8FAFC', 600: '#475569', 900: '#0F172A' },
};

const ACCENT_COLORS = {
  orange: { 500: '#F97316', 100: '#FFEDD5', 50: '#FFF7ED', 600: '#EA580C', 900: '#7C2D12' },
  red: { 500: '#EF4444', 100: '#FEE2E2', 50: '#FEF2F2', 600: '#DC2626', 900: '#7F1D1D' },
  indigo: { 500: '#6366F1', 100: '#E0E7FF', 50: '#EEF2FF', 600: '#4F46E5', 900: '#312E81' },
  cyan: { 500: '#06B6D4', 100: '#CFFAFE', 50: '#ECFEFF', 600: '#0891B2', 900: '#164E63' },
  lime: { 500: '#84CC16', 100: '#ECFCCB', 50: '#F7FEE7', 600: '#65A30D', 900: '#365314' },
  fuchsia: { 500: '#D946EF', 100: '#FAE8FF', 50: '#FDF4FF', 600: '#C026D3', 900: '#701A75' },
  yellow: { 500: '#EAB308', 100: '#FEF9C3', 50: '#FEFCE8', 600: '#CA8A04', 900: '#713F12' },
  coral: { 500: '#FB7185', 100: '#FFE4E6', 50: '#FFF1F2', 600: '#E11D48', 900: '#881337' },
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
  Object.entries(palette).forEach(([shade, hex]) => {
    root.setProperty(`--color-${prefix}-${shade}`, hex);
  });
  if (palette['500']) {
    root.setProperty(`--color-${prefix}`, palette['500']);
  }
}

function getInitialColor(key, fallback) {
  return localStorage.getItem(key) || fallback;
}

// Apply on load
applyTheme(getInitialTheme());

const initialPrimary = getInitialColor(PRIMARY_COLOR_KEY, 'amber');
const initialAccent = getInitialColor(ACCENT_COLOR_KEY, 'orange');
if (PASTEL_COLORS[initialPrimary]) applyColorVar('primary', PASTEL_COLORS[initialPrimary]);
if (ACCENT_COLORS[initialAccent]) applyColorVar('accent', ACCENT_COLORS[initialAccent]);

export const useThemeStore = create((set) => ({
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
    localStorage.setItem(PRIMARY_COLOR_KEY, colorName);
    set({ primaryColor: colorName });
  },

  setAccentColor: (colorName) => {
    const palette = ACCENT_COLORS[colorName];
    if (!palette) return;
    applyColorVar('accent', palette);
    localStorage.setItem(ACCENT_COLOR_KEY, colorName);
    set({ accentColor: colorName });
  },
}));

export { PASTEL_COLORS, ACCENT_COLORS };
