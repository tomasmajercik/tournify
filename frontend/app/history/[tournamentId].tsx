import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '@/config/config';
import { useTheme } from '@/themes/theme';

import TournamentDescription from '@/components/tournamentDetail/tournamentDescription';
import Leaderboard from '@/components/tournamentDetail/leaderboard';
import MapPreview from '@/components/tournamentDetail/mapPreview';
import Badge from '@/components/tournamentDetail/badge';
import SafeOfflineBanner from '@/components/offline/safeOfflineBanner';
import useOnShakeRefresh from '@/hooks/useOnShakeRefresh';

export default function TournamentInfoScreen() {
    const { tournamentId, position } = useLocalSearchParams();
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';
    const router = useRouter();

    const [tournament, setTournament] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [leaderboard, setLeaderboard] = useState<{ position: number; name: string }[]>([]);



    const fetchTournament = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            if (!storedToken) {
                console.error('Token not found');
                return;
            }
            setToken(storedToken);

            const [tournamentRes, leaderboardRes] = await Promise.all([
                fetch(`${API_BASE_URL}/tournaments/${tournamentId}/info`),
                fetch(`${API_BASE_URL}/tournaments/${tournamentId}/leaderboard`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                        'Content-Type': 'application/json',
                    },
                }),
            ]);

            const tournamentData = await tournamentRes.json();
            const leaderboardData = await leaderboardRes.json();

            if (tournamentRes.ok) {
                setTournament(tournamentData);
            } else {
                console.warn('Tournament fetch error:', tournamentData.message);
            }

            if (leaderboardRes.ok) {
                setLeaderboard(leaderboardData);
            } else {
                console.warn('Leaderboard fetch error:', leaderboardData.message);
            }
        } catch (err) {
            console.warn('Error fetching tournament data:', err);
            router.replace("/errorScreen");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournament();
    }, [tournamentId]);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTournament();
        setRefreshing(false);
    };

    useOnShakeRefresh(onRefresh);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    } // TODO: add to every screen

    if (!tournament) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Failed to load tournament data.</Text>
            </View>
        );
    } //TODO: add error handling with animation and network error

    return (
        <>
            <SafeOfflineBanner />
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>
                {/* Image and Back Button */}
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: `${API_BASE_URL}/category/images/${tournament.category_image}?grayscale=${isBW}`,
                            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                        }}
                        style={styles.image}
                    />
                    <SafeAreaView style={styles.safeAreaBack}>
                        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>

                {/* Sheet */}
                <View style={styles.sheet}>
                    <View style={styles.swipeBar} />
                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{tournament.tournament_name}</Text>
                        {position && (
                            <Badge position={String(position)} />
                        )}
                    </View>

                    <Text style={styles.subtitle}>
                        {[
                            tournament.category_name,
                            tournament.level,
                            tournament.time,
                            tournament.game_setting,
                            tournament.tournament_structure,
                            `Entry fee: ` + tournament.entry_fee + `€`,
                            tournament.price_description,
                        ]
                            .filter(Boolean)
                            .join(' • ')}
                    </Text>
                    {/* TODO: add real data */}

                    <TournamentDescription
                        description={tournament.additional_info || ''}
                        isExpanded={isExpanded}
                        onToggle={() => setIsExpanded(prev => !prev)}
                    />

                    <Leaderboard data={leaderboard} />

                    {tournament.latitude && tournament.longitude && (
                        <MapPreview
                            latitude={tournament.latitude}
                            longitude={tournament.longitude}
                            tournamentName={tournament.tournament_name}
                        />
                    )}
                </View>
            </ScrollView>
        </>
    );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => {
    const isBW = theme.id === 'blackWhiteTheme';

    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.background,
        },
        scrollContent: {
            paddingBottom: 50,
        },
        imageContainer: {
            height: 280,
        },
        image: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
        },
        safeAreaBack: {
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            zIndex: 10,
        },
        backButton: {
            position: 'absolute',
            top: 16,
            left: 16,
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 10,
            borderRadius: 25,
        },
        sheet: {
            backgroundColor: theme.background,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            marginTop: -24,
            paddingHorizontal: 25,
            paddingTop: 20,
        },
        swipeBar: {
            width: 60,
            height: 5,
            backgroundColor: '#ccc',
            borderRadius: 2.5,
            alignSelf: 'center',
            marginBottom: 16,
        },
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 6,
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            color: theme.text,
            flex: 1,
            marginRight: 10,
        },
        subtitle: {
            fontSize: 12,
            color: '#666',
            marginBottom: 8,
            textAlign: 'justify',
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorText: {
            color: theme.text,
        },
    });
};