import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import API_BASE_URL from '@/config/config';
import { useTheme } from '@/themes/theme';
import SafeOfflineBanner from '@/components/offline/safeOfflineBanner';
import TournamentStats from '@/components/tournamentDetail/tournamentStats';
import StartButton from '@/components/startButton';
import MapPreview from '@/components/tournamentDetail/mapPreview';
import TournamentDescription from '@/components/tournamentDetail/tournamentDescription';

export default function ManageTournamentScreen() {
    const { tournamentId } = useLocalSearchParams();
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';

    const router = useRouter();

    const [tournament, setTournament] = useState<any>(null);
    const [teamsCount, setTeamsCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [enrolledTeams, setEnrolledTeams] = useState<any[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    const fetchTournament = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            if (!storedToken) {
                console.error('Token not found');
                return;
            }
            setToken(storedToken);

            const [tournamentRes, teamCountRes, enrolledRes] = await Promise.all([
                fetch(`${API_BASE_URL}/tournaments/${tournamentId}/info`),
                fetch(`${API_BASE_URL}/tournaments/${tournamentId}/teams/count`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                        "Content-Type": "application/json",
                    },
                }),
                fetch(`${API_BASE_URL}/tournaments/${tournamentId}/enrolled`, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                }),
            ]);

            const tournamentData = await tournamentRes.json();
            const teamCountData = teamCountRes.status !== 204 ? await teamCountRes.json() : [];
            const enrolledData = await enrolledRes.json();

            if (tournamentRes.ok) {
                setTournament(tournamentData);
            }

            if (teamCountRes.ok) {
                setTeamsCount(teamCountData[0]?.team_count ?? 0);
            } else {
                setTeamsCount(0);
            }

            if (enrolledRes.ok) {
                setEnrolledTeams(enrolledData);
            }

        } catch (err) {
            console.warn('Error fetching tournament data:', err);
            router.replace("/errorScreen");
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        try {
            const storedToken = await AsyncStorage.getItem('token');
            if (!storedToken) {
                Alert.alert("Unauthorized", "Token is missing.");
                return;
            }

            const res = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/start`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            // Send push notifications to users
            if (res.ok) {
                const notifyRes = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/notify-start`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                        'Content-Type': 'application/json',
                    }
                });
                const notifyData = await notifyRes.json();
                console.log("Notify response:", notifyRes.status, notifyData);

                if (!notifyRes.ok) {
                    Alert.alert("Warning", "Tournament started but users were not notified.");
                }
            } else {
                console.error("Start error:", data.message);
                Alert.alert("Error", data.message || "Failed to start tournament.");
            }
            router.replace(`/tournament/manage/${tournamentId}/dashboard`);
            Alert.alert("Success", "Tournament has started.");
        } catch (error) {
            console.error("Start exception:", error);
            Alert.alert("Error", "Something went wrong while starting the tournament.");
        }
    };

    useEffect(() => {
        fetchTournament();
    }, [tournamentId]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTournament();
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!tournament) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Failed to load tournament data.</Text>
            </View>
        );
    }

    return (
        <>
            <SafeOfflineBanner />
            <SafeAreaView style={styles.wrapper} edges={['bottom']}>
                <View style={styles.container}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.imageContainer}>
                            <Image
                                source={{
                                    uri: `${API_BASE_URL}/category/images/${tournament.category_image}?grayscale=${isBW}`,
                                    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
                                }}
                                style={styles.image}
                            />
                            <SafeAreaView style={styles.safeAreaBack}>
                                <TouchableOpacity style={styles.backButton} onPress={() => router.replace(`/events`)}>
                                    <Ionicons name="arrow-back" size={24} color="white" />
                                </TouchableOpacity>
                            </SafeAreaView>
                        </View>

                        <View style={styles.sheet}>
                            <View style={styles.swipeBar} />
                            <Text style={styles.title}>{tournament.tournament_name}</Text>
                            <Text style={styles.subtitle}>
                                {[
                                    tournament.category_name,
                                    tournament.level,
                                    tournament.time,
                                    tournament.game_setting,
                                    tournament.tournament_structure,
                                    `Entry fee: ${tournament.entry_fee}€`,
                                    tournament.price_description,
                                ]
                                    .filter(Boolean)
                                    .join(' • ')}
                            </Text>

                            <TournamentStats
                                teamsCount={teamsCount ?? 0}
                                teamSize={tournament.max_team_size}
                                date={tournament.date}
                            />

                            <TournamentDescription
                                description={tournament.additional_info || ''}
                                isExpanded={isExpanded}
                                onToggle={() => setIsExpanded(prev => !prev)}
                            />

                            <TouchableOpacity style={styles.editButton} onPress={() => router.replace(`/tournament/manage/${tournamentId}/edit`)}>
                                <Ionicons name="pencil" size={16} color="#000" style={{ marginRight: 8 }} />
                                <Text style={styles.editButtonText}>Edit tournament</Text>
                            </TouchableOpacity>

                            {/* Joined teams table */}
                            <Text style={styles.enrolledTitle}>Joined teams</Text>

                            <View style={styles.table}>
                                <View style={styles.tableRow}>
                                    <Text style={[styles.tableCell, styles.headerCell]}>Team name</Text>
                                    <Text style={[styles.tableCell, styles.headerCell]}>Members</Text>
                                </View>
                                {enrolledTeams.map((team: any, index: number) => (
                                    <View key={index} style={styles.tableRow}>
                                        <Text style={styles.tableCell}>{team.team_name}</Text>
                                        <Text style={styles.tableCell}>{team.number_of_members}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Map */}

                            {tournament.latitude && tournament.longitude && (
                                <MapPreview
                                    latitude={tournament.latitude}
                                    longitude={tournament.longitude}
                                    tournamentName={tournament.tournament_name}
                                />
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.buttonContainer}>
                        <StartButton title="START" onPress={handleStart} />
                    </View>
                </View>
            </SafeAreaView>
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
        wrapper: {
            flex: 1,
            backgroundColor: theme.background,
        },
        fixedButtonContainer: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            backgroundColor: theme.background,
            borderTopWidth: 1,
            borderTopColor: '#ccc',
        },
        scrollContent: {
            paddingBottom: 10,
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
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            color: theme.text,
            marginBottom: 6,
        },
        subtitle: {
            fontSize: 12,
            color: '#666',
            marginBottom: 8,
            textAlign: 'justify',
        },
        editButton: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isBW ? '#ccc' : '#F6D465',
            padding: 15,
            borderRadius: 20,
            width: '100%',
            alignSelf: 'center',
            marginTop: 12,
        },
        editButtonText: {
            color: '#000',
            fontWeight: 'bold',
            fontSize: 14,
        },
        sectionTitle: {
            marginTop: 20,
            fontWeight: 'bold',
            fontSize: 16,
            color: theme.text,
        },
        table: {
            borderWidth: 1,
            borderColor: theme.tableBorder,
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 20,
        },
        tableRow: {
            flexDirection: 'row',
            backgroundColor: theme.tableRow,
        },
        tableCell: {
            flex: 1,
            padding: 10,
            fontSize: 14,
            borderWidth: 1,
            borderColor: theme.tableBorder,
            color: theme.text,
        },
        headerCell: {
            fontWeight: 'bold',
            backgroundColor: theme.headerTable,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorText: {
            color: theme.text,
        },
        enrolledTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginTop: 20,
            marginBottom: 10,
            color: theme.text,
        },
        buttonContainer: {
            paddingHorizontal: 20,
            paddingBottom: 16,
            backgroundColor: theme.background,
        },
    });
};