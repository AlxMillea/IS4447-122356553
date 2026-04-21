import { useCallback, useMemo, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

type TimeView = "daily" | "weekly" | "monthly";
type LogRow = { habitId: number; date: string; value: number };

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function weekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function clamp(num: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, num));
}

export default function InsightsScreen() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [habitMap, setHabitMap] = useState<Record<string, number>>({});
  const [timeView, setTimeView] = useState<TimeView>("weekly");

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
        setLogs((await getHabitLogsByHabitIds(habits.map((h) => h.id))) as LogRow[]);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const latestDate = useMemo(() => {
    if (!logs.length) return null;
    const sorted = Array.from(new Set(logs.map((l) => l.date))).sort(
      (a, b) => parseDayMonthYear(a).getTime() - parseDayMonthYear(b).getTime(),
    );
    return sorted[sorted.length - 1] ?? null;
  }, [logs]);

  const latestDateObj = useMemo(
    () => (latestDate ? startOfDay(parseDayMonthYear(latestDate)) : null),
    [latestDate],
  );

  const rangeDays = timeView === "daily" ? 1 : timeView === "weekly" ? 7 : 30;

  const scopedLogs = useMemo(() => {
    if (!latestDateObj) return [];
    const maxDiff = (rangeDays - 1) * 24 * 60 * 60 * 1000;
    return logs.filter((log) => {
      const logDate = startOfDay(parseDayMonthYear(log.date));
      const diff = latestDateObj.getTime() - logDate.getTime();
      return diff >= 0 && diff <= maxDiff;
    });
  }, [latestDateObj, logs, rangeDays]);

  const byDate = useMemo(() => {
    const mapped: Record<string, LogRow[]> = {};
    for (const row of scopedLogs) {
      if (!mapped[row.date]) mapped[row.date] = [];
      mapped[row.date].push(row);
    }
    return mapped;
  }, [scopedLogs]);

  const scopedDates = useMemo(
    () =>
      Object.keys(byDate).sort(
        (a, b) => parseDayMonthYear(a).getTime() - parseDayMonthYear(b).getTime(),
      ),
    [byDate],
  );

  const calorieAdherence = (() => {
    if (!scopedDates.length) return 0;
    let pass = 0;
    for (const dayKey of scopedDates) {
      const dayLogs = byDate[dayKey] ?? [];
      const gymDone = dayLogs.some(
        (x) => x.habitId === habitMap["Gym Session"] && x.value >= 1,
      );
      const calorieLog = dayLogs.find((x) =>
        gymDone
          ? x.habitId === habitMap["Calories (Gym Day)"]
          : x.habitId === habitMap["Calories (Rest Day)"],
      );
      const target = gymDone ? 2800 : 2100;
      if (calorieLog && calorieLog.value <= target) pass += 1;
    }
    return Math.round((pass / scopedDates.length) * 100);
  })();

  const proteinConsistency = (() => {
    if (!scopedDates.length) return 0;
    let pass = 0;
    for (const dayKey of scopedDates) {
      const dayLogs = byDate[dayKey] ?? [];
      if (
        dayLogs.some(
          (x) => x.habitId === habitMap["Hit 185g Protein"] && x.value >= 185,
        )
      ) {
        pass += 1;
      }
    }
    return Math.round((pass / scopedDates.length) * 100);
  })();

  const trainingSessions = (() => {
    return scopedLogs.filter(
      (x) => x.habitId === habitMap["Gym Session"] && x.value >= 1,
    ).length;
  })();

  const chartData = useMemo(() => {
    const weightLogs = logs
      .filter((x) => x.habitId === habitMap["Weigh-in"])
      .sort(
        (a, b) =>
          parseDayMonthYear(a.date).getTime() - parseDayMonthYear(b.date).getTime(),
      );

    if (!weightLogs.length) {
      return {
        labels: ["W5", "W4", "W3", "W2", "W1"],
        actual: expectedCurve,
      };
    }

    if (timeView === "daily") {
      const last = weightLogs.slice(-7);
      return {
        labels: last.map((row) => row.date),
        actual: last.map((row) => Number(row.value)),
      };
    }

    const grouped = new Map<string, number[]>();
    for (const row of weightLogs) {
      const d = parseDayMonthYear(row.date);
      const key = timeView === "weekly" ? weekKey(d) : monthKey(d);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(Number(row.value));
    }

    const sortedKeys = Array.from(grouped.keys()).sort();
    const trimmedKeys = sortedKeys.slice(-(timeView === "weekly" ? 6 : 6));
    const averages = trimmedKeys.map((key) => {
      const values = grouped.get(key) ?? [];
      const total = values.reduce((sum, value) => sum + value, 0);
      return Number((total / Math.max(1, values.length)).toFixed(2));
    });
    return {
      labels: trimmedKeys,
      actual: averages,
    };
  }, [habitMap, logs, timeView]);

  const grade = (() => {
    const trainingTarget = timeView === "daily" ? 1 : timeView === "weekly" ? 4 : 16;
    const trainingScore = clamp(trainingSessions / trainingTarget, 0, 1) * 30;
    const nutritionScore =
      ((calorieAdherence + proteinConsistency) / 2 / 100) * 40;
    const supplementsScore = 20;
    const recoveryScore = 8;
    const total =
      trainingScore + nutritionScore + supplementsScore + recoveryScore;
    if (total >= 85) return "A";
    if (total >= 70) return "B";
    if (total >= 55) return "C";
    return "Missed";
  })();

  const expectedSeries = useMemo(() => {
    const len = chartData.labels.length || 5;
    if (len <= expectedCurve.length) {
      return expectedCurve.slice(expectedCurve.length - len);
    }
    return Array(len - expectedCurve.length)
      .fill(expectedCurve[0])
      .concat(expectedCurve);
  }, [chartData.labels.length]);

  const Card = ({ title, value }: { title: string; value: string }) => (
    <View style={styles.card}>
      <Text style={styles.secondary}>{title}</Text>
      <Text style={styles.primary}>{value}</Text>
    </View>
  );

  const periodLabel = timeView === "daily" ? "Daily" : timeView === "weekly" ? "Weekly" : "Monthly";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text style={styles.header}>Phase Progress: Week 5 of 5 - Peak Bulk</Text>

      <View style={styles.segmentRow}>
        {(["daily", "weekly", "monthly"] as TimeView[]).map((value) => {
          const selected = timeView === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.segment, selected && styles.segmentActive]}
              onPress={() => setTimeView(value)}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>
                {value[0].toUpperCase() + value.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.grid}>
        <Card title={`${periodLabel} Calorie Adherence`} value={`${calorieAdherence}%`} />
        <Card title={`${periodLabel} Protein Consistency`} value={`${proteinConsistency}%`} />
        <Card title={`${periodLabel} Training Sessions`} value={`${trainingSessions}`} />
      </View>

      <View style={styles.card}>
        <Text style={styles.primary}>{`${periodLabel} Weight Trend (Actual vs Expected)`}</Text>
        <LineChart
          width={chartWidth}
          height={220}
          data={{
            labels: chartData.labels,
            datasets: [
              {
                data: chartData.actual.length ? chartData.actual : expectedCurve,
                color: () => theme.colors.accent,
                strokeWidth: 2,
              },
              {
                data: expectedSeries,
                color: () => "#A1A1AA",
                strokeWidth: 2,
              },
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
        <Text style={styles.secondary}>{`${periodLabel} Phase Completion Score`}</Text>
        <Text style={styles.primary}>{grade}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  header: { color: theme.colors.textPrimary, fontSize: 18, marginBottom: 10, fontWeight: "700" },
  segmentRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  segment: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  segmentActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  segmentText: { color: theme.colors.textPrimary, fontWeight: "600" },
  segmentTextActive: { color: "#FFFFFF" },
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
