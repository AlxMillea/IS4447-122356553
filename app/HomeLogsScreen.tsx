import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DailyLog"
        component={DailyLogScreen}
        options={{ title: "Daily Log", headerBackButtonDisplayMode: "minimal" }}
      />
    </Stack.Navigator>
  );
}
