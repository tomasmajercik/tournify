import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export function usePushToken() {
    const [expoPushToken, setExpoPushToken] = useState('');

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => {
            if (token) setExpoPushToken(token);
        });
    }, []);

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });

    const registerForPushNotificationsAsync = async () => {
        try {
            if (!Device.isDevice) {
                console.warn('Must use physical device for Push Notifications');
                return;
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                alert('Permission for notifications not granted');
                return;
            }

            const tokenData = await Notifications.getExpoPushTokenAsync();
            console.log('Expo push token:', tokenData.data);
            return tokenData.data;
        } catch (error) {
            console.error('Error getting push token', error);
        }
    };

    return expoPushToken;
}