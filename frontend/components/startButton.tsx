import React, { useMemo } from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/themes/theme";

const StartButton = ({ title, onPress }: { title: string; onPress: () => void }) => {

    
    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';
    

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <LinearGradient
                colors={isBW ? ["#999", "#777"] : ["#64CA76", "#2E8B57"]}
                start={{ x: 0, y: 0 }} // Gradient starts from the top-left
                end={{ x: 1, y: 1 }} // Ends at the bottom-right
                style={styles.button}
            >
                <Text style={styles.buttonText}>{title}</Text>
            </LinearGradient>
            
        </TouchableOpacity>
    );
};

const getStyles = (theme: ReturnType<typeof useTheme>) => {
    return StyleSheet.create({
        button: {
            paddingVertical: 15,
            paddingHorizontal: 60,
            borderRadius: 25,
            marginTop: 20,
            alignItems: "center",

            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 8,
        },
        buttonText: {
            color: "#fff",
            fontSize: 18,
            fontWeight: "bold",
        },
    });
};

export default StartButton;