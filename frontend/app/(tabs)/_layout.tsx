import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/themes/theme";


export default function TabLayout() {
    const theme = useTheme();
    const isBW = theme.id === 'blackWhiteTheme';
    return (
        <Tabs screenOptions={{
            headerShown: false, tabBarStyle: {
                backgroundColor: theme.background,
                borderTopColor: theme.topBar,
                borderTopWidth: 0.5,
                height: 95,
                paddingTop: 10,
            },
            tabBarActiveTintColor: isBW ? '#ffffff' : '#128B53',
            tabBarInactiveTintColor: isBW ? '#777777' : '#999999',
        }} >
            <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ focused, color }) => <Ionicons name="home" size={24} color={color} /> }} />
            <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ({ focused, color }) => <Ionicons name="search" size={24} color={color} /> }} />
            <Tabs.Screen name="events" options={{ title: "Events", tabBarIcon: ({ focused, color }) => <Ionicons name="calendar" size={24} color={color} /> }} />
            <Tabs.Screen name="create" options={{ title: "Create", tabBarIcon: ({ focused, color }) => <Ionicons name="add-circle" size={24} color={color} /> }} />
        </Tabs>);
}
