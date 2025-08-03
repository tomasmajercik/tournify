import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, TextInput, Alert, RefreshControl } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import API_BASE_URL from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/themes/theme';
import TournamentStats from '@/components/tournamentDetail/tournamentStats';
import TournamentDescription from '@/components/tournamentDetail/tournamentDescription';
import MapPreview from '@/components/tournamentDetail/mapPreview';
import SafeOfflineBanner from '@/components/offline/safeOfflineBanner';
import { formatDate } from '@/utils/formatDate';
import useOnShakeRefresh from '@/hooks/useOnShakeRefresh';

export default function TournamentDetailScreen() {
    const { tournamentId } = useLocalSearchParams();
    const [tournament, setTournament] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [teamsCount, setTeamsCount] = useState<number | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const [selectedOption, setSelectedOption] = useState<"new" | "existing" | null>(null);
    const [teamInput, setTeamInput] = useState("");

    const router = useRouter();

    const handleContinue = async () => {
        if (!selectedOption || !teamInput || !token) return;

        const endpoint = selectedOption === "new"
            ? `${API_BASE_URL}/tournaments/${tournamentId}/register`
            : `${API_BASE_URL}/tournaments/${tournamentId}/join_team`;

        const payload = selectedOption === "new"
            ? { team_name: teamInput.trim() }
            : { code: teamInput.trim() };

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                console.log("Success:", data);
                router.replace({
                    pathname: "/ticket/[ticketId]",
                    params: { ticketId: data.ticketId.toString() },
                });
            } else if (response.status === 400) {
                console.warn("Bad Request:", data.message);
                Alert.alert("Error", data.message);
            } else {
                console.warn("Error:", data.message);
            }
        } catch (error) {
            console.warn("Request failed:", error);
        }
    };

    // Fetch tournament data

    const fetchTournament = async () => {
        try {
            const storedToken = await AsyncStorage.getItem("token");
            setToken(storedToken);

            const [tournamentRes, teamCountRes] = await Promise.all([
                fetch(`${API_BASE_URL}/tournaments/${tournamentId}/info`),
                fetch(`${API_BASE_URL}/tournaments/${tournamentId}/teams/count`, {
                    headers: {
                        Authorization: `Bearer ${storedToken}`,
                        "Content-Type": "application/json",
                    },
                }),
            ]);

            const tournamentData = await (tournamentRes as Response).json() as { message?: string;[key: string]: any };
            const teamCountData = (teamCountRes as Response).status !== 204 ? await (teamCountRes as Response).json() : {};

            if ((tournamentRes as Response).ok) {
                setTournament(tournamentData);
            } else {
                console.warn('Tournament fetch error:', tournamentData.message);
            }

            if ((teamCountRes as Response).ok) {
                setTeamsCount(teamCountData[0]?.team_count ?? 0);
            } else {
                console.warn('Team count fetch error:', teamCountData.message);
            }
        } catch (err) {
            console.warn('Error fetching tournament:', err);
            router.replace("/errorScreen");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournament();
    }, [tournamentId]);

    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';

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
                <Text>Failed to load tournament data.</Text>
            </View>
        );
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTournament();
        setRefreshing(false);
    };

    return (
        <>
            <SafeOfflineBanner />
            <KeyboardAwareScrollView
                style={styles.container}
                contentContainerStyle={{ flexGrow: 1 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid
                extraScrollHeight={40} // Pushes the input above the keyboard
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Image and Back Button */}
                <ScrollView style={styles.container}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.container}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
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
                            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                                <Ionicons name="arrow-back" size={24} color="white" />
                            </TouchableOpacity>
                        </SafeAreaView>
                    </View>

                    {/* White Sheet */}
                    <View style={styles.sheet}>
                        <View style={styles.swipeBar} />

                        <View style={styles.headerRow}>
                            <Text style={styles.title}>{tournament.tournament_name}</Text>
                        </View>

                        <Text style={styles.dateUnderTitle}>{formatDate(tournament.date)}</Text>

                        {/* Stats */}
                        <TournamentStats
                            teamsCount={teamsCount ?? 0}
                            teamSize={tournament.max_team_size}
                            date={tournament.date}
                        />

                        <Text style={styles.subtitle}>
                            {[
                                tournament.level,
                                tournament.game_setting,
                                `Entry fee: ` + tournament.entry_fee + `€`,
                                `Price: ` + tournament.prize_description,
                            ]
                                .filter(Boolean)
                                .join(' • ')}
                        </Text>

                        {/* Description */}
                        <TournamentDescription
                            description={tournament.additional_info || 'No description available.'}
                            isExpanded={isExpanded}
                            onToggle={() => setIsExpanded(prev => !prev)}
                        />

                        {/* Team Selection Buttons*/}
                        <View style={styles.teamButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.teamButton,
                                    selectedOption === "new" && styles.teamButtonSelected,
                                ]}
                                onPress={() => setSelectedOption("new")}
                            >
                                <Text
                                    style={selectedOption === "new" ? styles.teamButtonTextSelected : styles.teamsButtonText}
                                >
                                    New Team
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.teamButton,
                                    selectedOption === "existing" && styles.teamButtonSelected,
                                ]}
                                onPress={() => setSelectedOption("existing")}
                            >
                                <Text style={selectedOption === "existing" ? styles.teamButtonTextSelected : styles.teamsButtonText}>
                                    Existing Team
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Input Field */}
                        {selectedOption && (
                            <View style={styles.inputSection}>
                                <Text style={styles.inputLabel}>
                                    {selectedOption === "new" ? "Team name" : "Team code"}
                                </Text>
                                <View style={styles.inputBox}>
                                    <TextInput
                                        placeholder={
                                            selectedOption === "new"
                                                ? "Enter your team name"
                                                : "Enter your team code"
                                        }
                                        placeholderTextColor="#888"
                                        value={teamInput}
                                        onChangeText={setTeamInput}
                                        style={styles.inputText}
                                    />
                                    <Ionicons
                                        name={selectedOption === "new" ? "person-add-outline" : "key-outline"}
                                        size={20}
                                        color="#666"
                                    />
                                </View>
                            </View>
                        )}

                        {tournament.latitude && tournament.longitude && (
                            <MapPreview
                                latitude={tournament.latitude}
                                longitude={tournament.longitude}
                                tournamentName={tournament.tournament_name}
                            />
                        )}

                        {/* Legal Text */}
                        <Text style={styles.legalText}>
                            By clicking the Continue button, you agree to the collection and processing of your personal
                            data for the purpose of tournament registration and management, in accordance with our Privacy Policy.
                        </Text>

                        {/* Continue Button */}
                        <TouchableOpacity
                            style={[
                                styles.continueButton,
                                !selectedOption && styles.continueButtonDisabled,
                            ]}
                            disabled={!selectedOption}
                            onPress={handleContinue}
                        >
                            <Text style={styles.continueText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAwareScrollView >
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
        imageContainer: {
            position: 'relative',
            height: 280,
        },
        image: {
            width: '100%',
            height: '100%',
            resizeMode: 'cover',
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
            paddingBottom: 40,
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
            marginBottom: 5,
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
            color: theme.text,
            flexShrink: 1,
        },
        statsRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginVertical: 24,
        },
        stat: {
            alignItems: 'center',
            flex: 1,
        },
        statNumber: {
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.text,
        },
        statLabel: {
            fontSize: 13,
            color: '#666',
            marginTop: 4,
        },
        description: {
            fontSize: 14,
            color: theme.descriptionText,
            marginBottom: 30,
            textAlign: 'justify',
            lineHeight: 20,
            marginTop: 8,
        },
        readMoreInline: {
            fontWeight: 'bold',
            marginLeft: 4,
            textDecorationLine: 'underline',
        },
        readMoreMore: {
            color: '#007AFF', // blue
        },
        readMoreLess: {
            color: '#999', // gray
        },
        teamButtons: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 24,
            color: theme.text,
        },
        teamButton: {
            flex: 0.48,
            backgroundColor: theme.teamButton,
            paddingVertical: 12,
            borderRadius: 12,
            alignItems: 'center',
        },
        legalText: {
            fontSize: 12,
            color: '#999',
            marginBottom: 20,
            textAlign: 'justify',
            lineHeight: 18,
        },
        continueButton: {
            backgroundColor: isBW ? '#bbb' : '#38b381',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
        },
        continueButtonDisabled: {
            backgroundColor: isBW ? 'rgba(187, 187, 187, 0.4)' : 'rgba(56, 179, 129, 0.4)'
        },
        continueText: {
            color: '#fff',
            fontWeight: 'bold',
            fontSize: 16,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        safeAreaBack: {
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
            zIndex: 10,
        },
        dateUnderTitle: {
            fontSize: 13,
            color: '#999',
            marginBottom: 6,
        },
        // Input styles
        inputSection: {
            marginBottom: 24,
        },
        inputLabel: {
            fontSize: 14,
            color: "#444",
            marginBottom: 6,
        },
        inputBox: {
            backgroundColor: theme.inputBackground,
            borderWidth: 1,
            borderColor: theme.inputBorder,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
        },
        teamButtonSelected: {
            backgroundColor: isBW ? "#888" : "#38b381",
        },
        teamButtonTextSelected: {
            color: "#fff",
            fontWeight: "bold",
        },
        icons: {
            color: theme.text,
        },
        teamsButtonText: {
            color: theme.text,
        },
        inputText: {
            flex: 1,
            color: theme.text,
        },
        subtitle: {
            fontSize: 12,
            color: '#666',
            marginBottom: 8,
            textAlign: 'justify',
        },
    });
};
