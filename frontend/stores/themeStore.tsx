// themeStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'system' | 'light' | 'dark' | 'bw';

interface ThemeStore {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  loadTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'system',
  setTheme: async (theme) => {
    await AsyncStorage.setItem('appTheme', theme);
    set({ theme });
  },
  loadTheme: async () => {
    const saved = await AsyncStorage.getItem('appTheme');
    if (saved) {
      set({ theme: saved as ThemeType });
    }
  },
}));

//** Theme switching was made with help from ChatGPT */