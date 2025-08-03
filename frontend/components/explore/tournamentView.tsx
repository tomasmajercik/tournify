import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from 'expo-router';
import { useTheme } from "@/themes/theme";
import { useMemo } from "react";
import useRelativeDate from "@/hooks/useRelativeDate";

import { getDistance } from 'geolib';

interface TournamentCardProps {
    title: string;
    date: string;
    imageUrl: any;
    tournamentId: string;
    lat: number | null;
    lon: number | null;
    userLat: number | null;
    userLon: number | null;
    defaultDistance: number;
    type: string;
    ticketId?: string;
    status?: string;
}

const TournamentView = ({ title, date, imageUrl, tournamentId, lat, lon, userLat, userLon, defaultDistance, type, ticketId, status }: TournamentCardProps) => {
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';

    const router = useRouter();

    const distance = useMemo(() => {
        if (
            userLat !== null && userLon !== null &&
            lat !== null && lon !== null) {
            if (userLat !== 0 && userLon !== 0) {
                const distanceInMeters = getDistance(
                    { latitude: userLat, longitude: userLon },
                    { latitude: lat, longitude: lon }
                );
                const distanceInKm = Math.round((distanceInMeters / 1000) * 10) / 10;
                return `${distanceInKm} km from you`;
            } else if (userLat === 0 && userLon === 0) {
                return `${defaultDistance} km from you`;
            }
            return "Distance unknown";
        }
    }, [userLat, userLon, lat, lon]);



    return (
        <View style={styles.card}>

            <ImageBackground source={{ uri: `${imageUrl.uri}?grayscale=${isBW}` }} style={styles.image} imageStyle={{ borderRadius: 12 }}
                onError={(error) => {
                    console.log("Image failed to load:", error.nativeEvent.error);
                }}
            >
                <View style={styles.overlay}>
                    <View style={styles.rowContainer}>
                        <View>
                            <Text style={styles.title}>{title}</Text>

                            <View style={[styles.detailsRow, !distance && { justifyContent: 'flex-start' }]}>
                                <Ionicons name="calendar-outline" size={16} color={theme.cardColor} />
                                <Text style={styles.detailText}>{useRelativeDate(date)}</Text>

                                {distance && (
                                    <>
                                        <Ionicons name="location-outline" size={16} color={theme.cardColor} style={{ marginLeft: 12 }} />
                                        <Text style={styles.detailText}> {distance} </Text>
                                    </>
                                )}
                            </View>
                        </View>

                        <View style={{ flex: 1 }} />

                        <TouchableOpacity
                            style={styles.infoButton}
                            onPress={() => {
                                const route =
                                    type === "owned"
                                        ? status === "Ongoing" || status === "Closed"
                                            ? `/tournament/manage/${tournamentId}/dashboard`
                                            : `/tournament/manage/${tournamentId}/startEdit`
                                        : type === "ticket"
                                            ? `/ticket/${ticketId}`
                                            : `/tournament/${tournamentId}`;

                                router.push(route as any);
                            }}
                        >
                            <Text style={styles.infoText}>{type == "owned" ? "Manage" : "Info"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

            </ImageBackground>
        </View>
    );
};


export default TournamentView;

const getStyles = (theme: ReturnType<typeof useTheme>) => {
    const isBW = theme.id === 'blackWhiteTheme';
    return StyleSheet.create({
        rowContainer: {
            flexDirection: "row",
            alignItems: "center",
        },
        card: {
            width: '100%',
            alignSelf: 'center',
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 20,
        },
        image: {
            width: "100%",
            height: 210,
            justifyContent: "flex-end",
        },
        overlay: {
            backgroundColor: theme.tournamentCard,
            padding: 18,
            zIndex: 2,
        },
        title: {
            color: theme.cardColor,
            fontSize: 18,
            fontWeight: "bold",
            marginBottom: 8,
            maxWidth: 190,
        },
        detailsRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 130,
        },
        infoGroup: {
            flexDirection: "row",
        },
        detailText: {
            color: theme.cardColor,
            marginLeft: 4,
            fontSize: 12,
        },
        infoButton: {
            backgroundColor: isBW ? '#888' : "#3f7368",
            paddingHorizontal: 30,
            paddingVertical: 10,
            borderRadius: 10,
            marginLeft: 20,
        },
        infoText: {
            color: "#fff",
            fontWeight: "600",
            fontSize: 15,
        },

    });
};

