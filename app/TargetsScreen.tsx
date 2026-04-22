import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
  getHabitLogsByHabitIds,
  getHabitsByNames,
  getTargetsWithHabits,
  parseDayMonthYear,
} from "../db/db-repo";
import { useAppTheme } from "../state/theme-provider";

const GREEN = "#22C55E";
const RED = "#EF4444";

type LogRow = { habitId: number; date: string; value: number };
type TargetRow = {
  habitId: number;
  habitName: string;
  period: string;
  targetValue: number;
};

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export default function TargetsScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [rows, setRows] = useState<TargetRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const targets = (await getTargetsWithHabits()) as TargetRow[];
        const habits = await getHabitsByNames([
          "Gym Session",
          "Football Session",
          "Hit 185g Protein",
          "Calories (Gym Day)",
          "Calories (Rest Day)",
          "Water Intake (ml)",
        ]);
        const habitIds = habits.map((h) => h.id);
        const allLogs = (await getHabitLogsByHabitIds(habitIds)) as LogRow[];
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

  const referenceDateObj = useMemo(
    () => (referenceDate ? startOfDay(parseDayMonthYear(referenceDate)) : null),
    [referenceDate],
  );

  const logsInLastDays = useCallback(
    (days: number) => {
      if (!referenceDateObj) return [];
      const maxDiff = (days - 1) * 24 * 60 * 60 * 1000;
      return logs.filter((row) => {
        const rowDate = startOfDay(parseDayMonthYear(row.date));
        const diff = referenceDateObj.getTime() - rowDate.getTime();
        return diff >= 0 && diff <= maxDiff;
      });
    },
    [logs, referenceDateObj],
  );

  const referenceLogs = useMemo(
    () => (referenceDate ? logs.filter((l) => l.date === referenceDate) : []),
    [logs, referenceDate],
  );

  const countLogs = useCallback(
    (habitName: string, options?: { minValue?: number; days?: number }) => {
      const target = rows.find((r) => r.habitName === habitName);
      if (!target) return 0;
      const minValue = options?.minValue ?? 1;
      const source = options?.days ? logsInLastDays(options.days) : logs;
      return source.filter(
        (l) => l.habitId === target.habitId && l.value >= minValue,
      ).length;
    },
    [logs, logsInLastDays, rows],
  );

  const proteinHitDays = useCallback(
    (days?: number) => {
      const target = rows.find((r) => r.habitName === "Hit 185g Protein");
      if (!target) return 0;
      const source = days ? logsInLastDays(days) : logs;
      return new Set(
        source
          .filter((l) => l.habitId === target.habitId && l.value >= 185)
          .map((l) => l.date),
      ).size;
    },
    [logs, logsInLastDays, rows],
  );

  const dailyValue = (habitName: string) => {
    const target = rows.find((r) => r.habitName === habitName);
    if (!target) return null;
    const found = referenceLogs.find((l) => l.habitId === target.habitId);
    return found?.value ?? null;
  };

  const getTarget = (habitName: string, period: string, fallback: number) =>
    rows.find((r) => r.habitName === habitName && r.period === period)
      ?.targetValue ?? fallback;

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
    const pct = Math.max(0, Math.min(100, (done / target) * 100));
    const exceededBad = mode === "max" && done > target;
    const unmet = mode === "min" && done < target;
    const barColor =
      exceededBad || unmet ? RED : done > target ? GREEN : theme.accent;

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
              : `${Math.round(target - done)} remaining (unmet so far)`}
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
        done={proteinHitDays()}
        target={getTarget("Hit 185g Protein", "global_5w", 35)}
        mode="min"
      />

      <Text style={styles.title}>Weekly Targets (Last 7 Days)</Text>
      <Progress
        label="Gym Sessions (weekly)"
        done={countLogs("Gym Session", { days: 7 })}
        target={getTarget("Gym Session", "weekly", 4)}
        mode="min"
      />
      <Progress
        label="Football Sessions (weekly)"
        done={countLogs("Football Session", { days: 7 })}
        target={getTarget("Football Session", "weekly", 1)}
        mode="min"
      />
      <Progress
        label="Protein Days ≥185g (weekly)"
        done={proteinHitDays(7)}
        target={getTarget("Hit 185g Protein", "weekly", 7)}
        mode="min"
      />

      <Text style={styles.title}>Monthly Targets (Last 30 Days)</Text>
      <Progress
        label="Gym Sessions (monthly)"
        done={countLogs("Gym Session", { days: 30 })}
        target={getTarget("Gym Session", "monthly", 16)}
        mode="min"
      />
      <Progress
        label="Football Sessions (monthly)"
        done={countLogs("Football Session", { days: 30 })}
        target={getTarget("Football Session", "monthly", 4)}
        mode="min"
      />
      <Progress
        label="Protein Days ≥185g (monthly)"
        done={proteinHitDays(30)}
        target={getTarget("Hit 185g Protein", "monthly", 30)}
        mode="min"
      />

      <Text style={styles.title}>Daily Baselines (Latest Day)</Text>
      <Text style={styles.secondary}>Using logs from: {referenceDate ?? "N/A"}</Text>
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

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background, padding: 16 },
    title: {
      color: theme.textPrimary,
      fontSize: 18,
      marginBottom: 10,
      marginTop: 8,
      fontWeight: "700",
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 10,
    },
    primary: { color: theme.textPrimary, marginBottom: 8 },
    secondary: { color: theme.textSecondary, marginTop: 8 },
    track: {
      height: 10,
      backgroundColor: "#E5E7EB",
      borderRadius: 6,
      overflow: "hidden",
    },
    fill: { height: 10, borderRadius: 6 },
  });

