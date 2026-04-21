import { useCallback, useMemo, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { useFocusEffect } from "@react-navigation/native";
import {
    getHabitLogsByHabitIds,
    getHabitsByNames,
    parseDayMonthYear,
} from "../db/db-repo";
import { theme } from "../theme/theme";

const chartWidth = Dimensions.get("window").width - 32;
const expectedCurve = [90, 89, 88, 87, 86];

export default function InsightsScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [habitMap, setHabitMap] = useState<Record<string, number>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const habits = await getHabitsByNames([
          "Weigh-in",
          "Hit 185g Protein",
          "Gym Session",
          "Calories (Gym Day)",
          "Calories (Rest Day)",
          "Log Sleep",
        ]);
        if (!active) return;
        const map = Object.fromEntries(habits.map((h) => [h.name, h.id]));
        setHabitMap(map);
        setLogs(await getHabitLogsByHabitIds(habits.map((h) => h.id)));
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const last7 = useMemo(() => logs.slice(0, 200), [logs]); // small local dataset
  const byDate = useMemo(() => {
    const m: Record<string, any[]> = {};
    for (const l of last7) {
      if (!m[l.date]) m[l.date] = [];
      m[l.date].push(l);
    }
    return m;
  }, [last7]);

  const dates = useMemo(
    () =>
      Object.keys(byDate)
        .sort(
          (a, b) =>
            parseDayMonthYear(a).getTime() - parseDayMonthYear(b).getTime(),
        )
        .slice(-7),
    [byDate],
  );

  const calorieAdherence = (() => {
    if (!dates.length) return 0;
    let pass = 0;
    for (const d of dates) {
      const day = byDate[d] ?? [];
      const gymDone = day.some(
        (x) => x.habitId === habitMap["Gym Session"] && x.value >= 1,
      );
      const calLog = day.find((x) =>
        gymDone
          ? x.habitId === habitMap["Calories (Gym Day)"]
          : x.habitId === habitMap["Calories (Rest Day)"],
      );
      const target = gymDone ? 2800 : 2100;
      if (calLog && calLog.value <= target) pass += 1;
    }
    return Math.round((pass / 7) * 100);
  })();

  const proteinConsistency = (() => {
    if (!dates.length) return 0;
    let pass = 0;
    for (const d of dates) {
      const day = byDate[d] ?? [];
      if (
        day.some(
          (x) => x.habitId === habitMap["Hit 185g Protein"] && x.value >= 185,
        )
      )
        pass += 1;
    }
    return Math.round((pass / 7) * 100);
  })();

  const trainingSessions = (() => {
    return last7.filter(
      (x) => x.habitId === habitMap["Gym Session"] && x.value >= 1,
    ).length;
  })();

  const weightSeries = useMemo(() => {
    const values = last7
      .filter((x) => x.habitId === habitMap["Weigh-in"])
      .sort(
        (a, b) =>
          parseDayMonthYear(a.date).getTime() -
          parseDayMonthYear(b.date).getTime(),
      )
      .map((x) => Number(x.value));
    const trimmed = values.slice(-5);
    if (trimmed.length === 0) return expectedCurve;
    while (trimmed.length < 5) trimmed.unshift(trimmed[0]);
    return trimmed;
  }, [habitMap, last7]);

  const grade = (() => {
    const trainingScore = Math.min(trainingSessions / 4, 1) * 30;
    const nutritionScore =
      ((calorieAdherence + proteinConsistency) / 2 / 100) * 40;
    const supplementsScore = 20; // placeholder until supplement logging is added
    const recoveryScore = 8; // placeholder
    const total =
      trainingScore + nutritionScore + supplementsScore + recoveryScore;
    if (total >= 85) return "A";
    if (total >= 70) return "B";
    if (total >= 55) return "C";
    return "Missed";
  })();

  const Card = ({ title, value }: { title: string; value: string }) => (
    <View style={styles.card}>
      <Text style={styles.secondary}>{title}</Text>
      <Text style={styles.primary}>{value}</Text>
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text style={styles.header}>Phase Progress: Week 5 of 5 - Peak Bulk</Text>

      <View style={styles.grid}>
        <Card title="Calorie Adherence" value={`${calorieAdherence}%`} />
        <Card title="Protein Consistency" value={`${proteinConsistency}%`} />
        <Card
          title="Training Consistency"
          value={`${trainingSessions}/4 sessions`}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.primary}>Weight Trend (Actual vs Expected)</Text>
        <LineChart
          width={chartWidth}
          height={220}
          data={{
            labels: ["W5", "W4", "W3", "W2", "W1"],
            datasets: [
              {
                data: weightSeries,
                color: () => theme.colors.accent,
                strokeWidth: 2,
              },
              { data: expectedCurve, color: () => "#A1A1AA", strokeWidth: 2 },
            ],
            legend: ["Actual", "Expected"],
          }}
          chartConfig={{
            backgroundColor: theme.colors.surface,
            backgroundGradientFrom: theme.colors.surface,
            backgroundGradientTo: theme.colors.surface,
            decimalPlaces: 1,
            color: () => theme.colors.textPrimary,
            labelColor: () => theme.colors.textSecondary,
            propsForDots: { r: "3" },
          }}
          bezier
          style={{ marginTop: 12, borderRadius: 8 }}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.secondary}>Phase Completion Score</Text>
        <Text style={styles.primary}>{grade}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  header: { color: theme.colors.textPrimary, fontSize: 18, marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 10 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
    flexGrow: 1,
  },
  primary: { color: theme.colors.textPrimary, fontSize: 16, marginTop: 4 },
  secondary: { color: theme.colors.textSecondary },
});
