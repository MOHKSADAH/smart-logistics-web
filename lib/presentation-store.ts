import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PresentationState {
  isEnabled: boolean;
  togglePresentation: () => void;
}

export const usePresentationMode = create<PresentationState>()(
  persist(
    (set) => ({
      isEnabled: false,
      togglePresentation: () => set((state) => ({ isEnabled: !state.isEnabled })),
    }),
    {
      name: 'presentation-mode',
    }
  )
);
