import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  formatDayMonthYear,
  getHabitsByNames,
  getLogsForDate,
  insertLogAtDate,
  updateLog,
  type HabitLogRow,
} from "../db/db-repo";
import type { HomeStackParamList } from "./HomeLogsScreen";
import { theme } from "../theme/theme";

type DayType = "Gym" | "Football" | "Rest";
const CHICAGO_TRIP_DATE = new Date("2026-05-25T00:00:00");
const WORKOUT_OPTIONS = ["Pull", "Push", "Legs", "Abs", "Rest"] as const;
const SUPPLEMENTS = [
  "Creatine 10g",
  "Whey",
  "L-Citrulline",
  "Sona Electrolytes",
  "PHN Z",
  "Sona Zinc",
  "Sona Garlic",
  "Beta Carotene",
] as const;

function parseDailyBundle(notes: string | null): {
  dayType: DayType | null;
  workout: (typeof WORKOUT_OPTIONS)[number] | null;
  supplements: string[];
  freeNotes: string;
} {
  if (!notes) return { dayType: null, workout: null, supplements: [], freeNotes: "" };
  const dayTypeMatch = notes.match(/DayType:([^|]+)/);
  const workoutMatch = notes.match(/Workout:([^|]+)/);
  const supplementsMatch = notes.match(/Supplements:([^|]+)/);
  const notesMatch = notes.match(/Notes:(.*)$/);

  const dayTypeRaw = dayTypeMatch?.[1]?.trim() ?? "";
  const workoutRaw = workoutMatch?.[1]?.trim() ?? "";

  const parsedDayType = (["Gym", "Football", "Rest"] as DayType[]).includes(
    dayTypeRaw as DayType,
  )
    ? (dayTypeRaw as DayType)
    : null;
  const parsedWorkout = WORKOUT_OPTIONS.includes(workoutRaw as (typeof WORKOUT_OPTIONS)[number])
    ? (workoutRaw as (typeof WORKOUT_OPTIONS)[number])
    : null;

  const supplements =
    supplementsMatch?.[1]
      ?.split(",")
      .map((x) => x.trim())
      .filter((x) => x && x !== "None" && SUPPLEMENTS.includes(x as (typeof SUPPLEMENTS)[number])) ?? [];

  return {
    dayType: parsedDayType,
    workout: parsedWorkout,
    supplements,
    freeNotes: notesMatch?.[1]?.trim() ?? "",
  };
}

