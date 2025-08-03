import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/themes/theme";
import { useMemo } from "react";
import Badge from "../tournamentDetail/badge";

interface HistoryCardProps {
    title: string;
    date: string;
    position: any;
    imageUrl: any;
    onInfoPress: () => void;
}

function formatDate(dateString: string): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

const HistoryCard = ({ title, date, position, imageUrl, onInfoPress }: HistoryCardProps) => {
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    return (
        <View style={styles.card}>
            <Image source={imageUrl} style={styles.image} />
            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.date}>{formatDate(date)}</Text>
                {position && (
                    <Badge position={String(position)} />
                )}
            </View>
            <TouchableOpacity style={styles.infoButton} onPress={onInfoPress}>
                <Ionicons name="information-circle-outline" size={30} style={styles.icons} />
            </TouchableOpacity>
        </View>
    );
};

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.historyCard,
        padding: 12,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: theme.text,
    },
    date: {
        color: "#999",
        marginTop: 2,
    },
    infoButton: {
        marginLeft: 12,
    },
    icons: {
        color: theme.text,
    },
});


export default HistoryCard;
