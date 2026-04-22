import { useNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Settings } from "lucide-react-native";
import { useCallback } from "react";
import { TouchableOpacity } from "react-native";
import { useAppTheme } from "../state/theme-provider";
import DailyLogScreen from "./DailyLogScreen";
import HomeOverviewScreen from "./HomeOverviewScreen";

export type HomeStackParamList = {
  HomeOverview: undefined;
  DailyLog: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

export default function HomeLogsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();

  const goToSettings = useCallback(() => {
    navigation.getParent()?.navigate("Settings" as never);
  }, [navigation]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      <Stack.Screen
        name="HomeOverview"
        component={HomeOverviewScreen}
        options={{
          title: "Home",
          headerRight: () => (
            <TouchableOpacity onPress={goToSettings} style={{ marginRight: 4 }}>
              <Settings size={22} color={theme.textPrimary} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen
        name="DailyLog"
        component={DailyLogScreen}
        options={{ title: "Daily Log", headerBackButtonDisplayMode: "minimal" }}
      />
    </Stack.Navigator>
  );
}
