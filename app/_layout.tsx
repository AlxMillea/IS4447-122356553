import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ChartLine, House, Settings, Target, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { runDbHealthcheck } from "../db/healthcheck";
import { seedIfEmpty } from "../db/seed";
import { AppThemeProvider, useAppTheme } from "../state/theme-provider";
import ChicagoHeaderTitle from "./ChicagoHeaderTitle";
import HomeLogsScreen from "./HomeLogsScreen";
import InsightsScreen from "./InsightsScreen";
import LoginPage from "./LoginPage";
import ProfileScreen from "./ProfileScreen";
import SettingsScreen from "./SettingsScreen";
import TargetsScreen from "./TargetsScreen";

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function MainTabs({ onLogout, onDeleteProfile }: { onLogout: () => void; onDeleteProfile: () => void }) {
  const { theme } = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerTitleAlign: "left",
        headerTitle: () => <ChicagoHeaderTitle />,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarIcon: ({ color, size }) => {
          if (route.name === "Home") return <House size={size} color={color} />;
          if (route.name === "Targets") return <Target size={size} color={color} />;
          if (route.name === "Insights") return <ChartLine size={size} color={color} />;
          if (route.name === "Profile") return <User size={size} color={color} />;
          return null;
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate("Settings" as never)}
            style={{ marginRight: 16 }}
          >
            <Settings size={22} color={theme.textPrimary} />
          </TouchableOpacity>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeLogsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Targets" component={TargetsScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Profile">
        {() => <ProfileScreen onLogout={onLogout} onDeleteProfile={onDeleteProfile} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function AppContent() {
  const { theme, mode } = useAppTheme();
  const [isEntered, setIsEntered] = useState(false);
  const [showDeletedBanner, setShowDeletedBanner] = useState(false);

  if (!isEntered) {
    return (
      <LoginPage
        onEnter={() => setIsEntered(true)}
        showDeletedBanner={showDeletedBanner}
        onBannerDismissed={() => setShowDeletedBanner(false)}
      />
    );
  }

  const navTheme =
    mode === "dark"
      ? {
          ...DarkTheme,
          colors: {
            ...DarkTheme.colors,
            primary: theme.accent,
            background: theme.background,
            card: theme.background,
            text: theme.textPrimary,
            border: theme.border,
          },
        }
      : {
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: theme.accent,
            background: theme.background,
            card: theme.background,
            text: theme.textPrimary,
            border: theme.border,
          },
        };

  return (
    <NavigationIndependentTree>
      <NavigationContainer theme={navTheme}>
        <RootStack.Navigator>
          <RootStack.Screen name="MainTabs" options={{ headerShown: false }}>
            {() => <MainTabs onLogout={() => setIsEntered(false)} onDeleteProfile={() => { setShowDeletedBanner(true); setIsEntered(false); }} />}
          </RootStack.Screen>
          <RootStack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: "Settings",
              headerStyle: { backgroundColor: theme.background },
              headerTintColor: theme.textPrimary,
            }}
          />
        </RootStack.Navigator>
        <StatusBar style={mode === "dark" ? "light" : "dark"} />
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      const result = await runDbHealthcheck();
      if (result.ok)
        console.log("[DB] healthcheck OK. Row count:", result.count);
      else console.log("[DB] healthcheck FAILED.");
    })();
  }, []);

  return (
    <AppThemeProvider>
      <AppContent />
    </AppThemeProvider>
  );
}
