import { create } from 'zustand';
import { api } from '@/lib/api';

export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  error: null,

  /**
   * Check if user is already authenticated (on app load)
   */
  checkAuth: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isLoading: false, error: null });
    } catch {
      set({ user: null, isLoading: false, error: null });
    }
  },

  /**
   * Register a new user
   */
  register: async ({ email, username, password }) => {
    set({ error: null });
    try {
      const { data } = await api.post('/auth/register', { email, username, password });
      set({ user: data.user, error: null });
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
      set({ user: data.user, error: null });
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
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null, error: null });
    }
  },

  clearError: () => set({ error: null }),
}));
