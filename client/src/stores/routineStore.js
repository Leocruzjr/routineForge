import { create } from 'zustand';
import { api } from '@/lib/api';

export const useRoutineStore = create((set, get) => ({
  routines: [],
  templates: [],
  todayCompletions: [],
  isLoading: false,
  error: null,

  fetchRoutines: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/routines');
      set({ routines: data.routines, isLoading: false, error: null });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  createRoutine: async (routineData) => {
    const { data } = await api.post('/routines', routineData);
    set((state) => ({ routines: [data.routine, ...state.routines] }));
    return data.routine;
  },

  updateRoutine: async (id, updates) => {
    const { data } = await api.put(`/routines/${id}`, updates);
    set((state) => ({
      routines: state.routines.map((r) => (r.id === id ? data.routine : r)),
    }));
    return data.routine;
  },

  deleteRoutine: async (id) => {
    await api.delete(`/routines/${id}`);
    set((state) => ({
      routines: state.routines.filter((r) => r.id !== id),
    }));
  },

  addStep: async (routineId, stepData) => {
    const { data } = await api.post(`/routines/${routineId}/steps`, stepData);
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, steps: [...r.steps, data.step] } : r
      ),
    }));
    return data.step;
  },

  updateStep: async (routineId, stepId, updates) => {
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
    const { data } = await api.put(`/routines/${routineId}/steps/reorder`, { orderedStepIds });
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, steps: data.steps } : r
      ),
    }));
  },

  fetchTemplates: async () => {
    const { data } = await api.get('/templates');
    set({ templates: data.templates });
  },

  adoptTemplate: async (templateId) => {
    const { data } = await api.post(`/templates/${templateId}/adopt`);
    set((state) => ({ routines: [data.routine, ...state.routines] }));
    return data.routine;
  },

  fetchTodayCompletions: async () => {
    try {
      const { data } = await api.get('/completions/today');
      set({ todayCompletions: data.completions });
    } catch {
      // silently fail — dashboard still usable without completions
    }
  },

  startRun: async (routineId) => {
    const { data } = await api.post('/completions/start', { routineId });
    return data;
  },

  completeStep: async (completionId, stepData) => {
    const { data } = await api.put(`/completions/${completionId}/step`, stepData);
    return data;
  },

  finishRun: async (completionId) => {
    const { data } = await api.put(`/completions/${completionId}/finish`);
    return data;
  },
}));
