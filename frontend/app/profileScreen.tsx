import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform, RefreshControl, Alert, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useTheme } from '@/themes/theme';
import API_BASE_URL from "@/config/config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import EditProfile from '../components/profile/editProfile';
import OfflineBanner from '@/components/offline/safeOfflineBanner';
import ChangePasswordForm from '@/components/profile/changePassword';
import { router } from "expo-router";
import { useNavigation } from '@react-navigation/native';

import { useThemeStore } from '@/stores/themeStore';
import ThemeSelectorModal from '@/components/profile/themeSelector';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';


interface UserData {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    image_path: string | null;
}

interface MenuItemProps {
    label: string;
    icon: React.ReactNode;
    onPress: () => void;
    expanded?: boolean;
}


const MenuItem = ({ label, icon, onPress, expanded = false }: MenuItemProps) => {
    const theme = useTheme();
    const menuStyles = useMemo(() => getMenuStyles(theme), [theme]);

    return (
        <TouchableOpacity style={menuStyles.item} onPress={onPress}>
            <View style={menuStyles.row}>
                {icon}
                <Text style={menuStyles.label}>{label}</Text>
            </View>
            <Ionicons
                name="chevron-forward"
                size={20}
                color="gray"
                style={{ transform: [{ rotate: expanded ? '90deg' : '0deg' }] }}
            />
        </TouchableOpacity>
    );
};



export default function ProfileScreen() {
    const [refreshing, setRefreshing] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);

    const navigation = useNavigation();

    const [editMode, setEditMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const fetchUserData = async () => {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUserId = await AsyncStorage.getItem("userId");

        if (storedToken) {
            setToken(storedToken);
        }
        try {
            const response = await fetch(`${API_BASE_URL}/users/${storedUserId}/info`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${storedToken}`
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "User Data could not be loaded.");
            }

            setUserData(data);
        } catch (error) {
            console.warn('❌ Error loading user data:', error);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUserData();
        setRefreshing(false);
    };


    const confirmLogout = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes", onPress: handleSignOut }
            ],
            { cancelable: true }
        );
    };

    const handleSignOut = async () => {
        await AsyncStorage.multiRemove(["token", "userId"]);
        navigation.reset({
            index: 0,
            routes: [{ name: 'welcome' as never }],
        });
    };

    const theme = useTheme();
    const styles = useMemo(() => getStyles(theme), [theme]);
    const themeName = useThemeStore((s) => s.theme); // 'system', 'light', ...
    const isBW = theme.id === 'blackWhiteTheme';

    const [showThemeModal, setShowThemeModal] = useState(false);

    return (
        <SafeAreaView style={styles.safeArea}>
            <OfflineBanner />
            <KeyboardAwareScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid
                extraScrollHeight={40} // Pushes the input above the keyboard
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => {
                        if (router.canGoBack()) {
                            router.back();
                        } else {
                            router.replace("/(tabs)/home");
                        }
                    }}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.header}>
                        <Image
                            source={
                                userData && userData.image_path
                                    ? {
                                        uri: `${API_BASE_URL}/uploads/${userData.image_path}?grayscale=${isBW}`,
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                        },
                                    }
                                    : require("@/assets/images/default-profile.jpg")
                            }
                            style={styles.avatar}
                            onError={(error) => {
                                console.log("Image failed to load:", error.nativeEvent.error);
                            }}
                        />
                        <View style={styles.nameContainer}>
                            <Text style={styles.name}>
                                {userData ? `${userData.first_name} ${userData.last_name}` : "Loading..."}
                            </Text>
                            <Text style={styles.email}>
                                {userData ? `${userData.email}` : "Loading..."}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.container}>
                        <MenuItem
                            label="Edit profile"
                            icon={<Feather name="edit" size={20} color={theme.text} />}
                            onPress={() => {
                                if (!editMode) setEditMode(true)
                                else if (editMode) setEditMode(false)
                            }
                            }
                            expanded={editMode} // 🔄
                        />
                        {editMode && userData && token && (
                            <EditProfile
                                user={userData}
                                token={token}
                                onDone={() => {
                                    setEditMode(false);
                                    fetchUserData();
                                }}
                            />
                        )}

                        <MenuItem
                            label="Change Password"
                            icon={<MaterialCommunityIcons name="key" size={20} color={theme.text} />}
                            onPress={() => {
                                if (!showPassword) setShowPassword(true)
                                else if (showPassword) setShowPassword(false)
                            }
                            }
                            expanded={showPassword} // 🔄
                        />
                        {showPassword && token && userData?.id && (
                            <ChangePasswordForm
                                token={token}
                                onDone={() => setShowPassword(false)}
                            />
                        )}

                        <MenuItem
                            label={`Theme: ${themeName.toUpperCase()}`}
                            icon={<MaterialIcons name="brightness-6" size={20} color={theme.text} />}
                            onPress={() => setShowThemeModal(true)}
                        />

                        <ThemeSelectorModal
                            visible={showThemeModal}
                            onClose={() => setShowThemeModal(false)}
                        />

                        <MenuItem
                            label="Sign Out"
                            icon={<Ionicons name="exit-outline" size={20} color={theme.text} />}
                            onPress={confirmLogout}
                        />
                    </View>
                </ScrollView>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    );
}

const getStyles = (theme: ReturnType<typeof useTheme>) => {
    const isBW = theme.id === 'blackWhiteTheme';

    return StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme.background,
            paddingTop: Platform.OS === 'ios' ? 0 : 40,
        },
        backButton: {
            position: 'absolute',
            top: 16,
            left: 16,
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: 10,
            borderRadius: 25,
        },
        header: {
            paddingTop: 60,
            justifyContent: 'center',
            alignItems: 'center',
        },
        avatar: {
            width: 150,
            height: 150,
            borderRadius: 75,
            marginBottom: 10,
        },
        nameContainer: {
            alignItems: 'center',
        },
        name: {
            fontSize: 20,
            fontWeight: "bold",
            color: theme.text,
        },
        email: {
            marginTop: 5,
            fontSize: 16,
            color: theme.text,
        },
        container: {
            backgroundColor: theme.background,
            borderRadius: 20,
            paddingHorizontal: 20,
            paddingBottom: 10,
            marginTop: 30,
        },
    });
};

const getMenuStyles = (theme: ReturnType<typeof useTheme>) => {

    return StyleSheet.create({
        item: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: .5,
            borderColor: 'gray',
            padding: 10,
            paddingVertical: 25,
        },
        row: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        label: {
            color: theme.text,
            fontSize: 16,
            fontWeight: '500',
        },
    });
};