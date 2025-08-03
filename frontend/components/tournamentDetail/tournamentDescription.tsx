import { Text, StyleSheet } from "react-native";
import { useTheme } from "@/themes/theme";

interface Props {
    description: string;
    isExpanded: boolean;
    onToggle: () => void;
}

export default function TournamentDescription({ description, isExpanded, onToggle }: Props) {
    const theme = useTheme();
    const short = description.slice(0, 120);
    const showReadMore = description.length > 120;

    return (
        <Text style={[styles.description, { color: theme.descriptionText }]}>
            {isExpanded || !showReadMore ? description : short + "..."}
            {showReadMore && (
                <>
                    {"   "}
                    <Text
                        style={[styles.readMore, { color: isExpanded ? "#999" : "#007AFF" }]}
                        onPress={onToggle}
                    >
                        {isExpanded ? "Show less" : "Read more"}
                    </Text>
                </>
            )}
        </Text>
    );
}

const styles = StyleSheet.create({
    description: {
        fontSize: 14,
        marginBottom: 30,
        textAlign: "justify",
        lineHeight: 20,
        marginTop: 8,
    },
    readMore: {
        fontWeight: "bold",
        textDecorationLine: "underline",
    },
});
