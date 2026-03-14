import { create } from 'zustand';

const TOUR_KEY = 'rf_tour_completed';

export const useOnboardingStore = create((set) => ({
  hasSeenTour: localStorage.getItem(TOUR_KEY) === 'true',
  currentStep: 0,
  totalSteps: 4,

  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, state.totalSteps - 1) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

  completeTour: () => {
    localStorage.setItem(TOUR_KEY, 'true');
    set({ hasSeenTour: true, currentStep: 0 });
  },

  skipTour: () => {
    localStorage.setItem(TOUR_KEY, 'true');
    set({ hasSeenTour: true, currentStep: 0 });
  },
}));
