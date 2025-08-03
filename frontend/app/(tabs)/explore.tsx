import { Text, View, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, FlatList, RefreshControl } from "react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/themes/theme";
import API_BASE_URL from "@/config/config";

import FontAwesome from '@expo/vector-icons/FontAwesome';

import CategoryContainer from "@/components/explore/categoryContainer";
import { useRouter } from "expo-router";
import OfflineBanner from "@/components/offline/offlineBanner";
import useOnShakeRefresh from "@/hooks/useOnShakeRefresh";

export default function ExploreScreen() {

    const [categories, setCategories] = useState<{ id: number; category_name: string; category_image: string; }[]>([]);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    // Variable to store the theme styles
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    const fetchSports = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/tournaments/categories`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to load sports.");
            }

            setCategories(data);
            setLoading(false);

        } catch (error) {
            console.warn('❌ Error loading categories:', error);
            router.replace("/errorScreen");
        }
    };

    useEffect(() => {
        fetchSports();
    }, []);

    // Refresh control for the FlatList
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchSports();
        setRefreshing(false);
    };

    useOnShakeRefresh(onRefresh);

    return (
        <SafeAreaView style={styles.safeArea}>
            <OfflineBanner />
            <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={styles.mainTitle}>
                    <FontAwesome style={styles.icon} name="search" size={24} color={theme.text} />
                    <Text style={styles.title}>Explore</Text>
                </View>
                <Text style={styles.subTitle}>Choose your category</Text>

                <FlatList
                    data={categories}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    renderItem={({ item }) => (
                        <CategoryContainer
                            categoryName={item.category_name}
                            imageFilename={item.category_image}
                            onPress={() => router.push(`/explore/${item.id}-${item.category_name.toLowerCase()}`)}
                        />
                    )}
                />

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}


const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
    },
    wrapper: {
        flex: 1,
        backgroundColor: theme.background,
    },
    mainTitle: {
        flexDirection: 'row',
        textAlignVertical: 'center',
        marginTop: 20,
        marginLeft: 25,
    },
    title: {
        fontSize: 25,
        fontWeight: 'bold',
        marginBottom: 25,
        color: theme.text,
    },
    icon: {
        marginTop: 2,
        marginRight: 10,
        color: theme.text,
    },
    subTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        marginLeft: 25,
        color: theme.text,
        paddingBottom: 10,
    },

    container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    imgContainer: {
        width: '90%',
        borderRadius: 10,
        overflow: 'hidden',
    },
    image: {
        height: 120,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    sportText: {
        color: '#fff',
        zIndex: 10,
        fontWeight: 'bold',
        fontSize: 24,
        textTransform: 'uppercase',
    },

});
