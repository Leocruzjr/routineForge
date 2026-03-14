import { create } from 'zustand';
import { api } from '@/lib/api';

export const useGamificationStore = create((set) => ({
  badges: [],
  rewards: [],
  availableXp: 0,
  stats: null,
  isLoading: false,

  fetchBadges: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/gamification/badges');
      set({ badges: data.badges, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchRewards: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/gamification/rewards');
      set({ rewards: data.rewards, availableXp: data.availableXp, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  redeemReward: async (rewardId) => {
    const { data } = await api.post(`/gamification/rewards/${rewardId}/redeem`);
    // Re-fetch to update owned status and XP
    set((state) => ({
      availableXp: data.remainingXp,
      rewards: state.rewards.map((r) =>
        r.id === rewardId ? { ...r, owned: true, canAfford: false } : { ...r, canAfford: data.remainingXp >= r.xpCost }
      ),
    }));
    return data;
  },

  fetchStats: async () => {
    try {
      const { data } = await api.get('/gamification/stats');
      set({ stats: data });
    } catch {
      // silently fail
    }
  },
}));
