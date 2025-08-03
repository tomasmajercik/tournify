import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/stores/themeStore';

export const lightTheme = {
    id: 'lightTheme',
    background: '#ffffff',
    text: '#000000',
    mutedText: '#666666',
    card: '#eeeeee',
    topBar: '#f0f0f0',
    dotActive: '#000000',
    dotInactive: '#cccccc',
    historyCard: '#ffffff',
    tournamentCard: "rgba(205, 205, 205, 0.75)",
    inputBackground: '#ffffff',
    inputBorder: '#cccccc',
    teamButton: '#f0f0f0',
    descriptionText: '#444444',
    createInputBackground: '#eee',
    createInputBorder: '#ddd',
    placeholderText: "#888",
    qrCode: "#000",
    headerTable: "#f5f5f5",
    tableRow: "#fff",
    tableBorder: '#ddd',
    cardColor: '#000000',
    liveColor: '#FF3B30',
};

export const darkTheme = {
    id: 'darkTheme',
    background: '#222222',
    text: '#ffffff',
    mutedText: '#aaaaaa',
    card: '#2E2E2E',
    topBar: '#333333',
    dotActive: '#ffffff',
    dotInactive: '#555555',
    historyCard: '#333333',
    tournamentCard: "rgba(175, 175, 175, 0.75)",
    inputBackground: '#333333',
    inputBorder: '#555555',
    focusedBorder: '#66D9EF',
    teamButton: '#555555',
    descriptionText: '#eeeeee',
    createInputBackground: '#333',
    createInputBorder: '#555',
    placeholderText: "#aaa",
    qrCode: "#eee",
    headerTable: "#333333",
    tableRow: "#444444",
    tableBorder: '#555555',
    cardColor: '#000000',
    liveColor: '#FF3B30',
};

export const blackWhiteTheme = {
    id: 'blackWhiteTheme',
    background: '#000000',         // Pure black background
    text: '#ffffff',               // Pure white text
    mutedText: '#aaaaaa',          // Light gray for secondary text
    card: '#111111',               // Very dark gray for card background
    topBar: '#1a1a1a',             // Slightly lighter than background
    dotActive: '#ffffff',          // White dot
    dotInactive: '#555555',        // Mid-gray dot
    historyCard: '#111111',        // Same dark gray as cards
    tournamentCard: '#1a1a1a',     // Slightly lighter gray
    inputBackground: '#000000',    // Keep it black
    inputBorder: '#555555',        // Mid-gray border
    teamButton: '#1a1a1a',         // Button same as card
    descriptionText: '#cccccc',    // Light gray
    createInputBackground: '#111111',
    createInputBorder: '#555555',
    placeholderText: '#888888',    // Medium gray placeholder
    qrCode: '#ffffff',             // White on black
    headerTable: '#111111',
    tableRow: '#000000',
    tableBorder: '#444444',
    cardColor: '#ffffff',
    liveColor: '#fff',
};

export const useTheme = () => {
    const selected = useThemeStore((s) => s.theme);
    const system = useColorScheme();
  
    if (selected === 'light') return lightTheme;
    if (selected === 'dark') return darkTheme;
    if (selected === 'bw') return blackWhiteTheme;
    return system === 'dark' ? darkTheme : lightTheme; // system default
};

//** Theme switching was made with help from ChatGPT */