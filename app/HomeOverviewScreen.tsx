import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
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
  getHabitLogsByHabitIds,
  getHabitsByNames,
  getTargetsWithHabits,
  insertLogAtDate,
  updateLog,
  type HabitLogRow,
} from "../db/db-repo";
import { useAppTheme } from "../state/theme-provider";
import type { HomeStackParamList } from "./HomeLogsScreen";
import MorningPulseModal from "./MorningPulseModal";

const CHICAGO_TRIP_DATE = new Date("2026-05-25T00:00:00");
const PHASE_START = new Date("2026-04-07T00:00:00");
const PROTEIN_TARGET = 185;
const WATER_TARGET = 3500;

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

type DayType = "Gym" | "Football" | "Rest";

export default function HomeOverviewScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const [showMorningPulse, setShowMorningPulse] = useState(false);
  const [todayDate, setTodayDate] = useState("");
  const [dayType, setDayType] = useState<DayType>("Gym");
  const [proteinG, setProteinG] = useState(0);
  const [waterMl, setWaterMl] = useState(0);
  const [selectedSupplements, setSelectedSupplements] = useState<string[]>([]);
  const [customProteinInput, setCustomProteinInput] = useState("");
  const [customWaterInput, setCustomWaterInput] = useState("");
  const [showCustomProtein, setShowCustomProtein] = useState(false);
  const [showCustomWater, setShowCustomWater] = useState(false);
  const [globalTargets, setGlobalTargets] = useState({
    gymDone: 0, gymTarget: 20,
    footballDone: 0, footballTarget: 5,
    proteinDone: 0, proteinTarget: 35,
  });

  // Store habitIds and existing logs for upserts
  const [habitIds, setHabitIds] = useState<Record<string, number>>({});
  const [existingByHabitId, setExistingByHabitId] = useState<Map<number, HabitLogRow>>(new Map());

  const daysUntilChicago = useMemo(() => {
    const diffMs = CHICAGO_TRIP_DATE.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, []);

  const phasePct = useMemo(() => {
    const total = CHICAGO_TRIP_DATE.getTime() - PHASE_START.getTime();
    const elapsed = new Date().getTime() - PHASE_START.getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }, []);

  const caloriesTarget = dayType === "Rest" ? 2100 : 2800;

  const loadDashboard = useCallback(async () => {
    const date = formatDayMonthYear(new Date());
    setTodayDate(date);

    const habitNames = [
      "Calories (Gym Day)", "Calories (Rest Day)", "Hit 185g Protein",
      "Weigh-in", "Gym Session", "Football Session", "Log Sleep",
      "Whoop Recovery %", "Water Intake (ml)",
    ];
    const habits = await getHabitsByNames(habitNames);
    const ids = Object.fromEntries(habits.map((h) => [h.name, h.id])) as Record<string, number>;
    setHabitIds(ids);

    const allLogs = await getHabitLogsByHabitIds(habits.map((h) => h.id));
    const todayLogs = allLogs.filter((l) => l.date === date);
    const byHabitId = new Map(todayLogs.map((l) => [l.habitId, l]));
    setExistingByHabitId(byHabitId);

    // Check morning pulse: show if no weight and no sleep logged today
    const hasWeight = byHabitId.has(ids["Weigh-in"]);
    const hasSleep = byHabitId.has(ids["Log Sleep"]);
    if (!hasWeight && !hasSleep) setShowMorningPulse(true);

    // Protein & water
    setProteinG(byHabitId.get(ids["Hit 185g Protein"])?.value ?? 0);
    setWaterMl(byHabitId.get(ids["Water Intake (ml)"])?.value ?? 0);

    // Day type from existing log notes
    const gymCalLog = byHabitId.get(ids["Calories (Gym Day)"]);
    const restCalLog = byHabitId.get(ids["Calories (Rest Day)"]);
    const footballLog = byHabitId.get(ids["Football Session"]);
    if (footballLog?.value && footballLog.value >= 1) setDayType("Football");
    else if (restCalLog) setDayType("Rest");
    else setDayType("Gym");

    // Parse supplement state from existing calories log notes
    const calLog = gymCalLog ?? restCalLog;
    if (calLog?.notes) {
      const match = calLog.notes.match(/Supplements:([^|]+)/);
      const supp = match?.[1]?.split(",").map((x) => x.trim()).filter((x) => x && x !== "None") ?? [];
      setSelectedSupplements(supp);
    } else {
      setSelectedSupplements([]);
    }

    // Global targets
    const targets = await getTargetsWithHabits();
    const gymTarget = targets.find((t) => t.habitName === "Gym Session" && t.period === "global_5w")?.targetValue ?? 20;
    const footballTarget = targets.find((t) => t.habitName === "Football Session" && t.period === "global_5w")?.targetValue ?? 5;
    const proteinTarget = targets.find((t) => t.habitName === "Hit 185g Protein" && t.period === "global_5w")?.targetValue ?? 35;
    const gymDone = allLogs.filter((l) => l.habitId === ids["Gym Session"] && l.value >= 1).length;
    const footballDone = allLogs.filter((l) => l.habitId === ids["Football Session"] && l.value >= 1).length;
    const proteinDone = new Set(allLogs.filter((l) => l.habitId === ids["Hit 185g Protein"] && l.value >= 185).map((l) => l.date)).size;
    setGlobalTargets({ gymDone, gymTarget, footballDone, footballTarget, proteinDone, proteinTarget });
  }, []);

  useFocusEffect(useCallback(() => { void loadDashboard(); }, [loadDashboard]));

  // Generic upsert helper
  const upsert = useCallback(async (habitName: string, value: number, notes?: string) => {
    const habitId = habitIds[habitName];
    if (!habitId) return;
    const existing = existingByHabitId.get(habitId);
    const date = formatDayMonthYear(new Date());
    if (existing) {
      await updateLog(existing.id, value, notes ?? existing.notes ?? undefined);
      setExistingByHabitId((prev) => {
        const next = new Map(prev);
        next.set(habitId, { ...existing, value });
        return next;
      });
    } else {
      await insertLogAtDate(habitId, date, value, notes);
      // Reload to capture new log ID
      void loadDashboard();
    }
  }, [habitIds, existingByHabitId, loadDashboard]);

  const onAddProtein = async (amount: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = proteinG + amount;
    setProteinG(newVal);
    void upsert("Hit 185g Protein", newVal);
    if (newVal >= PROTEIN_TARGET && proteinG < PROTEIN_TARGET) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const onAddWater = async (amount: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVal = waterMl + amount;
    setWaterMl(newVal);
    void upsert("Water Intake (ml)", newVal);
    if (newVal >= WATER_TARGET && waterMl < WATER_TARGET) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const onCustomProtein = async () => {
    const val = Number(customProteinInput);
    if (!Number.isNaN(val) && val > 0) {
      await onAddProtein(val);
      setCustomProteinInput("");
      setShowCustomProtein(false);
    }
  };

  const onCustomWater = async () => {
    const val = Number(customWaterInput);
    if (!Number.isNaN(val) && val > 0) {
      await onAddWater(val);
      setCustomWaterInput("");
      setShowCustomWater(false);
    }
  };

  const onToggleSupplement = async (supp: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSupplements((prev) => {
      const next = prev.includes(supp) ? prev.filter((x) => x !== supp) : [...prev, supp];
      // Persist to existing calories log notes in background
      const gymHabitId = habitIds["Calories (Gym Day)"];
      const restHabitId = habitIds["Calories (Rest Day)"];
      const calLog = existingByHabitId.get(gymHabitId) ?? existingByHabitId.get(restHabitId);
      if (calLog) {
        const suppStr = next.length ? next.join(", ") : "None";
        let notes = calLog.notes ?? "";
        if (notes.includes("Supplements:")) {
          notes = notes.replace(/Supplements:[^|]+/, `Supplements:${suppStr}`);
        } else {
          notes = notes ? `${notes} | Supplements:${suppStr}` : `Supplements:${suppStr}`;
        }
        void updateLog(calLog.id, calLog.value, notes);
      }
      return next;
    });
  };

  const proteinPct = Math.min(100, (proteinG / PROTEIN_TARGET) * 100);
  const waterPct = Math.min(100, (waterMl / WATER_TARGET) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <MorningPulseModal
        visible={showMorningPulse}
        onClose={() => { setShowMorningPulse(false); void loadDashboard(); }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        {/* ── COUNTDOWN ── */}
        <View style={styles.countdownSection}>
          <Text style={styles.countdownNumber}>{daysUntilChicago}</Text>
          <Text style={styles.countdownLabel}>Days to Chicago</Text>
          <Text style={styles.countdownSub}>{todayDate}</Text>
          <View style={styles.phaseTrack}>
            <View style={[styles.phaseFill, { width: `${phasePct}%` }]} />
          </View>
          <Text style={styles.phaseLabel}>{phasePct}% through 7-week phase</Text>
        </View>

        {/* ── DAY TYPE ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Day Type</Text>
          <View style={styles.segRow}>
            {(["Gym", "Football", "Rest"] as DayType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.seg, dayType === t && styles.segActive]}
                onPress={async () => {
                  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setDayType(t);
                }}
              >
                <Text style={[styles.segText, dayType === t && styles.segTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.calTarget}>Target: {caloriesTarget} kcal</Text>
        </View>

        {/* ── PROTEIN STEPPER ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Protein</Text>
            <Text style={[styles.stepperValue, proteinG >= PROTEIN_TARGET && styles.stepperValueDone]}>
              {Math.round(proteinG)}g / {PROTEIN_TARGET}g
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${proteinPct}%` }, proteinG >= PROTEIN_TARGET && styles.progressFillDone]} />
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onAddProtein(25)}>
              <Text style={styles.stepBtnText}>+25g</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onAddProtein(40)}>
              <Text style={styles.stepBtnText}>+40g</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, showCustomProtein && styles.stepBtnActive]}
              onPress={() => setShowCustomProtein((v) => !v)}
            >
              <Text style={styles.stepBtnText}>Custom</Text>
            </TouchableOpacity>
          </View>
          {showCustomProtein && (
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={customProteinInput}
                onChangeText={setCustomProteinInput}
                placeholder="grams"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.customAddBtn} onPress={onCustomProtein}>
                <Text style={styles.customAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── WATER STEPPER ── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Water</Text>
            <Text style={[styles.stepperValue, waterMl >= WATER_TARGET && styles.stepperValueDone]}>
              {Math.round(waterMl)}ml / {WATER_TARGET}ml
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${waterPct}%` }, waterMl >= WATER_TARGET && styles.progressFillDone]} />
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onAddWater(250)}>
              <Text style={styles.stepBtnText}>+250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onAddWater(500)}>
              <Text style={styles.stepBtnText}>+500ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.stepBtn, showCustomWater && styles.stepBtnActive]}
              onPress={() => setShowCustomWater((v) => !v)}
            >
              <Text style={styles.stepBtnText}>Custom</Text>
            </TouchableOpacity>
          </View>
          {showCustomWater && (
            <View style={styles.customRow}>
              <TextInput
                style={styles.customInput}
                value={customWaterInput}
                onChangeText={setCustomWaterInput}
                placeholder="ml"
                placeholderTextColor={theme.textSecondary}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.customAddBtn} onPress={onCustomWater}>
                <Text style={styles.customAddBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── SUPPLEMENTS ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Supplements</Text>
          <View style={styles.suppGrid}>
            {SUPPLEMENTS.map((supp) => {
              const active = selectedSupplements.includes(supp);
              return (
                <TouchableOpacity
                  key={supp}
                  style={[styles.suppChip, active && styles.suppChipActive]}
                  onPress={() => onToggleSupplement(supp)}
                >
                  <Text style={[styles.suppText, active && styles.suppTextActive]}>{supp}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── GLOBAL GOALS ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>7-Week Goals</Text>
          <GoalRow
            label="Gym Sessions"
            done={globalTargets.gymDone}
            target={globalTargets.gymTarget}
            accentColor={theme.accent}
            textSecondary={theme.textSecondary}
            textPrimary={theme.textPrimary}
          />
          <GoalRow
            label="Football Sessions"
            done={globalTargets.footballDone}
            target={globalTargets.footballTarget}
            accentColor={theme.accent}
            textSecondary={theme.textSecondary}
            textPrimary={theme.textPrimary}
          />
          <GoalRow
            label="Protein Days ≥185g"
            done={globalTargets.proteinDone}
            target={globalTargets.proteinTarget}
            accentColor={theme.accent}
            textSecondary={theme.textSecondary}
            textPrimary={theme.textPrimary}
          />
        </View>

        {/* ── CTA ── */}
        <TouchableOpacity style={styles.logBtn} onPress={() => navigation.navigate("DailyLog")}>
          <Text style={styles.logBtnText}>Log Today</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.morningPulseBtn}
          onPress={() => setShowMorningPulse(true)}
        >
          <Text style={styles.morningPulseBtnText}>Morning Pulse</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalRow({
  label, done, target, accentColor, textSecondary, textPrimary,
}: {
  label: string; done: number; target: number;
  accentColor: string; textSecondary: string; textPrimary: string;
}) {
  const pct = Math.min(100, (done / target) * 100);
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
        <Text style={{ color: textPrimary, fontSize: 13 }}>{label}</Text>
        <Text style={{ color: textSecondary, fontSize: 13 }}>{done}/{target}</Text>
      </View>
      <View style={{ height: 6, backgroundColor: "#333333", borderRadius: 3, overflow: "hidden" }}>
        <View style={{ height: 6, width: `${pct}%`, backgroundColor: accentColor, borderRadius: 3 }} />
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.background },
    container: { padding: 16, paddingBottom: 40 },

    // Countdown
    countdownSection: { alignItems: "center", marginBottom: 20, paddingVertical: 8 },
    countdownNumber: { color: theme.accent, fontSize: 80, fontWeight: "900", lineHeight: 84 },
    countdownLabel: { color: theme.accent, fontSize: 22, fontWeight: "800", marginBottom: 4 },
    countdownSub: { color: theme.textSecondary, fontSize: 13, marginBottom: 12 },
    phaseTrack: { width: "100%", height: 8, backgroundColor: theme.surface, borderRadius: 4, overflow: "hidden", marginBottom: 4 },
    phaseFill: { height: 8, backgroundColor: theme.accent, borderRadius: 4 },
    phaseLabel: { color: theme.textSecondary, fontSize: 12 },

    // Cards
    card: { backgroundColor: theme.surface, borderRadius: 14, padding: 16, marginBottom: 14 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    cardTitle: { color: theme.textPrimary, fontSize: 16, fontWeight: "700" },
    calTarget: { color: theme.textSecondary, fontSize: 13, marginTop: 8 },

    // Day type segment
    segRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    seg: { flex: 1, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
    segActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    segText: { color: theme.textPrimary, fontWeight: "600" },
    segTextActive: { color: "#FFFFFF" },

    // Steppers
    stepperValue: { color: theme.textSecondary, fontSize: 14, fontWeight: "600" },
    stepperValueDone: { color: "#22C55E" },
    progressTrack: { height: 10, backgroundColor: theme.background, borderRadius: 5, overflow: "hidden", marginBottom: 12 },
    progressFill: { height: 10, backgroundColor: theme.accent, borderRadius: 5 },
    progressFillDone: { backgroundColor: "#22C55E" },
    stepperRow: { flexDirection: "row", gap: 8 },
    stepBtn: { flex: 1, backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1, borderRadius: 8, paddingVertical: 10, alignItems: "center" },
    stepBtnActive: { borderColor: theme.accent },
    stepBtnText: { color: theme.textPrimary, fontWeight: "700", fontSize: 14 },
    customRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    customInput: { flex: 1, backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border, borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 15 },
    customAddBtn: { backgroundColor: theme.accent, borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
    customAddBtnText: { color: "#FFFFFF", fontWeight: "800" },

    // Supplements
    suppGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
    suppChip: { backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
    suppChipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    suppText: { color: theme.textSecondary, fontWeight: "600", fontSize: 13 },
    suppTextActive: { color: "#FFFFFF" },

    // CTAs
    logBtn: { backgroundColor: theme.accent, borderRadius: 12, paddingVertical: 18, alignItems: "center", marginBottom: 10 },
    logBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 17 },
    morningPulseBtn: { backgroundColor: theme.surface, borderRadius: 12, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: theme.border },
    morningPulseBtnText: { color: theme.textPrimary, fontWeight: "700", fontSize: 15 },
  });
