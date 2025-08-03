import React, { useMemo } from 'react';
import { Text, StyleSheet, TouchableOpacity, Linking, Platform, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '@/themes/theme';

const grayscaleMapStyle = [
    { elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#6b6b6b' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
    { featureType: 'administrative', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'road', stylers: [{ color: '#cccccc' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', stylers: [{ color: '#dcdcdc' }] }
];

interface Props {
    latitude: number;
    longitude: number;
    tournamentName: string;
}

export default function MapPreview({ latitude, longitude, tournamentName }: Props) {
    const openInMaps = (lat: number, lng: number, label: string) => {
        const url = Platform.select({
            ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`,
            android: `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`,
        });
        if (url) {
            Linking.openURL(url);
        }
    };

    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const isBW = theme.id === 'blackWhiteTheme';

    return (
        <>
            <Text style={styles.title}>Map</Text>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => openInMaps(latitude, longitude, tournamentName)}
            >
                <View style={styles.mapWrapper}>
                    <MapView
                        {...(isBW ? { provider: 'google', customMapStyle: grayscaleMapStyle } : {})}
                        style={styles.map}
                        initialRegion={{
                            latitude,
                            longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                        pitchEnabled={false}
                        rotateEnabled={false}
                    >
                        <Marker coordinate={{ latitude, longitude }} title={tournamentName}
                            image={isBW ? require('@/assets/images/marker-gray.png') : undefined} />
                    </MapView>
                </View>
            </TouchableOpacity>
        </>
    );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 12,
    },
    map: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginBottom: 24,
        backgroundColor: '#eee',
    },
    mapWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 24,
    },
});
