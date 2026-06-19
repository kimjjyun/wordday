import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGuestStore = create(
  persist(
    (set, get) => ({
      name: null,
      // wordKey → { stability, nextReview, reps, lapses, state }
      records: {},

      enter: (name) => set({ name }),
      exit:  ()     => set({ name: null, records: {} }),

      getRecord: (wordKey) => get().records[wordKey] ?? null,

      saveRecord: (wordKey, data) =>
        set(s => ({ records: { ...s.records, [wordKey]: data } })),
    }),
    { name: 'wordday-guest' }
  )
);
