import { StyleSheet, ImageBackground, View, Animated, PanResponder, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import StartButton from "@/components/startButton";
import WelcomeHeader from "@/components/welcome/welcome-header";
import { usePushToken } from "@/hooks/useNotfications";
import { useEffect } from "react";

export default function WelcomeScreen() {

    const expoPushToken = usePushToken();
    useEffect(() => {
        if (expoPushToken) {
            console.log("Expo push token:", expoPushToken);
        }

    }, [expoPushToken]);
    return (
        <ImageBackground
            source={require("@/assets/images/welcome-background.jpg")}
            style={styles.container}
        >
            <View style={styles.headerContainer}>
                <WelcomeHeader />
            </View>
            <View style={styles.buttonContainer}>
                <StartButton title="Sign in" onPress={() => router.replace("/login")} />
                <StartButton title="Sign up" onPress={() => router.replace("/register")} />
            </View>

        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    loginFormContainer: {
        width: "100%",
        position: "absolute",
        bottom: 0,
    },
    buttonContainer: {
        marginTop: 100,
    },
    headerContainer: {
        position: "absolute",
        top: 80,
        left: 40,
    },
});