import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
    getHabitLogsByHabitIds,
    getHabitsByNames,
    parseDayMonthYear,
    getTargetsWithHabits,
} from "../db/db-repo";
import { theme } from "../theme/theme";

const GREEN = "#22C55E";
const RED = "#EF4444";

export default function TargetsScreen() {
  const [rows, setRows] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const targets = await getTargetsWithHabits();
        const habits = await getHabitsByNames([
          "Gym Session",
          "Football Session",
          "Hit 185g Protein",
          "Calories (Gym Day)",
          "Calories (Rest Day)",
          "Water Intake (ml)",
        ]);
        const habitIds = habits.map((h) => h.id);
        const allLogs = await getHabitLogsByHabitIds(habitIds);
        if (!active) return;
        setRows(targets);
        setLogs(allLogs);
      })();
      return () => {
        active = false;
      };
    }, []),
  );

  const referenceDate = useMemo(() => {
    if (!logs.length) return null;
    const sorted = Array.from(new Set(logs.map((l) => l.date))).sort(
      (a, b) => parseDayMonthYear(a).getTime() - parseDayMonthYear(b).getTime(),
    );
    return sorted[sorted.length - 1] ?? null;
  }, [logs]);

  const referenceLogs = useMemo(
    () => (referenceDate ? logs.filter((l) => l.date === referenceDate) : []),
    [logs, referenceDate],
  );

  const countLogs = (habitName: string, minValue = 1) => {
    const target = rows.find((r) => r.habitName === habitName);
    if (!target) return 0;
    return logs.filter(
      (l) => l.habitId === target.habitId && l.value >= minValue,
    ).length;
  };

  const proteinHitDays = (() => {
    const target = rows.find((r) => r.habitName === "Hit 185g Protein");
    if (!target) return 0;
    return new Set(
      logs
        .filter((l) => l.habitId === target.habitId && l.value >= 185)
        .map((l) => l.date),
    ).size;
  })();

  const dailyValue = (habitName: string) => {
    const t = rows.find((r) => r.habitName === habitName);
    if (!t) return null;
    const found = referenceLogs.find((l) => l.habitId === t.habitId);
    return found?.value ?? null;
  };

  const getTarget = (habitName: string, period: string, fallback: number) => {
    return (
      rows.find((r) => r.habitName === habitName && r.period === period)
        ?.targetValue ?? fallback
    );
  };

  const Progress = ({
    label,
    done,
    target,
    mode,
  }: {
    label: string;
    done: number;
    target: number;
    mode: "min" | "max";
  }) => {
    const hasLog = done > 0 || mode === "max";
    const pct = Math.max(0, Math.min(100, (done / target) * 100));
    const exceededBad = mode === "max" && done > target;
    const unmet = mode === "min" && done < target;
    const barColor =
      exceededBad || unmet ? RED : done > target ? GREEN : theme.colors.accent;

    return (
      <View style={styles.card}>
        <Text style={styles.primary}>{label}</Text>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { width: `${pct}%`, backgroundColor: barColor },
            ]}
          />
        </View>
        <Text
          style={[styles.secondary, (exceededBad || unmet) && { color: RED }]}
        >
          {mode === "max"
            ? done > target
              ? `${Math.round(done - target)} over target`
              : `${Math.round(target - done)} remaining`
            : done >= target
              ? `On track`
              : hasLog
                ? `${Math.round(target - done)} remaining`
                : `Unmet today`}
        </Text>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text style={styles.title}>Global Targets (5 Weeks)</Text>

      <Progress
        label="Gym Sessions (20)"
        done={countLogs("Gym Session")}
        target={getTarget("Gym Session", "global_5w", 20)}
        mode="min"
      />
      <Progress
        label="Football Sessions (5)"
        done={countLogs("Football Session")}
        target={getTarget("Football Session", "global_5w", 5)}
        mode="min"
      />
      <Progress
        label="Protein Days ≥185g (35)"
        done={proteinHitDays}
        target={getTarget("Hit 185g Protein", "global_5w", 35)}
        mode="min"
      />

      <Text style={styles.title}>Weekly / Daily Baselines (Week 5)</Text>
      <Text style={styles.secondary}>
        Using logs from: {referenceDate ?? "N/A"}
      </Text>
      <Progress
        label="Gym Day Calories (≤2800)"
        done={dailyValue("Calories (Gym Day)") ?? 0}
        target={getTarget("Calories (Gym Day)", "daily_baseline", 2800)}
        mode="max"
      />
      <Progress
        label="Rest Day Calories (≤2100)"
        done={dailyValue("Calories (Rest Day)") ?? 0}
        target={getTarget("Calories (Rest Day)", "daily_baseline", 2100)}
        mode="max"
      />
      <Progress
        label="Protein Floor (≥185g)"
        done={dailyValue("Hit 185g Protein") ?? 0}
        target={getTarget("Hit 185g Protein", "daily_baseline", 185)}
        mode="min"
      />
      <Progress
        label="Water (≥3.5L)"
        done={dailyValue("Water Intake (ml)") ?? 0}
        target={getTarget("Water Intake (ml)", "daily_baseline", 3500)}
        mode="min"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 10,
  },
  primary: { color: theme.colors.textPrimary, marginBottom: 8 },
  secondary: { color: theme.colors.textSecondary, marginTop: 8 },
  track: {
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
    overflow: "hidden",
  },
  fill: { height: 10, borderRadius: 6 },
});
