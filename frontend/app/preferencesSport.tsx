import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import API_BASE_URL from "@/config/config";

import SportCard from '../components/registration/sportCard';
import StartButton from '../components/startButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Zustand
import { useSignUpStore } from "@/stores/signUpStore";
import { useTheme } from '@/themes/theme';

export default function PreferencesSportScreen() {
  const [sportsData, setSportsData] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  const { // Zustand store
    preferences,
    setField,
  } = useSignUpStore();

  // Fetch sports categories from the API
  useEffect(() => {
    const fetchSports = async () => {
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        setToken(storedToken);
      }
      try {
        const response = await fetch(`${API_BASE_URL}/tournaments/categories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Sports could not be loaded.");
        }

        setSportsData(data);
      } catch (error) {
        console.warn('❌ Error loading categories:', error);
        router.replace("/errorScreen");
      }
    };

    fetchSports();
  }, []);


  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      setSelected(prev => prev.filter(item => item !== id));
    } else {
      setSelected(prev => [...prev, id]);
    }
  };

  // Handle the continue button press and check if at least one sport is selected
  const handleContinue = () => {
    if (selected.length === 0) {
      alert("Please select at least one sport.");
      return;
    }
    setField("preferences", selected);
    // Navigate to the next screen
    router.replace("/preferencesCity");
  };

  // Variable to store the theme styles
  const theme = useTheme();
  const styles = useMemo(() => getStyles(theme), [theme]);

  return (
    <SafeAreaView
      style={styles.container}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={styles.heading}>
          Choose your{'\n'}
          <Text style={styles.bold}>Sports</Text>
        </Text>

        <FlatList
          data={sportsData}
          renderItem={({ item }) => (
            <SportCard
              title={item.category_name}
              image={{
                uri: `${API_BASE_URL}/category/images/${item.category_image}`,
                headers: { Authorization: `Bearer ${token}` },
              }}
              selected={selected.includes(item.id)}
              onPress={() => toggleSelect(item.id)}
            />
          )}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.flatList}
          showsVerticalScrollIndicator={false}
        />

      </View>
      <View style={styles.buttonContainer}>
        <StartButton title="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  heading: {
    fontSize: 24,
    marginBottom: 20,
    color: theme.text,
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 32,
  },
  buttonContainer: {
    marginTop: 10,
    paddingHorizontal: 20,
  },
  flatList: {
    flexGrow: 1,
    paddingBottom: 20,
  }
});
