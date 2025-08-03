import { create } from 'zustand'

type TournamentStore = {
    shouldRefresh: boolean;
    setShouldRefresh: (value: boolean) => void;
  };
  
export const useTournamentStore = create<TournamentStore>((set) => ({
    shouldRefresh: false,
    setShouldRefresh: (value) => set({ shouldRefresh: value }),
}));