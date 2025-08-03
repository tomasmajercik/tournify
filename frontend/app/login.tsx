import {
    Text, View, StyleSheet, TextInput, ImageBackground, Button,
    TouchableOpacity, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, Keyboard, ScrollView, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import StartButton from "@/components/startButton";
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_BASE_URL from "@/config/config";
import { useTheme } from "@/themes/theme";
import SafeOfflineBanner from "@/components/offline/safeOfflineBanner";
import { usePushToken } from "@/hooks/useNotfications";

export default function LoginScreen() {
    const router = useRouter();

    const pushToken = usePushToken();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordVisible, setPasswordVisible] = useState(false);

    const handleLogin = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Invalid email", "Please enter a valid email address.");
            return;
        }

        if (!email || !password) {
            Alert.alert("Missing fields", "Please enter both email and password.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    password,
                    push_token: pushToken,
                    platform: Platform.OS,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            await AsyncStorage.setItem("token", data.token);
            await AsyncStorage.setItem("userId", String(data.user.id));
            router.replace("/(tabs)/home");
        } catch (error: unknown) {
            if (error instanceof Error) {
                Alert.alert("Login Error", error.message);
            } else {
                Alert.alert("Login Error", "Something went wrong.");
            }
        }
    };

    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);

    return (
        <>
            <SafeOfflineBanner />
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                        <View style={styles.container}>
                            <Text style={styles.text}>Welcome back!</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="gray" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor="#888"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Ionicons name="key-outline" size={20} color="gray" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor="#888"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!passwordVisible}
                                />
                                <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)}>
                                    <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="gray" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => alert("Forgot Password?")}>
                                <Text style={styles.forgotPassword}>Forgot Password?</Text>
                            </TouchableOpacity>
                            <StartButton title="Sign in" onPress={handleLogin} />
                            <Text style={styles.signUpText}>
                                Don't have an account? <Text style={styles.signUpLink} onPress={() => router.replace("/register")}>Sign up.</Text>
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </>
    );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    text: {
        fontFamily: "Inter",
        fontWeight: "bold",
        fontSize: 25,
        margin: 20,
        marginTop: 50,
        marginBottom: 40,
        color: theme.text,
    },
    container: {
        alignItems: "center",
        justifyContent: "center",
        flex: 1,
        backgroundColor: theme.background,
    },
    input: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
        color: theme.text,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: theme.inputBorder,
        borderRadius: 8,
        paddingHorizontal: 10,
        marginBottom: 20,
        width: "80%",
        backgroundColor: theme.inputBackground,
    },
    inputIcon: {
        marginRight: 10,
    },
    signUpText: {
        marginTop: 20,
        fontSize: 14,
        color: theme.text,
    },
    signUpLink: {
        color: "#2F80ED",
        textDecorationLine: "underline",
    },
    forgotPassword: {
        color: "#2F80ED",
        textDecorationLine: "underline",
        marginBottom: 20,
    },
});

