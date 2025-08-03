import API_BASE_URL from "@/config/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, View, StyleSheet, ScrollView, FlatList, Image, NativeSyntheticEvent, NativeScrollEvent, Dimensions, RefreshControl, TouchableOpacity } from "react-native";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import TicketCard from "@/components/home/ticketCard";
import HistoryCard from "@/components/home/historyCard";
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from "@/themes/theme";
import { router } from "expo-router";
import OfflineBanner from "@/components/offline/offlineBanner";
import TournamentView from "@/components/explore/tournamentView";
import { cacheAllTickets } from "@/utils/cacheTickets";
import { useOnShakeRefresh } from '@/hooks/useOnShakeRefresh';
import useLocation from '@/hooks/useLocation';

export default function HomeScreen() {

    interface UserInfo {
        first_name: string;
        last_name: string;
        preferred_location: string;
        image_path: string | null;
    }
    interface TopPick {
        tournament_name: string;
        date: string;
        distance: number;
        category_image: string;
        id: string;
        latitude: number;
        longitude: number;
    }
    interface Ticket {
        date: string;
        category_image: string;
        id: string;
        local_image?: string;
    }
    interface HistoryItem {
        id: string;
        tournament_name: string;
        date: string;
        position: number;
        category_image: string;
    }

    const { latitude, longitude, error, getUserLocation } = useLocation();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [topPicks, setTopPicks] = useState<TopPick[]>([]);
    const [token, setToken] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);

    const isFocused = useIsFocused(); //automatically updates when the screen is focused

    const fetchData = async () => {
        try {
            const storedToken = await AsyncStorage.getItem("token");
            const storedUserId = await AsyncStorage.getItem("userId");

            if (!storedUserId || !storedToken) return;

            setToken(storedToken);

            // Fetch Top Picks
            const topPicksResponse = await fetch(`${API_BASE_URL}/users/${storedUserId}/top-picks`, {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                    "Content-Type": "application/json",
                },
            });
            const topPicksData = await topPicksResponse.json();
            if (topPicksResponse.ok) {
                setTopPicks(topPicksData);
            } else {
                console.warn("Top Picks error:", topPicksData.message);
            }

            // Fetch User Info
            const userInfoResponse = await fetch(`${API_BASE_URL}/users/${storedUserId}/info`, {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                    "Content-Type": "application/json",
                },
            });
            const userInfoData = await userInfoResponse.json();
            if (userInfoResponse.ok) {
                setUserInfo(userInfoData);
            } else {
                console.warn("User Info error:", userInfoData.message);
            }

            // Fetch Tickets
            const ticketsResponse = await fetch(`${API_BASE_URL}/users/${storedUserId}/tickets`, {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                    "Content-Type": "application/json",
                },
            });

            const ticketsData = await ticketsResponse.json();
            if (ticketsResponse.ok) {
                setTickets(ticketsData);
            } else {
                console.warn("Tickets error:", ticketsData.message);
            }

            // Fetch History
            const historyResponse = await fetch(`${API_BASE_URL}/users/${storedUserId}/tournaments/history`, {
                headers: {
                    Authorization: `Bearer ${storedToken}`,
                    "Content-Type": "application/json",
                },
            });

            const historyData = await historyResponse.json();
            console.log("History Data:", historyData);
            if (historyResponse.ok) {
                setHistory(historyData);
            } else {
                console.warn("History error:", historyData.message);
            }

            // Cache Tickets for Offline use
            await cacheAllTickets();

        } catch (err) {
            console.warn("Failed to load home screen data:", err);
            await loadTicketsFromCache();
        }
    };

    const loadTicketsFromCache = async () => {
        try {
            const cached = await AsyncStorage.getItem("cachedTickets");
            if (!cached) {
                console.warn("No cached tickets found.");
                return;
            }

            const parsed = JSON.parse(cached);

            const normalizedTickets = parsed
                .filter((entry: any) => entry.ticket && entry.tournament)
                .map((entry: any) => ({
                    id: entry.id,
                    date: entry.tournament.date,
                    category_image: entry.tournament.category_image,
                    local_image: entry.tournament.localCategoryImage,
                }));

            setTickets(normalizedTickets);
            console.log("Loaded tickets from cache.");
        } catch (cacheErr) {
            console.warn("Failed to load tickets from cache:", cacheErr);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        getUserLocation();
    }, []);


    // Refresh control for pull-to-refresh
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchData();
        setRefreshing(false);
    };

    useOnShakeRefresh(onRefresh);

    // Refetch when screen is focused
    useEffect(() => {
        if (isFocused) {
            fetchData();
        }
    }, [isFocused]);

    const screenWidth = Dimensions.get('window').width;
    const CARD_WIDTH = screenWidth * 0.95;
    const CARD_GAP = 16;
    const [activeIndex, setActiveIndex] = useState(0); // State to track the active index of the FlatList
    const flatListRef = useRef<FlatList>(null);
    const isLargeScreen = useMemo(() => screenWidth >= 768, [screenWidth]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
        setActiveIndex(index);
    }; // Function to handle the scroll event and update the active index

    // Variable to store the theme styles
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme, isLargeScreen), [theme, isLargeScreen]);
    const isBW = theme.id === 'blackWhiteTheme';

    const chunkArray = <T,>(array: T[], size: number): T[][] => {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    };

    const topPickPairs = chunkArray(topPicks, isLargeScreen ? 2 : 1);

    return (
        <SafeAreaView
            style={styles.safeArea}
            edges={['top', 'left', 'right']}
        >
            <OfflineBanner />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <TouchableOpacity
                    style={styles.profileRow}
                    onPress={() =>
                        router.push("/profileScreen")
                    }
                >
                    <View style={styles.header}>
                        <View style={styles.profileRow}>
                            <Image
                                source={
                                    userInfo && userInfo.image_path !== "null" && userInfo.image_path && token
                                        ? {
                                            uri: `${API_BASE_URL}/uploads/${userInfo.image_path}?grayscale=${isBW}`,
                                            headers: {
                                                Authorization: `Bearer ${token}`,
                                            },
                                        }
                                        : require("@/assets/images/default-profile.jpg")
                                }
                                style={styles.avatar}
                                onError={(error) => {
                                    console.log("Image failed to load:", error.nativeEvent.error);
                                }}
                            />
                            <View>
                                <Text style={styles.name}>
                                    {userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : "Loading..."}
                                </Text>
                                <Text style={styles.level}>{userInfo?.preferred_location}</Text>
                            </View>
                        </View>

                    </View>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>Top Picks</Text>
                {topPicks.length > 0 ? (
                    <FlatList
                        data={topPickPairs}
                        keyExtractor={(_, index) => `pair-${index}`}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        pagingEnabled
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        renderItem={({ item: pair }) => (
                            <View style={styles.topPicksRow}>
                                {pair.map((item) => (
                                    <View key={item.id} style={styles.topPicksCardSideBySide}>
                                        <TournamentView
                                            title={item.tournament_name}
                                            date={item.date}
                                            imageUrl={{ uri: `${API_BASE_URL}/category/images/${item.category_image}` }}
                                            tournamentId={item.id}
                                            lat={item.latitude}
                                            lon={item.longitude}
                                            userLat={latitude}
                                            userLon={longitude}
                                            defaultDistance={item.distance}
                                            type="detail"
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                    />

                ) : (
                    <Text style={styles.emptyText}>No top picks found.</Text>
                )}
                <View style={styles.dotsContainer}>
                    {topPickPairs.map((_, index) => (
                        <Text
                            key={index}
                            style={[
                                styles.dot,
                                index === activeIndex ? styles.activeDot : styles.inactiveDot,
                            ]}
                        >
                            ●
                        </Text>
                    ))}
                </View>

                {/* Tickets */}
                <Text style={styles.sectionTitle}>Tickets</Text>
                {tickets.length > 0 ? (
                    <ScrollView
                        contentContainerStyle={styles.horizontalList}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        {tickets.map((ticket) => (
                            <TicketCard
                                key={ticket.id}
                                ticketId={ticket.id}
                                date={ticket.date}
                                imageUrl={{
                                    uri: ticket.local_image || `${API_BASE_URL}/category/images/${ticket.category_image}?grayscale=${isBW}`,
                                    ...(ticket.local_image
                                        ? {}
                                        : token
                                            ? { headers: { Authorization: `Bearer ${token}` } }
                                            : {}),
                                }}
                            />
                        ))}
                    </ScrollView>
                ) : (
                    <Text style={styles.emptyText}>You have no tickets yet.</Text>
                )}
                {/* History */}
                <View style={styles.sectionRow}>
                    <Text style={styles.historyTitle}>History</Text>
                    {history.length > 0 && (
                        <TouchableOpacity onPress={() => router.push("/historyScreen")}>
                            <Text style={styles.viewAll}>View All</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {history.length > 0 ? (
                    <FlatList
                        data={history}
                        keyExtractor={(item) => item.id}
                        numColumns={isLargeScreen ? 2 : 1}
                        scrollEnabled={false}
                        columnWrapperStyle={isLargeScreen ? styles.historyColumnWrapper : undefined}
                        renderItem={({ item }) => (
                            <View style={styles.historyCardWrapper}>
                                <HistoryCard
                                    title={item.tournament_name}
                                    date={item.date}
                                    position={item.position ? formatPosition(item.position) : null}
                                    imageUrl={{
                                        uri: `${API_BASE_URL}/category/images/${item.category_image}?grayscale=${isBW}`,
                                        headers: { Authorization: `Bearer ${token}` },
                                    }}
                                    onInfoPress={() => router.push(
                                        `/history/${item.id}?position=${encodeURIComponent(item.position ? formatPosition(item.position) : '')}`
                                    )}
                                />
                            </View>
                        )}
                    />
                ) : (
                    <Text style={styles.emptyText}>No tournament history yet!</Text>
                )}

            </ScrollView>
        </SafeAreaView>
    );

}

const formatPosition = (n: number) => { // Generated by OpenAI
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    const position = n + (s[(v - 20) % 10] || s[v] || s[0])
    return `${position} place`;
};

const getStyles = (theme: ReturnType<typeof useTheme>, isLargeScreen: boolean) => {
    const isBW = theme.id === 'blackWhiteTheme';
    return StyleSheet.create({
        safeArea: {
            backgroundColor: theme.background,
            minHeight: '100%',
        },
        header: {
            marginTop: 20,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 10,
        },
        profileRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        avatar: {
            width: 50,
            height: 50,
            borderRadius: 25,
            marginRight: 12,
        },
        name: {
            fontSize: 16,
            fontWeight: "bold",
            color: theme.text,
        },
        level: {
            fontSize: 13,
            color: theme.mutedText,
            marginTop: 2,
        },
        bellIcon: {
            marginLeft: "auto",
            marginRight: 20,
            color: theme.text,
        },
        sectionTitle: {
            fontSize: 20,
            fontWeight: "bold",
            margin: 20,
            color: theme.text,
        },
        scrollContainer: {
            paddingHorizontal: 16,
            flexDirection: "row",
            gap: 16,
        },
        horizontalList: {
            paddingLeft: 16,
            gap: 16,
        },
        emptyText: {
            padding: 20,
            fontSize: 14,
            color: theme.mutedText,
            fontStyle: "italic",
            marginRight: 20,
            marginBottom: 10,
            marginLeft: 20,
            backgroundColor: theme.card,
            borderRadius: 10,
        },
        dotsContainer: {
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 12,
        },
        dot: {
            fontSize: 10,
            marginHorizontal: 4,
            color: theme.dotInactive,
        },
        activeDot: {
            color: theme.dotActive,
        },
        inactiveDot: {
            color: theme.dotInactive,
        },
        historyCardWrapper: {
            flex: 1,
            marginHorizontal: isLargeScreen ? 8 : 0,
            width: isLargeScreen
                ? (Dimensions.get('window').width - 48) / 2
                : undefined,
        },
        historyColumnWrapper: {
            justifyContent: isLargeScreen ? 'space-between' : 'center',
            marginBottom: 16,
        },
        topPicksRow: {
            width: Dimensions.get('window').width,
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
        },
        topPicksCardSideBySide: {
            width: isLargeScreen
                ? (Dimensions.get('window').width - 48) / 2  // Two cards
                : Dimensions.get('window').width - 32,       // Full width for single card
        },
        historyTitle: {
            fontSize: 20,
            fontWeight: "bold",
            marginTop: 20,
            color: theme.text,
        },
        sectionRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginHorizontal: 20,
            marginBottom: 10,
        },
        viewAll: {
            fontSize: 16,
            color: isBW ? '#eee' : '#007AFF',
            fontWeight: '600',
            textDecorationLine: 'underline',
        },
    });
}
