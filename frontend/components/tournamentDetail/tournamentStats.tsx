import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/themes/theme";

interface Props {
    teamsCount: number;
    teamSize: number;
    date: string;
}


export default function TournamentStats({ teamsCount, teamSize, date }: Props) {
    const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const theme = useTheme();

    return (
        <View style={styles(theme).statsRow}>
            <Stat label="joined" value={teamsCount} theme={theme} />
            <Stat label="team size" value={teamSize} theme={theme} />
            <Stat label="days until" value={daysUntil} theme={theme} />
        </View>
    );
}

const Stat = ({ label, value, theme }: { label: string; value: number; theme: any }) => (
    <View style={styles(theme).stat}>
        <Text style={styles(theme).statNumber}>{value}</Text>
        <Text style={styles(theme).statLabel}>{label}</Text>
    </View>
);

const styles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        statsRow: {
            flexDirection: "row",
            justifyContent: "space-between",
            marginVertical: 24,
        },
        stat: {
            alignItems: "center",
            flex: 1,
        },
        statNumber: {
            fontSize: 20,
            fontWeight: "bold",
            color: theme.text,
        },
        statLabel: {
            fontSize: 13,
            color: "#666",
            marginTop: 4,
        },
    });
