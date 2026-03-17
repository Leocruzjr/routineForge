import { create } from 'zustand';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { FREE_TIER_LIMITS } from '../../../shared/constants.js';

const GUEST_ROUTINES_KEY = 'rf_guest_routines';
const GUEST_COMPLETIONS_KEY = 'rf_guest_completions';

function isGuest() {
  return useAuthStore.getState().isGuest;
}

function uid() {
  return crypto.randomUUID();
}

function loadGuestRoutines() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_ROUTINES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveGuestRoutines(routines) {
  localStorage.setItem(GUEST_ROUTINES_KEY, JSON.stringify(routines));
}

function loadGuestCompletions() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_COMPLETIONS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveGuestCompletions(completions) {
  localStorage.setItem(GUEST_COMPLETIONS_KEY, JSON.stringify(completions));
}

export const useRoutineStore = create((set, get) => ({
  routines: [],
  templates: [],
  todayCompletions: [],
  isLoading: false,
  error: null,

  fetchRoutines: async () => {
    set({ isLoading: true });
    if (isGuest()) {
      set({ routines: loadGuestRoutines(), isLoading: false, error: null });
      return;
    }
    try {
      const { data } = await api.get('/routines');
      set({ routines: data.routines, isLoading: false, error: null });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  createRoutine: async (routineData) => {
    if (isGuest()) {
      // Enforce free tier limit for guests
      const existing = loadGuestRoutines().filter((r) => r.isActive !== false);
      if (existing.length >= FREE_TIER_LIMITS.maxActiveRoutines) {
        throw new Error(`Free plan is limited to ${FREE_TIER_LIMITS.maxActiveRoutines} active routines. Upgrade to Pro for unlimited routines.`);
      }
      const { steps = [], ...rest } = routineData;
      const routine = {
        ...rest,
        id: uid(),
        isActive: true,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps: steps.map((s, i) => ({ ...s, id: uid(), order: i + 1 })),
      };
      const routines = [routine, ...loadGuestRoutines()];
      saveGuestRoutines(routines);
      set({ routines });
      return routine;
    }
    const { data } = await api.post('/routines', routineData);
    set((state) => ({ routines: [data.routine, ...state.routines] }));
    return data.routine;
  },

  updateRoutine: async (id, updates) => {
    if (isGuest()) {
      const routines = loadGuestRoutines().map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
      );
      saveGuestRoutines(routines);
      const updated = routines.find((r) => r.id === id);
      set({ routines });
      return updated;
    }
    const { data } = await api.put(`/routines/${id}`, updates);
    set((state) => ({
      routines: state.routines.map((r) => (r.id === id ? data.routine : r)),
    }));
    return data.routine;
  },

  deleteRoutine: async (id) => {
    if (isGuest()) {
      const routines = loadGuestRoutines().filter((r) => r.id !== id);
      saveGuestRoutines(routines);
      set({ routines });
      return;
    }
    await api.delete(`/routines/${id}`);
    set((state) => ({ routines: state.routines.filter((r) => r.id !== id) }));
  },

  addStep: async (routineId, stepData) => {
    if (isGuest()) {
      const step = { ...stepData, id: uid(), order: 0 };
      const routines = loadGuestRoutines().map((r) => {
        if (r.id !== routineId) return r;
        step.order = (r.steps?.length || 0) + 1;
        return { ...r, steps: [...(r.steps || []), step] };
      });
      saveGuestRoutines(routines);
      set({ routines });
      return step;
    }
    const { data } = await api.post(`/routines/${routineId}/steps`, stepData);
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, steps: [...r.steps, data.step] } : r
      ),
    }));
    return data.step;
  },

  updateStep: async (routineId, stepId, updates) => {
    if (isGuest()) {
      const routines = loadGuestRoutines().map((r) => {
        if (r.id !== routineId) return r;
        return { ...r, steps: r.steps.map((s) => s.id === stepId ? { ...s, ...updates } : s) };
      });
      saveGuestRoutines(routines);
      set({ routines });
      return;
    }
    const { data } = await api.put(`/routines/${routineId}/steps/${stepId}`, updates);
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId
          ? { ...r, steps: r.steps.map((s) => (s.id === stepId ? data.step : s)) }
          : r
      ),
    }));
  },

  deleteStep: async (routineId, stepId) => {
    if (isGuest()) {
      const routines = loadGuestRoutines().map((r) => {
        if (r.id !== routineId) return r;
        return { ...r, steps: r.steps.filter((s) => s.id !== stepId) };
      });
      saveGuestRoutines(routines);
      set({ routines });
      return;
    }
    await api.delete(`/routines/${routineId}/steps/${stepId}`);
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId
          ? { ...r, steps: r.steps.filter((s) => s.id !== stepId) }
          : r
      ),
    }));
  },

  reorderSteps: async (routineId, orderedStepIds) => {
    if (isGuest()) {
      const routines = loadGuestRoutines().map((r) => {
        if (r.id !== routineId) return r;
        const ordered = orderedStepIds.map((id, i) => {
          const step = r.steps.find((s) => s.id === id);
          return step ? { ...step, order: i + 1 } : null;
        }).filter(Boolean);
        return { ...r, steps: ordered };
      });
      saveGuestRoutines(routines);
      set({ routines });
      return;
    }
    const { data } = await api.put(`/routines/${routineId}/steps/reorder`, { orderedStepIds });
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, steps: data.steps } : r
      ),
    }));
  },

  fetchTemplates: async () => {
    try {
      const { data } = await api.get('/templates');
      set({ templates: data.templates });
    } catch {
      // Templates endpoint is public but may fail if server is down in guest mode
    }
  },

  adoptTemplate: async (templateId) => {
    if (isGuest()) {
      // Fetch templates if not loaded
      let { templates } = get();
      if (templates.length === 0) {
        try {
          const { data } = await api.get('/templates');
          templates = data.templates;
          set({ templates });
        } catch {
          return null;
        }
      }
      const template = templates.find((t) => t.id === templateId);
      if (!template) return null;

      const { steps, id, ...rest } = template;
      const routine = {
        ...rest,
        id: uid(),
        isActive: true,
        isDefault: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        steps: steps.map((s) => ({ ...s, id: uid() })),
      };
      const routines = [routine, ...loadGuestRoutines()];
      saveGuestRoutines(routines);
      set({ routines });
      return routine;
    }
    const { data } = await api.post(`/templates/${templateId}/adopt`);
    set((state) => ({ routines: [data.routine, ...state.routines] }));
    return data.routine;
  },

  fetchTodayCompletions: async () => {
    if (isGuest()) {
      const today = new Date().toISOString().split('T')[0];
      const all = loadGuestCompletions();
      // Only return completions from today — previous days are historical
      set({ todayCompletions: all.filter((c) => c.date === today) });
      return;
    }
    try {
      const { data } = await api.get('/completions/today');
      set({ todayCompletions: data.completions });
    } catch {
      // silently fail
    }
  },

  startRun: async (routineId) => {
    if (isGuest()) {
      const today = new Date().toISOString().split('T')[0];
      const completions = loadGuestCompletions();
      const existing = completions.find((c) => c.routineId === routineId && c.date === today);
      if (existing) {
        return { completion: existing, resumed: true };
      }

      const routines = loadGuestRoutines();
      const routine = routines.find((r) => r.id === routineId);
      if (!routine) throw new Error('Routine not found');

      const completion = {
        id: uid(),
        routineId,
        date: today,
        startedAt: new Date().toISOString(),
        completedAt: null,
        stepsTotal: routine.steps.length,
        stepsCompleted: 0,
        completionPct: 0,
        xpEarned: 0,
        stepCompletions: routine.steps.map((step) => ({
          id: uid(),
          stepId: step.id,
          completed: false,
          skipped: false,
          timeSpentMs: null,
          completedAt: null,
        })),
      };
      completions.push(completion);
      saveGuestCompletions(completions);
      return { completion, resumed: false };
    }
    const { data } = await api.post('/completions/start', { routineId });
    return data;
  },

  completeStep: async (completionId, stepData) => {
    if (isGuest()) {
      const completions = loadGuestCompletions();
      const comp = completions.find((c) => c.id === completionId);
      if (!comp) return;

      const sc = comp.stepCompletions.find((s) => s.stepId === stepData.stepId);
      if (sc) {
        sc.completed = stepData.completed;
        sc.skipped = stepData.skipped;
        sc.timeSpentMs = stepData.timeSpentMs;
        sc.completedAt = stepData.completed ? new Date().toISOString() : null;
      }

      comp.stepsCompleted = comp.stepCompletions.filter((s) => s.completed).length;
      comp.completionPct = comp.stepsTotal > 0 ? comp.stepsCompleted / comp.stepsTotal : 0;

      saveGuestCompletions(completions);
      return { stepCompletion: sc, stepsCompleted: comp.stepsCompleted, completionPct: comp.completionPct };
    }
    const { data } = await api.put(`/completions/${completionId}/step`, stepData);
    return data;
  },

  finishRun: async (completionId) => {
    if (isGuest()) {
      const completions = loadGuestCompletions();
      const comp = completions.find((c) => c.id === completionId);
      if (!comp) throw new Error('Completion not found');

      comp.completedAt = new Date().toISOString();
      comp.totalTimeMs = new Date(comp.completedAt).getTime() - new Date(comp.startedAt).getTime();

      // Simple XP calculation for guest mode
      const baseXp = comp.stepsCompleted * 10 + (comp.stepsCompleted === comp.stepsTotal ? 50 : 0);
      comp.xpEarned = baseXp;

      saveGuestCompletions(completions);

      // Update guest user XP
      const { updateGuestUser } = useAuthStore.getState();
      const user = useAuthStore.getState().user;
      const newXp = (user.totalXp || 0) + baseXp;
      updateGuestUser({ totalXp: newXp });

      return {
        completion: comp,
        xpBreakdown: { baseXp, streakMultiplier: 1, difficultyMultiplier: 1, weekendMultiplier: 1, totalXp: baseXp },
        leveledUp: false,
        newLevel: user.level,
        newTotalXp: newXp,
        streak: { currentStreak: 0, longestStreak: 0 },
        newBadges: [],
      };
    }
    const { data } = await api.put(`/completions/${completionId}/finish`);
    return data;
  },
}));
