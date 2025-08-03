import { View, Text, StyleSheet } from 'react-native';
import React from 'react';
import { useTheme } from '@/themes/theme';

interface BadgeProps {
    position: string;
}

const getBadgeStyle = (position: string, isBw: boolean) => {
    if(!isBw){
        switch (position) {
            case '1st place':
                return { backgroundColor: '#F5C344', color: '#000' }; // Gold
            case '2nd place':
                return { backgroundColor: '#C0C0C0', color: '#000' }; // Silver
            case '3rd place':
                return { backgroundColor: '#CD7F32', color: '#fff' }; // Bronze
            default:
                return { backgroundColor: '#444', color: '#fff' };     // Neutral
        }
    }else{
        switch (position) {
            case '1st place':
                return { backgroundColor: '#dddddd', color: '#000' }; // 'gold'
            case '2nd place':
                return { backgroundColor: '#bbbbbb', color: '#000' }; // 'silver'
            case '3rd place':
                return { backgroundColor: '#888888', color: '#fff' }; // 'bronze'
            default:
                return { backgroundColor: '#333333', color: '#fff' };     // Neutral
        }
    }
};

const Badge = ({ position }: BadgeProps) => {
    
    // Variable to store the theme styles
    const theme = useTheme();
    const isBW = theme.id === 'blackWhiteTheme';
    
    const badgeStyle = getBadgeStyle(position, isBW);


    return (
        <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
            <Text style={[styles.badgeText, { color: badgeStyle.color }]}>{position}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        marginTop: 8,
        backgroundColor: "#F5C344",
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 8,
        alignSelf: "flex-start",
    },
    badgeText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#000",
    },
});

export default Badge;
