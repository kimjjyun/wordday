import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useGuestStore = create(
  persist(
    (set) => ({
      name: null,
      enter: (name) => set({ name }),
      exit:  ()     => set({ name: null }),
    }),
    { name: 'wordday-guest' }
  )
);
