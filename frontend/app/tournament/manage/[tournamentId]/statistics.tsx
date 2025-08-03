import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DropDownPicker from 'react-native-dropdown-picker';
import StartButton from '@/components/startButton';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import API_BASE_URL from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/themes/theme';
import { useNavigation } from '@react-navigation/native';

function getOrdinal(n: number) {
    const s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

export default function EditLeaderboardScreen() {
    // states for dropdown
    const { tournamentId, t_status } = useLocalSearchParams(); // Get tournamentId from URL params
    console.log('Status:', t_status);
    const [status, setStatus] = useState(() => {
        return t_status === 'Ongoing' || t_status === 'Closed' ? t_status : 'Ongoing';
    });
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([
        { label: 'Ongoing', value: 'Ongoing' },
        { label: 'Closed', value: 'Closed' },
    ]);

    // keeps information about which input is focused and their references
    const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
    const inputRefs = useRef<(TextInput | null)[]>([]);

    // variables for team names and suggestions
    const [joinedTeams, setJoinedTeams] = useState<{ id: number; team_name: string }[]>([]);
    const [teamInputs, setTeamInputs] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<{ id: number; team_name: string }[]>([]);

    const navigation = useNavigation();

    useEffect(() => {
        const fetchData = async () => {
            const storedToken = await AsyncStorage.getItem('token');
            if (!storedToken) {
                console.error('Token not found');
                return;
            }
            try {
                // Fetch enrolled teams
                const enrolledRes = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/enrolled`, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                });

                // Fetch existing leaderboard
                const leaderboardRes = await fetch(`${API_BASE_URL}/tournaments/${tournamentId}/leaderboard`, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                });

                if (!enrolledRes.ok || !leaderboardRes.ok) {
                    throw new Error('Failed to fetch data');
                }

                const enrolledData = await enrolledRes.json();
                const leaderboardData = await leaderboardRes.json();

                const teams = enrolledData;
                setJoinedTeams(teams);
                setSuggestions(teams);

                // Create a map from team ID to name for easier lookup.
                const teamMap = Object.fromEntries(teams.map((t: { id: number; team_name: string }) => [t.id, t.team_name]));
                console.log('Team Map:', teamMap);

                const prefilledInputs: string[] = new Array(teams.length).fill('');
                leaderboardData.forEach((entry: any) => {
                    const teamName = teamMap[entry.team_id];
                    if (teamName) {
                        prefilledInputs[entry.position - 1] = teamName;
                    }
                });

                setTeamInputs(prefilledInputs);

            } catch (err) {
                console.warn('Error loading leaderboard data:', err);
            }
        };

        if (tournamentId) fetchData();
    }, [tournamentId]);


    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';

    const handleSubmit = async () => {
        const token = await AsyncStorage.getItem('token');
        if (!token) {
            console.error('Token not found');
            return;
        }

        try {
            // Update tournament status first
            let statusEndpoint = '';
            if (status === 'Ongoing') {
                statusEndpoint = `${API_BASE_URL}/tournaments/${tournamentId}/start`;
            } else if (status === 'Closed') {
                statusEndpoint = `${API_BASE_URL}/tournaments/${tournamentId}/stop`;
            }

            if (statusEndpoint) {
                const statusRes = await fetch(statusEndpoint, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!statusRes.ok) {
                    const errText = await statusRes.text();
                    console.error(`Failed to update tournament status. Status: ${statusRes.status}, Response: ${errText}`);
                    return;
                }

                console.log(`Tournament status updated to ${status}`);
            }

            // Map team names to their IDs
            const teamNameToId = Object.fromEntries(joinedTeams.map(team => [team.team_name, team.id]));
            console.log('Team Name to ID Map:', teamNameToId);

            const requests = teamInputs.map((name, index) => {
                const trimmedName = name.trim();
                const teamId = teamNameToId[trimmedName];
                const position = index + 1;

                if (!trimmedName || !teamId) {
                    // DELETE request for empty inputs
                    return fetch(`${API_BASE_URL}/tournaments/leaderboard/remove`, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            tournament_id: tournamentId,
                            position: position,
                        }),
                    });
                }

                // POST to add/update
                return fetch(`${API_BASE_URL}/tournaments/leaderboard/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        tournament_id: tournamentId,
                        team_id: teamId,
                        position: position,
                    }),
                });
            });

            const results = await Promise.all(requests);

            results.forEach((res, i) => {
                if (!res.ok) {
                    console.warn(`Request at index ${i} failed with status ${res.status}`);
                }
            });

            const failed = results.filter(res => res && !res.ok);

            if (failed.length > 0) {
                console.error(`${failed.length} records failed to submit.`);
            } else {
                console.log('Leaderboard updated successfully');
                // router.replace(`/tournament/manage/${tournamentId}/dashboard`);
                navigation.reset({
                    index: 0,
                    routes: [
                        {
                            name: 'tournament/manage/[tournamentId]/dashboard' as never,
                            params: { tournamentId },
                        },
                    ],
                });
            }

        } catch (error) {
            console.error('Submission error:', error);
        }
    };

    const renderContent = () => (
        <>
            <View style={styles.headerRow}>
                <TouchableOpacity onPress={() => router.replace(`/tournament/manage/${tournamentId}/dashboard`)} style={{ marginRight: 20 }}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.header}>Edit Leaderboard</Text>
            </View>

            {
                joinedTeams.map((team, index) => {
                    if (focusedIndex !== null && focusedIndex !== index) return null;

                    const isFocused = focusedIndex === index;
                    const isEmpty = teamInputs[index] === '';

                    return (
                        <View
                            key={team.id}
                            style={[
                                styles.row,
                                {
                                    backgroundColor: isBW
                                        ? index === 0
                                            ? '#E5E7EB'  // 1st place — lightest gray
                                            : index === 1
                                                ? '#D1D5DB'  // 2nd place
                                                : index === 2
                                                    ? '#6B7280'  // 3rd place
                                                    : '#4B5563'  // others — darkest
                                        : index === 0
                                            ? '#FBBF24'
                                            : index === 1
                                                ? '#FACC15'
                                                : index === 2
                                                    ? '#FDE68A'
                                                    : '#FEF3C7'
                                }
                            ]}
                        >
                            <Text style={styles.rankText}>{`${index + 1}${getOrdinal(index + 1)}`}</Text>

                            <TextInput
                                ref={(ref) => { inputRefs.current[index] = ref; }}
                                style={styles.input}
                                value={teamInputs[index] || ''}
                                onChangeText={(text) => {
                                    const updated = [...teamInputs];
                                    updated[index] = text;
                                    setTeamInputs(updated);

                                    const filtered = joinedTeams
                                        .filter(t =>
                                            t.team_name.toLowerCase().includes(text.toLowerCase()) &&
                                            !teamInputs.includes(t.team_name)
                                        );
                                    setSuggestions(filtered);
                                }}
                                onFocus={() => {
                                    setFocusedIndex(index);
                                    const filtered = joinedTeams.filter(t =>
                                        !teamInputs.includes(t.team_name) || t.team_name === teamInputs[index]
                                    );
                                    setSuggestions(filtered);
                                }}
                                onBlur={() => {
                                    const entered = teamInputs[index]?.trim();
                                    const isValid = joinedTeams.some(t => t.team_name === entered);

                                    if (!isValid) {
                                        const updated = [...teamInputs];
                                        updated[index] = '';
                                        setTeamInputs(updated);
                                    }

                                    setFocusedIndex(null);
                                }}
                                onPress={() => {
                                    if (!isEmpty) {
                                        const updated = [...teamInputs];
                                        updated[index] = '';
                                        setTeamInputs(updated);
                                    } else {
                                        setFocusedIndex(index);
                                        setTimeout(() => {
                                            inputRefs.current[index]?.focus();
                                        }, 0);
                                    }
                                }}
                                placeholder={isFocused ? 'Enter team name' : ''}
                                placeholderTextColor="#999"
                            />

                            {isFocused ? (
                                <TouchableOpacity
                                    onPress={() => {
                                        inputRefs.current[index]?.blur();
                                    }}
                                    style={{ marginLeft: 10 }}
                                >
                                    <Ionicons name="send-sharp" size={24} color="#000" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => {
                                        if (!isEmpty) {
                                            const updated = [...teamInputs];
                                            updated[index] = '';
                                            setTeamInputs(updated);
                                        } else {
                                            setFocusedIndex(index);
                                            setTimeout(() => {
                                                inputRefs.current[index]?.focus();
                                            }, 0);
                                        }
                                    }}
                                    style={{ marginLeft: 10 }}
                                >
                                    <Ionicons
                                        name={isEmpty ? 'add-circle-outline' : 'remove-circle-outline'}
                                        size={24}
                                        color="#000"
                                    />
                                </TouchableOpacity>
                            )}

                            {isFocused && suggestions.length > 0 && (
                                <View style={styles.suggestionBox}>
                                    {suggestions.map((suggestedTeam) => (
                                        <TouchableOpacity
                                            key={suggestedTeam.id}
                                            onPress={() => {
                                                const updated = [...teamInputs];
                                                updated[index] = suggestedTeam.team_name;
                                                setTeamInputs(updated);
                                                inputRefs.current[index]?.blur();
                                                setFocusedIndex(null);
                                            }}
                                            style={styles.suggestionItem}
                                        >
                                            <Text style={styles.suggestionText}>{suggestedTeam.team_name}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                        </View>
                    );
                })
            }
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                    keyboardVerticalOffset={60}
                >
                    {focusedIndex === null ? (
                        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
                            {renderContent()}
                        </ScrollView>
                    ) : (
                        <View style={styles.scrollContainer}>
                            {renderContent()}
                        </View>
                    )}
                </KeyboardAvoidingView>

                <View style={[styles.buttonContainer, { paddingBottom: 16 }]}>
                    <View style={styles.dropdownWrapper}>
                        <Text style={styles.statusLabel}>Change status</Text>
                        <DropDownPicker
                            open={open}
                            value={status}
                            items={items}
                            setOpen={setOpen}
                            setValue={setStatus}
                            setItems={setItems}
                            placeholder="Select status"
                            containerStyle={{ zIndex: 1000 }}
                            dropDownContainerStyle={{
                                backgroundColor: theme.inputBackground,
                                borderColor: theme.inputBorder,
                            }}
                            placeholderStyle={{
                                color: theme.text,
                            }}
                            style={{ backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }}
                            textStyle={{ color: theme.text, }}
                            ArrowDownIconComponent={() => <Ionicons name="chevron-down" size={20} color={theme.text} />}
                            ArrowUpIconComponent={() => <Ionicons name="chevron-up" size={20} color={theme.text} />}
                            TickIconComponent={() => <Ionicons name="checkmark" size={20} color={theme.text} />}
                        />
                    </View>
                    <StartButton title="SAVE" onPress={handleSubmit} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background
    },
    scrollContainer: {
        paddingHorizontal: 20,
        paddingBottom: 40
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        marginVertical: 20,
        color: theme.text,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
        paddingTop: 12,
        borderRadius: 12,
        marginVertical: 6,
    },
    rankText: { fontSize: 18, fontWeight: 'bold' },
    plusIcon: { fontSize: 20, fontWeight: 'bold' },
    dropdownWrapper: {
        marginTop: 30,
        zIndex: 10,
    },
    statusLabel: {
        fontSize: 14,
        color: theme.text,
        marginBottom: 8,
    },
    buttonContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.background,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        backgroundColor: 'transparent',
        padding: 8,
        borderRadius: 8,
    },
    suggestionBox: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: theme.background,
        borderRadius: 8,
        paddingVertical: 4,
        marginTop: 25,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 999,
        borderWidth: 0.5,
        borderColor: '#ddd',
    },
    suggestionItem: {
        paddingVertical: 14,
        paddingHorizontal: 12,
    },
    suggestionText: {
        fontSize: 14,
        color: theme.text,
    },
});