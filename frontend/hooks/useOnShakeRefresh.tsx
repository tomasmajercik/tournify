import { useEffect } from 'react';
import { Accelerometer } from 'expo-sensors';
// import RNShake from 'react-native-shake'; // alternative but works only on prebuild

export function useOnShakeRefresh(onRefresh: () => void) {
    // useEffect(() => { // alternative but works only on prebuild
    //     const subscription = RNShake.addListener(() => {
    //         console.log("📱 Device shaken, refreshing...");
    //         onRefresh();
    //     });

    //     return () => {
    //         subscription.remove();
    //     };
    // }, []);

    useEffect(() => {
        let lastShakeTime = 0;

        const subscription = Accelerometer.addListener(({ x, y, z }) => {
            const totalForce = Math.sqrt(x * x + y * y + z * z);

            if (totalForce > 1.8) {
                const now = Date.now();
                if (now - lastShakeTime > 2000) {
                    lastShakeTime = now;
                    console.log("📱 Shake detected! Triggering refresh...");
                    onRefresh();
                }
            }
        });

        Accelerometer.setUpdateInterval(300);

        return () => {
            subscription.remove();
        };
    }, [onRefresh]);
}

export default useOnShakeRefresh;