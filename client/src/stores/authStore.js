import { create } from 'zustand';
import { api } from '@/lib/api';

const GUEST_KEY = 'rf_guest_user';

const DEFAULT_GUEST = {
  id: 'guest',
  username: 'Guest',
  email: null,
  level: 1,
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  streakFreezes: 2,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  plan: 'FREE',
  planExpiresAt: null,
};

export const useAuthStore = create((set, get) => ({
  user: null,
  isGuest: false,
  isLoading: true,
  error: null,

  /**
   * Check if user is already authenticated (on app load).
   * Tries server auth first, then falls back to guest session in localStorage.
   */
  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isGuest: false, isLoading: false, error: null });
    } catch {
      // Check for guest session
      const stored = localStorage.getItem(GUEST_KEY);
      if (stored) {
        try {
          const guestUser = JSON.parse(stored);
          set({ user: guestUser, isGuest: true, isLoading: false, error: null });
          return;
        } catch {
          localStorage.removeItem(GUEST_KEY);
        }
      }
      // Only clear user if we were in the initial loading state
      // Don't nuke a user that was just set by login()
      const { isLoading: wasLoading } = get();
      if (wasLoading) {
        set({ user: null, isGuest: false, isLoading: false, error: null });
      } else {
        set({ isLoading: false });
      }
    }
  },

  /**
   * Continue as guest — stores user data in localStorage
   */
  loginAsGuest: () => {
    const guestUser = { ...DEFAULT_GUEST };
    localStorage.setItem(GUEST_KEY, JSON.stringify(guestUser));
    set({ user: guestUser, isGuest: true, isLoading: false, error: null });
  },

  /**
   * Update guest user data in localStorage (for XP, level, streak changes)
   */
  updateGuestUser: (updates) => {
    const current = get().user;
    if (!get().isGuest || !current) return;
    const updated = { ...current, ...updates };
    localStorage.setItem(GUEST_KEY, JSON.stringify(updated));
    set({ user: updated });
  },

  /**
   * Register a new user
   */
  register: async ({ email, username, password }) => {
    set({ error: null });
    try {
      const { data } = await api.post('/auth/register', { email, username, password });
      // Clear guest data on successful registration
      localStorage.removeItem(GUEST_KEY);
      set({ user: data.user, isGuest: false, error: null });
      return data.user;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  /**
   * Login with email and password
   */
  login: async ({ email, password }) => {
    set({ error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.removeItem(GUEST_KEY);
      set({ user: data.user, isGuest: false, error: null });
      return data.user;
    } catch (err) {
      set({ error: err.message });
      throw err;
    }
  },

  /**
   * Logout the current user
   */
  logout: async () => {
    const wasGuest = get().isGuest;
    if (wasGuest) {
      localStorage.removeItem(GUEST_KEY);
      set({ user: null, isGuest: false, error: null });
    } else {
      try {
        await api.post('/auth/logout');
      } finally {
        set({ user: null, isGuest: false, error: null });
      }
    }
  },

  /**
   * Check if the current user has an active Pro plan
   */
  isPro: () => {
    const { user } = get();
    if (!user) return false;
    if (user.plan !== 'PRO') return false;
    if (user.planExpiresAt && new Date(user.planExpiresAt) < new Date()) return false;
    return true;
  },

  /**
   * Upgrade to Pro (placeholder — will integrate with payment later)
   */
  upgradePlan: async () => {
    if (get().isGuest) return;
    try {
      const { data } = await api.post('/gamification/plan/upgrade', { plan: 'PRO' });
      set((state) => ({
        user: { ...state.user, plan: data.plan, planExpiresAt: data.planExpiresAt },
      }));
      return data;
    } catch (err) {
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
