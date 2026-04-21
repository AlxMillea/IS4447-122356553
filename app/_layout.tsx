import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  DefaultTheme,
  NavigationContainer,
  NavigationIndependentTree,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";
import { runDbHealthcheck } from "../db/healthcheck";
import { seedIfEmpty } from "../db/seed";
import { theme } from "../theme/theme";
import HomeLogsScreen from "./HomeLogsScreen";
import InsightsScreen from "./InsightsScreen";
import PlaceholderScreen from "./PlaceholderScreen";
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
          screenOptions={{
            tabBarStyle: {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
            },
            tabBarActiveTintColor: theme.colors.accent,
            tabBarInactiveTintColor: theme.colors.textSecondary,
            headerStyle: { backgroundColor: theme.colors.background },
            headerTintColor: theme.colors.textPrimary,
          }}
        >
          <Tab.Screen name="Home" component={HomeLogsScreen} />
          <Tab.Screen name="Targets" component={TargetsScreen} />
          <Tab.Screen name="Insights" component={InsightsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
          <Tab.Screen name="Profile" component={ProfilePlaceholder} />
        </Tab.Navigator>
        <StatusBar style="dark" />
      </NavigationContainer>
    </NavigationIndependentTree>
  );
}
