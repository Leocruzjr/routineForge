import { create } from 'zustand';

const STORAGE_KEY = 'rf_page_tours';

function getSeenTours() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

export const usePageTourStore = create((set, get) => ({
  seenTours: getSeenTours(),

  hasSeenTour: (pageKey) => !!get().seenTours[pageKey],

  markTourSeen: (pageKey) => {
    const updated = { ...get().seenTours, [pageKey]: true };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ seenTours: updated });
  },

  resetTour: (pageKey) => {
    const updated = { ...get().seenTours };
    delete updated[pageKey];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    set({ seenTours: updated });
  },

  resetAllTours: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ seenTours: {} });
  },
}));
