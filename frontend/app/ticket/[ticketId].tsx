import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, Image, TouchableOpacity, Platform, RefreshControl, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import API_BASE_URL from '@/config/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '@/themes/theme';
import TournamentStats from '@/components/tournamentDetail/tournamentStats';
import TournamentDescription from '@/components/tournamentDetail/tournamentDescription';
import MapPreview from '@/components/tournamentDetail/mapPreview';
import SafeOfflineBanner from '@/components/offline/safeOfflineBanner';
import { formatDate } from '@/utils/formatDate';

//***** Web Sockets ******/
import io from 'socket.io-client';
import { useRef } from 'react';
//***** Web Sockets ******/

export default function TicketDetailScreen() {
    const socketRef = useRef<any>(null);

    const { ticketId } = useLocalSearchParams();
    const [loading, setLoading] = useState(true);
    const [ticket, setTicket] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [tournament, setTournament] = useState<any>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [teamsCount, setTeamsCount] = useState<number | null>(null);
    const [enrolledTeams, setEnrolledTeams] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const [qrModalVisible, setQrModalVisible] = useState(false);


    const fetchData = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const userId = await AsyncStorage.getItem("userId");

            setToken(token);

            // Fetch the ticket info
            const ticketRes = await fetch(`${API_BASE_URL}/users/${userId}/tickets/${ticketId}/qr`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const ticketData = await ticketRes.json();
            const ticketInfo = ticketData[0];
            setTicket(ticketInfo);

            console.log("Fetched ticketData:", ticketData);
            // If ticket is valid, fetch tournament + team count
            if (ticketInfo?.tournament_id) {
                const [tournamentRes, teamCountRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/tournaments/${ticketInfo.tournament_id}/info`),
                    fetch(`${API_BASE_URL}/tournaments/${ticketInfo.tournament_id}/teams/count`, {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }),
                ]);

                const tournamentData = await tournamentRes.json();
                const teamCountData = teamCountRes.status !== 204 ? await teamCountRes.json() : [];

                if (tournamentRes.ok) {
                    setTournament(tournamentData);
                }

                if (teamCountRes.ok) {
                    setTeamsCount(teamCountData[0]?.team_count ?? 0);
                } else {
                    setTeamsCount(0); // fallback for 204
                }
            }

            const enrolledRes = await fetch(`${API_BASE_URL}/tournaments/${ticketInfo.tournament_id}/enrolled`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const enrolledData = await enrolledRes.json();

            if (enrolledRes.ok) {
                setEnrolledTeams(enrolledData);
            } else {
                console.error("Failed to fetch enrolled teams:", enrolledData.message);
            }

        } catch (err) {
            console.warn("Falling back to cached data:", err);

            try {
                const cached = await AsyncStorage.getItem("cachedTickets");
                console.log(cached)
                if (!cached) return;

                const parsed = JSON.parse(cached);
                const cachedTicket = parsed.find((t: any) => String(t.id) === String(ticketId));

                if (cachedTicket) {
                    setTicket(cachedTicket.ticket);
                    setTournament(cachedTicket.tournament);
                    setTeamsCount(cachedTicket.teamsCount);
                    setEnrolledTeams(cachedTicket.enrolledTeams);
                } else {
                    console.error("Ticket not found in cache:", ticketId, cached);
                }
            } catch (cacheErr) {
                console.error("Failed to load from cache:", cacheErr);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [ticketId]);

    useEffect(() => {
        if (!ticket?.tournament_id) return;

        socketRef.current = io(API_BASE_URL, {
            transports: ['websocket'],
        });

        socketRef.current.emit('join_room', `tournament-${ticket.tournament_id}`);

        socketRef.current.on('enrolled_updated', (data: { tournament_id: string | number }) => {
            if (String(data.tournament_id) === String(ticket.tournament_id)) {
                console.log("📥 Real-time update received in TicketDetailScreen");
                fetchData();
            }
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [ticket?.tournament_id]);




    // Variable to store the theme styles
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
    }

    if (!ticket || !tournament) {
        return <View style={styles.centered}><Text>Failed to load data.</Text></View>;
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    return (
        <>
            <SafeOfflineBanner />
            <View style={{ flex: 1 }}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{
                            uri: tournament.localCategoryImage || `${API_BASE_URL}/category/images/${tournament.category_image}?grayscale=${isBW}`,
                            ...(tournament.localCategoryImage
                                ? {}
                                : token
                                    ? { headers: { Authorization: `Bearer ${token}` } }
                                    : {}),
                        }}
                        style={styles.image}
                    />
                    <SafeAreaView style={styles.safeAreaBack}>
                        <TouchableOpacity style={styles.backButton} onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.replace("/(tabs)/home");
                            }
                        }}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>

                <ScrollView style={styles.sheet}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.scrollViewContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    {/* White Sheet */}

                    < View style={styles.swipeBar} />
                    <View style={styles.qrWrapper}>
                        <TouchableOpacity onPress={() => setQrModalVisible(true)}>
                            <QRCode
                                value={ticket.ticket}
                                size={180}
                                backgroundColor={theme.background}
                                color={theme.qrCode}
                            />
                        </TouchableOpacity>
                    </View>

                    {qrModalVisible && (
                        <Modal
                            transparent
                            visible={qrModalVisible}
                            animationType="fade"
                            onRequestClose={() => setQrModalVisible(false)}
                        >
                            <TouchableOpacity
                                style={styles.modalBackground}
                                onPress={() => setQrModalVisible(false)}
                                activeOpacity={1}
                            >
                                <View style={styles.modalContent}>
                                    <QRCode
                                        value={ticket.ticket}
                                        size={300}
                                        backgroundColor={theme.background}
                                        color={theme.qrCode}
                                    />
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    )}



                    <Text style={styles.qrTitle}>Code for other members:</Text>
                    <TouchableOpacity
                        onPress={async () => {
                            try {
                                await Clipboard.setStringAsync(ticket.code);
                                Toast.show({
                                    type: 'success',
                                    text1: 'Code copied!',
                                    position: 'top',
                                    visibilityTime: 1500,
                                });
                                console.log('Code copied to clipboard:', ticket.code);
                            } catch (error) {
                                console.error('Clipboard operation failed:', error);
                            }
                        }}
                    >
                        <Text style={styles.teamCodeCopy}>{ticket.code}</Text>
                    </TouchableOpacity>

                    <View style={styles.headerRow}>
                        <Text style={styles.title}>{tournament.tournament_name}</Text>
                        <Text style={styles.joinedText}>{teamsCount ?? "0"} joined</Text>
                    </View>

                    <Text style={styles.dateUnderTitle}>{formatDate(tournament.date)}</Text>

                    {/* Stats */}
                    <TournamentStats
                        teamsCount={teamsCount ?? 0}
                        teamSize={tournament.max_team_size}
                        date={tournament.date}
                    />

                    {/* Description */}
                    <TournamentDescription
                        description={tournament.additional_info || 'No description available.'}
                        isExpanded={isExpanded}
                        onToggle={() => setIsExpanded(prev => !prev)}
                    />

                    {tournament.latitude && tournament.longitude && (
                        <MapPreview
                            latitude={tournament.latitude}
                            longitude={tournament.longitude}
                            tournamentName={tournament.tournament_name}
                        />
                    )}

                    <Text style={styles.enrolledTitle}>Enrolled Teams</Text>
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
                </ScrollView >
            </View >
        </>
    );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => {
    const isBW = theme.id === 'blackWhiteTheme';

    return StyleSheet.create({
        scrollViewContent: {
            backgroundColor: theme.background,
            paddingBottom: 50,
        },
        centered: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        joinedText: {
            color: isBW ? '#eee' : '#007AFF',
            fontSize: 13,
        },
        enrolledTitle: {
            fontSize: 18,
            fontWeight: 'bold',
            marginBottom: 10,
            color: theme.text,
        },
        table: {
            borderWidth: 1,
            borderColor: theme.tableBorder,
            borderRadius: 8,
            overflow: 'hidden',
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

        //this is from other file
        imageContainer: {
            position: 'relative',
            height: 150,
            zIndex: 1,
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
            position: 'relative',
            zIndex: 2,
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
        safeAreaBack: {
            position: 'absolute',
            top: 50,
            left: 0,
            right: 0,
        },
        dateUnderTitle: {
            fontSize: 13,
            color: '#999',
            marginBottom: 6,
        },
        qrWrapper: {
            alignItems: 'center',
            marginVertical: 20,
        },
        qrTitle: {
            textAlign: "center",
            marginTop: 5,
            color: theme.text,
        },
        teamCodeCopy: {
            fontSize: 20,
            fontWeight: '600',
            color: isBW ? '#fff' : '#007AFF',
            textDecorationLine: isBW ? 'underline' : 'none',
            textAlign: 'center',
            marginVertical: 10,
        },
        modalBackground: {
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.9)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContent: {
            backgroundColor: theme.background,
            padding: 20,
            borderRadius: 20,
        },

    });
};