export default function DailyLogScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [dayType, setDayType] = useState<DayType>("Gym");
  const [caloriesIn, setCaloriesIn] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [workoutDone, setWorkoutDone] =
    useState<(typeof WORKOUT_OPTIONS)[number]>("Pull");
  const [sleepHours, setSleepHours] = useState("");
  const [whoopRecovery, setWhoopRecovery] = useState("");
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [dailyNotes, setDailyNotes] = useState("");
  const [statusText, setStatusText] = useState("");

  const daysUntilChicago = useMemo(() => {
    const diffMs = CHICAGO_TRIP_DATE.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, []);

  const toggleSupplement = (item: string) => {
    setSelectedSupplements((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  };

  const loadTodayIntoForm = useCallback(async () => {
    const date = formatDayMonthYear(new Date());
    const habits = await getHabitsByNames([
      "Calories (Gym Day)",
      "Calories (Rest Day)",
      "Hit 185g Protein",
      "Weigh-in",
      "Gym Session",
      "Football Session",
      "Log Sleep",
      "Whoop Recovery %",
    ]);
    const habitIdByName = Object.fromEntries(
      habits.map((h) => [h.name, h.id]),
    ) as Record<string, number>;
    const logs = await getLogsForDate(date);
    const byHabitId = new Map(logs.map((l) => [l.habitId, l]));

    const gymCal = byHabitId.get(habitIdByName["Calories (Gym Day)"])?.value;
    const restCal = byHabitId.get(habitIdByName["Calories (Rest Day)"])?.value;
    const protein = byHabitId.get(habitIdByName["Hit 185g Protein"])?.value;
    const weight = byHabitId.get(habitIdByName["Weigh-in"])?.value;
    const sleep = byHabitId.get(habitIdByName["Log Sleep"])?.value;
    const whoop = byHabitId.get(habitIdByName["Whoop Recovery %"])?.value;
    const gymSession = byHabitId.get(habitIdByName["Gym Session"])?.value;
    const footballSession = byHabitId.get(habitIdByName["Football Session"])?.value;

    setCaloriesIn(
      gymCal !== undefined
        ? String(gymCal)
        : restCal !== undefined
          ? String(restCal)
          : "",
    );
    setProteinG(protein !== undefined ? String(protein) : "");
    setWeightKg(weight !== undefined ? String(weight) : "");
    setSleepHours(sleep !== undefined ? String(sleep) : "");
    setWhoopRecovery(whoop !== undefined ? String(whoop) : "");

    const caloriesLog =
      byHabitId.get(habitIdByName["Calories (Gym Day)"]) ??
      byHabitId.get(habitIdByName["Calories (Rest Day)"]);
    const parsed = parseDailyBundle(caloriesLog?.notes ?? null);

    if (parsed.dayType) setDayType(parsed.dayType);
    else if (footballSession && footballSession >= 1) setDayType("Football");
    else if (gymSession && gymSession >= 1) setDayType("Gym");
    else setDayType(restCal !== undefined ? "Rest" : "Gym");

    if (parsed.workout) setWorkoutDone(parsed.workout);
    setSelectedSupplements(parsed.supplements);
    setDailyNotes(parsed.freeNotes);
    setStatusText("");
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTodayIntoForm();
    }, [loadTodayIntoForm]),
  );

  async function upsertByHabitName(params: {
    habitIdByName: Record<string, number>;
    existingByHabitId: Map<number, HabitLogRow>;
    date: string;
    habitName: string;
    value: number | null;
    notes?: string;
  }) {
    const { habitIdByName, existingByHabitId, date, habitName, value, notes } =
      params;
    if (value === null || Number.isNaN(value)) return;
    const habitId = habitIdByName[habitName];
    if (!habitId) return;

    const existing = existingByHabitId.get(habitId);
    if (existing) {
      await updateLog(existing.id, value, notes);
    } else {
      await insertLogAtDate(habitId, date, value, notes);
    }
  }

  async function onSaveDailyLog() {
    try {
      const date = formatDayMonthYear(new Date());
      const habits = await getHabitsByNames([
        "Calories (Gym Day)",
        "Calories (Rest Day)",
        "Hit 185g Protein",
        "Weigh-in",
        "Gym Session",
        "Football Session",
        "Log Sleep",
        "Whoop Recovery %",
      ]);
      const habitIdByName = Object.fromEntries(
        habits.map((h) => [h.name, h.id]),
      ) as Record<string, number>;

      const existing = await getLogsForDate(date);
      const existingByHabitId = new Map(existing.map((l) => [l.habitId, l]));

      const noteBundle = [
        `DayType:${dayType}`,
        `Workout:${workoutDone}`,
        `Supplements:${selectedSupplements.join(", ") || "None"}`,
        dailyNotes.trim() ? `Notes:${dailyNotes.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const calorieHabit =
        dayType === "Rest" ? "Calories (Rest Day)" : "Calories (Gym Day)";

      await upsertByHabitName({
        habitIdByName,
        existingByHabitId,
        date,
        habitName: calorieHabit,
        value: caloriesIn ? Number(caloriesIn) : null,
        notes: noteBundle,
      });

      await upsertByHabitName({
        habitIdByName,
        existingByHabitId,
        date,
        habitName: "Hit 185g Protein",
        value: proteinG ? Number(proteinG) : null,
      });

      await upsertByHabitName({
        habitIdByName,
        existingByHabitId,
        date,
        habitName: "Weigh-in",
        value: weightKg ? Number(weightKg) : null,
      });

      await upsertByHabitName({
        habitIdByName,
        existingByHabitId,
        date,
        habitName: "Log Sleep",
        value: sleepHours ? Number(sleepHours) : null,
      });

      await upsertByHabitName({
        habitIdByName,
        existingByHabitId,
        date,
        habitName: "Whoop Recovery %",
        value: whoopRecovery ? Number(whoopRecovery) : null,
      });

      if (dayType === "Gym" && workoutDone !== "Rest") {
        await upsertByHabitName({
          habitIdByName,
          existingByHabitId,
          date,
          habitName: "Gym Session",
          value: 1,
          notes: `Workout: ${workoutDone}`,
        });
      }

      if (dayType === "Football") {
        await upsertByHabitName({
          habitIdByName,
          existingByHabitId,
          date,
          habitName: "Football Session",
          value: 1,
        });
      }

      setStatusText(`Saved for ${date}`);
      navigation.goBack();
    } catch (e) {
      console.error(e);
      setStatusText("Save failed");
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.countdown}>{daysUntilChicago}</Text>
        <Text style={styles.countdownLabel}>Days to Chicago</Text>

        <View style={styles.segmentRow}>
          {(["Gym", "Football", "Rest"] as DayType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.segment, dayType === type && styles.segmentActive]}
              onPress={() => setDayType(type)}
            >
              <Text
                style={[
                  styles.segmentText,
                  dayType === type && styles.segmentTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fuel</Text>
          <TextInput
            style={styles.input}
            placeholder="Calories In"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            value={caloriesIn}
            onChangeText={setCaloriesIn}
          />
          <TextInput
            style={[styles.input, styles.prominentInput]}
            placeholder="Protein (g)"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            value={proteinG}
            onChangeText={setProteinG}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Measure</Text>
          <TextInput
            style={styles.input}
            placeholder="Weight (kg)"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            value={weightKg}
            onChangeText={setWeightKg}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Train</Text>
          <View style={styles.segmentRowWrap}>
            {WORKOUT_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.segment,
                  workoutDone === item && styles.segmentActive,
                ]}
                onPress={() => setWorkoutDone(item)}
              >
                <Text
                  style={[
                    styles.segmentText,
                    workoutDone === item && styles.segmentTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recover</Text>
          <TextInput
            style={styles.input}
            placeholder="Sleep Hours"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            value={sleepHours}
            onChangeText={setSleepHours}
          />
          <TextInput
            style={styles.input}
            placeholder="Whoop Recovery %"
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType="numeric"
            value={whoopRecovery}
            onChangeText={setWhoopRecovery}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supplements</Text>
          <View style={styles.chipWrap}>
            {SUPPLEMENTS.map((item) => {
              const selected = selectedSupplements.includes(item);
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleSupplement(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notes</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Daily journal notes..."
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            value={dailyNotes}
            onChangeText={setDailyNotes}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={onSaveDailyLog}>
          <Text style={styles.saveButtonText}>Save Daily Log</Text>
        </TouchableOpacity>
        {!!statusText && <Text style={styles.status}>{statusText}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    padding: 16,
    backgroundColor: theme.colors.background,
    paddingBottom: 32,
  },
  countdown: {
    color: theme.colors.accent,
    fontSize: 56,
    fontWeight: "900",
    lineHeight: 60,
  },
  countdownLabel: {
    color: theme.colors.accent,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
  },
  segmentRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  segmentRowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  segment: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  segmentActive: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  segmentText: { color: theme.colors.textPrimary, fontWeight: "600" },
  segmentTextActive: { color: "#FFFFFF" },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 10,
  },
  prominentInput: {
    borderColor: theme.colors.accent,
    borderWidth: 2,
  },
  notesInput: { minHeight: 110, textAlignVertical: "top" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: theme.colors.background,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  chipSelected: { backgroundColor: theme.colors.accent },
  chipText: { color: theme.colors.textSecondary, fontWeight: "600" },
  chipTextSelected: { color: "#FFFFFF" },
  saveButton: {
    width: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  saveButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 17 },
  status: { color: theme.colors.textSecondary, marginTop: 10 },
});
