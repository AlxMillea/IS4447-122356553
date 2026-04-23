import { useNavigation } from "@react-navigation/native";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  formatDayMonthYear,
  getCategoriesWithHabits,
  getLogsForDate,
} from "../db/db-repo";
import { gymSessionsLeft } from "../db/training-plan";
import { useAppTheme } from "../state/theme-provider";

const CHICAGO_DATE = new Date("2026-05-25T00:00:00");

function daysToChicago(): number {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const chiStart = new Date(
    CHICAGO_DATE.getFullYear(),
    CHICAGO_DATE.getMonth(),
    CHICAGO_DATE.getDate(),
  );
  return Math.max(
    0,
    Math.round((chiStart.getTime() - todayStart.getTime()) / 86400000),
  );
}

export default function ChicagoHeaderTitle() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const [habitsLeft, setHabitsLeft] = useState<number | null>(null);

  const days = useMemo(() => daysToChicago(), []);
  const gymLeft = useMemo(() => gymSessionsLeft(), []);

  useEffect(() => {
    const load = async () => {
      const [allCategories, todayLogs] = await Promise.all([
        getCategoriesWithHabits(),
        getLogsForDate(formatDayMonthYear(new Date())),
      ]);
      const totalHabits = allCategories.reduce(
        (sum, c) => sum + c.habits.length,
        0,
      );
      const loggedIds = new Set(todayLogs.map((l) => l.habitId));
      setHabitsLeft(totalHabits - loggedIds.size);
    };
    void load();
    const unsub = navigation.addListener("focus", () => void load());
    return unsub;
  }, [navigation]);

  const allDone = habitsLeft === 0;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.dot, { backgroundColor: theme.accent }]} />
        <Text style={[styles.city, { color: theme.accent }]}>Chicago</Text>
        <Text style={[styles.sep, { color: theme.textSecondary }]}> · </Text>
        <Text style={[styles.stat, { color: theme.textPrimary }]}>{days}</Text>
        <Text style={[styles.unit, { color: theme.textSecondary }]}>d</Text>
        <Text style={[styles.sep, { color: theme.textSecondary }]}> · </Text>
        <Text style={[styles.stat, { color: theme.textPrimary }]}>
          {gymLeft}
        </Text>
        <Text style={[styles.unit, { color: theme.textSecondary }]}>
          {" "}
          gym left
        </Text>
      </View>
      {habitsLeft !== null && (
        <Text
          style={[
            styles.habits,
            { color: allDone ? "#22C55E" : theme.textSecondary },
          ]}
        >
          {allDone
            ? "All habits logged today \u2713"
            : `${habitsLeft} habit${habitsLeft === 1 ? "" : "s"} left to log today`}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", alignItems: "flex-start", paddingLeft: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  city: { fontWeight: "700", fontSize: 13 },
  sep: { fontSize: 13 },
  stat: { fontSize: 13, fontWeight: "700" },
  unit: { fontSize: 13 },
  habits: { fontSize: 12, marginTop: 2 },
});
