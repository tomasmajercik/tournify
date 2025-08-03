import { useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useThemeStore } from '@/stores/themeStore';

export default function Index() {
  const loadTheme = useThemeStore((s) => s.loadTheme);

  useEffect(() => {
    loadTheme();

    const checkTokenAndRedirect = async () => {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        router.replace("/home"); // If token exists, go to home
      } else {
        router.replace("/welcome"); // Else go to welcome screen
      }
    };

    checkTokenAndRedirect();
  }, []);

  return null; // nothing rendered directly from this screen
}
