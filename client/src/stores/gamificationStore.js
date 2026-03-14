import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

function isGuest() {
  return useAuthStore.getState().isGuest;
}

export const useGamificationStore = create((set) => ({
  badges: [],
  rewards: [],
  availableXp: 0,
  stats: null,
  isLoading: false,

  fetchBadges: async () => {
    if (isGuest()) {
      set({ badges: [], isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const { data } = await api.get('/gamification/badges');
      set({ badges: data.badges, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchRewards: async () => {
    if (isGuest()) {
      set({ rewards: [], availableXp: 0, isLoading: false });
      return;
    }
    set({ isLoading: true });
    try {
      const { data } = await api.get('/gamification/rewards');
      set({ rewards: data.rewards, availableXp: data.availableXp, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  redeemReward: async (rewardId) => {
    if (isGuest()) return;
    const { data } = await api.post(`/gamification/rewards/${rewardId}/redeem`);
    set((state) => ({
      availableXp: data.remainingXp,
      rewards: state.rewards.map((r) =>
        r.id === rewardId ? { ...r, owned: true, canAfford: false } : { ...r, canAfford: data.remainingXp >= r.xpCost }
      ),
    }));
    return data;
  },

  fetchStats: async () => {
    if (isGuest()) {
      set({ stats: { heatmap: [], totalCompleted: 0, avgCompletionPct: 0, weeklyXp: [] } });
      return;
    }
    try {
      const { data } = await api.get('/gamification/stats');
      set({ stats: data });
    } catch {
      // silently fail
    }
  },
}));
