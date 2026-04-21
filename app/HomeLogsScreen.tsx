import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DailyLogScreen from "./DailyLogScreen";
import HomeOverviewScreen from "./HomeOverviewScreen";
import { theme } from "../theme/theme";

export type HomeStackParamList = {
  HomeOverview: undefined;
  DailyLog: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();
const CHICAGO_TRIP_START = new Date("2026-05-25T00:00:00");

function getDaysToChicago(): number {
  const diffMs = CHICAGO_TRIP_START.getTime() - new Date().getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export default function HomeLogsScreen() {
  const daysToChicago = getDaysToChicago();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.background },
        headerTintColor: theme.colors.textPrimary,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen
        name="HomeOverview"
        component={HomeOverviewScreen}
        options={{ title: `Home (Logs) • ${daysToChicago} days` }}
      />
      <Stack.Screen
        name="DailyLog"
        component={DailyLogScreen}
        options={{ title: "60-Second Daily Log" }}
      />
    </Stack.Navigator>
  );
}
