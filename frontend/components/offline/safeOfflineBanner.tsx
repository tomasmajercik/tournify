import { View, Text } from 'react-native';
import { useEffect, useState } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/themes/theme';

export const OfflineBanner = () => {
    const isOffline = useConnectionStore((state) => state.isOffline);
    // const isOffline = true; // For testing purposes
    const [showOnlineMessage, setShowOnlineMessage] = useState(false);
    const [wasOffline, setWasOffline] = useState(false);

    const theme = useTheme();


    useEffect(() => {
        if (wasOffline && !isOffline) {
            setShowOnlineMessage(true);
            const timer = setTimeout(() => setShowOnlineMessage(false), 3000);
            setWasOffline(false);
            return () => clearTimeout(timer);
        }

        if (isOffline) {
            setWasOffline(true);
        }
    }, [isOffline]);

    if (isOffline) {
        return (
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#e74c3c' }}>
                <View style={{ backgroundColor: '#e74c3c', padding: 8 }}>
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                        You are offline
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (showOnlineMessage) {
        return (
            <SafeAreaView edges={['top']} style={{ backgroundColor: '#2ecc71' }}>
                <View style={{ backgroundColor: '#2ecc71', padding: 8 }}>
                    <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
                        Reconnected successfully
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return null;
};

export default OfflineBanner;
