import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DefaultTheme,
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { ChartLine, House, Settings, Target, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { runDbHealthcheck } from "../db/healthcheck";
import { seedIfEmpty } from "../db/seed";
import { theme } from "../theme/theme";
import HomeLogsScreen from "./HomeLogsScreen";
import InsightsScreen from "./InsightsScreen";
import LoginPage from "./LoginPage";
import PlaceholderScreen from "./PlaceholderScreen";
import ProfileScreen from "./ProfileScreen";
import SettingsScreen from "./SettingsScreen";
import TargetsScreen from "./TargetsScreen";

const Tab = createBottomTabNavigator();

function ProfilePlaceholder() {
  return <PlaceholderScreen title="Profile (placeholder)" />;
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

  const [isEntered, setIsEntered] = useState(false);

  if (!isEntered) {
    return <LoginPage onEnter={() => setIsEntered(true)} />;
  }

  return (
    <NavigationIndependentTree>
      <NavigationContainer
        theme={{
          ...DefaultTheme,
          colors: {
            ...DefaultTheme.colors,
            primary: theme.colors.accent,
            background: theme.colors.background,
            card: theme.colors.surface,
            text: theme.colors.textPrimary,
            border: theme.colors.border,
            notification: theme.colors.accent,
          },
        }}
      >
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
            tabBarActiveTintColor: theme.colors.accent,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.textPrimary,
            tabBarIcon: ({ color, size }) => {
              if (route.name === "Home") {
                return <House size={size} color={color} />;
              }
              if (route.name === "Targets") {
                return <Target size={size} color={color} />;
              }
              if (route.name === "Insights") {
                return <ChartLine size={size} color={color} />;
              }
              if (route.name === "Settings") {
                return <Settings size={size} color={color} />;
              }
              return <User size={size} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Home" component={HomeLogsScreen} />
          <Tab.Screen name="Targets" component={TargetsScreen} />
          <Tab.Screen name="Insights" component={InsightsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
          <Tab.Screen name="Profile">
            {() => <ProfileScreen onLogout={() => setIsEntered(false)} />}
          </Tab.Screen>
        </Tab.Navigator>
        <StatusBar style="dark" />
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
