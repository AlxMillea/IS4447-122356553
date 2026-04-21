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
import { normalizeCategoryColor } from "../constants/category-colors";
import {
  deleteLog,
  formatDayMonthYear,
  getHabitLogsByHabitIds,
  getHabitsByNames,
  getRecordHistory,
  getTargetsWithHabits,
  parseDayMonthYear,
  updateLog,
  type RecordHistoryRow,
} from "../db/db-repo";
import { theme } from "../theme/theme";
import type { HomeStackParamList } from "./HomeLogsScreen";

const CHICAGO_TRIP_DATE = new Date("2026-05-25T00:00:00");

type TodayMetric = {
  name: string;
  value: number;
};

export default function HomeOverviewScreen() {
  const now = new Date();
  const initialTo = formatDayMonthYear(now);
  const initialFromDate = new Date(now);
  initialFromDate.setDate(now.getDate() - 7);
  const initialFrom = formatDayMonthYear(initialFromDate);

  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [todayDate, setTodayDate] = useState("");
  const [todayMetrics, setTodayMetrics] = useState<TodayMetric[]>([]);
  const [todayByName, setTodayByName] = useState<Record<string, number>>({});
  const [historyRows, setHistoryRows] = useState<RecordHistoryRow[]>([]);
  const [filterFromDate, setFilterFromDate] = useState(initialFrom);
  const [filterToDate, setFilterToDate] = useState(initialTo);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterText, setFilterText] = useState("");
  const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingNotes, setEditingNotes] = useState("");
  const [historyStatus, setHistoryStatus] = useState("");
  const [globalTargets, setGlobalTargets] = useState({
    gymDone: 0,
    gymTarget: 20,
    footballDone: 0,
    footballTarget: 5,
    proteinDone: 0,
    proteinTarget: 35,
  });

  const daysUntilChicago = useMemo(() => {
    const diffMs = CHICAGO_TRIP_DATE.getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    const date = formatDayMonthYear(new Date());
    setTodayDate(date);

    const habits = await getHabitsByNames([
      "Calories (Gym Day)",
      "Calories (Rest Day)",
      "Hit 185g Protein",
      "Weigh-in",
      "Gym Session",
      "Football Session",
      "Log Sleep",
      "Whoop Recovery %",
      "Water Intake (ml)",
    ]);

    const idByName = Object.fromEntries(
      habits.map((h) => [h.name, h.id]),
    ) as Record<string, number>;
    const nameById = Object.fromEntries(
      habits.map((h) => [h.id, h.name]),
    ) as Record<number, string>;

    const logs = await getHabitLogsByHabitIds(habits.map((h) => h.id));
    const history = await getRecordHistory();
    const todayLogs = logs.filter((l) => l.date === date);

    const todayMap: Record<string, number> = {};
    const todayRows: TodayMetric[] = [];
    for (const row of todayLogs) {
      const habitName = nameById[row.habitId];
      if (!habitName) continue;
      todayMap[habitName] = row.value;
      todayRows.push({ name: habitName, value: row.value });
    }
    setTodayByName(todayMap);
    setTodayMetrics(todayRows);
    setHistoryRows(history);

    const targets = await getTargetsWithHabits();
    const gymTarget =
      targets.find(
        (t) => t.habitName === "Gym Session" && t.period === "global_5w",
      )?.targetValue ?? 20;
    const footballTarget =
      targets.find(
        (t) => t.habitName === "Football Session" && t.period === "global_5w",
      )?.targetValue ?? 5;
    const proteinTarget =
      targets.find(
        (t) => t.habitName === "Hit 185g Protein" && t.period === "global_5w",
      )?.targetValue ?? 35;

    const gymDone = logs.filter(
      (l) => l.habitId === idByName["Gym Session"] && l.value >= 1,
    ).length;
    const footballDone = logs.filter(
      (l) => l.habitId === idByName["Football Session"] && l.value >= 1,
    ).length;
    const proteinDone = new Set(
      logs
        .filter(
          (l) => l.habitId === idByName["Hit 185g Protein"] && l.value >= 185,
        )
        .map((l) => l.date),
    ).size;

    setGlobalTargets({
      gymDone,
      gymTarget,
      footballDone,
      footballTarget,
      proteinDone,
      proteinTarget,
    });
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard]),
  );

  const proteinValue = todayByName["Hit 185g Protein"] ?? 0;
  const waterValue = todayByName["Water Intake (ml)"] ?? 0;
  const gymCalories = todayByName["Calories (Gym Day)"];
  const restCalories = todayByName["Calories (Rest Day)"];
  const caloriesValue = gymCalories ?? restCalories ?? 0;
  const caloriesTarget = gymCalories !== undefined ? 2800 : 2100;
  const trainingDone =
    (todayByName["Gym Session"] ?? 0) >= 1 ||
    (todayByName["Football Session"] ?? 0) >= 1;

  const historyCategories = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(historyRows.map((x) => x.categoryName))).sort(),
    ];
  }, [historyRows]);

  const historyCategoryColorByName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of historyRows) {
      map[row.categoryName] = normalizeCategoryColor(row.categoryColor);
    }
    return map;
  }, [historyRows]);

  const filteredHistory = useMemo(() => {
    let rows = [...historyRows];

    if (filterCategory !== "All") {
      rows = rows.filter((x) => x.categoryName === filterCategory);
    }

    const text = filterText.trim().toLowerCase();
    if (text) {
      rows = rows.filter((x) =>
        `${x.habitName} ${x.categoryName} ${x.notes ?? ""}`
          .toLowerCase()
          .includes(text),
      );
    }

    const fromParts = filterFromDate.split("/").map(Number);
    const toParts = filterToDate.split("/").map(Number);
    const hasValidFrom =
      fromParts.length === 3 && fromParts.every((v) => !Number.isNaN(v));
    const hasValidTo =
      toParts.length === 3 && toParts.every((v) => !Number.isNaN(v));
    const from = hasValidFrom ? parseDayMonthYear(filterFromDate) : null;
    const to = hasValidTo ? parseDayMonthYear(filterToDate) : null;

    if (from || to) {
      rows = rows.filter((x) => {
        const d = parseDayMonthYear(x.date);
        if (from && d < from) return false;
        if (to && d > to) return false;
        return true;
      });
    }

    rows.sort((a, b) => {
      const byDate =
        parseDayMonthYear(b.date).getTime() -
        parseDayMonthYear(a.date).getTime();
      if (byDate !== 0) return byDate;
      return b.id - a.id;
    });

    return rows;
  }, [historyRows, filterCategory, filterFromDate, filterToDate, filterText]);

  const onDeleteHistoryRow = async (logId: number) => {
    if (editingHistoryId === logId) {
      setEditingHistoryId(null);
      setEditingValue("");
      setEditingNotes("");
    }
    await deleteLog(logId);
    setHistoryStatus("Record deleted.");
    await loadDashboard();
  };

  const onStartHistoryEdit = (row: RecordHistoryRow) => {
    setEditingHistoryId(row.id);
    setEditingValue(String(row.value));
    setEditingNotes(row.notes ?? "");
    setHistoryStatus("");
  };

  const onCancelHistoryEdit = () => {
    setEditingHistoryId(null);
    setEditingValue("");
    setEditingNotes("");
  };

  const onSaveHistoryEdit = async (logId: number) => {
    const parsed = Number(editingValue);
    if (Number.isNaN(parsed)) {
      setHistoryStatus("Enter a numeric value before saving.");
      return;
    }
    await updateLog(logId, parsed, editingNotes);
    onCancelHistoryEdit();
    setHistoryStatus("Record updated.");
    await loadDashboard();
  };

  const openCategories = () => {
    navigation.getParent()?.navigate("Settings" as never);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{daysUntilChicago}</Text>
        <Text style={styles.subtitle}>Days to Chicago</Text>
        <Text style={styles.secondaryText}>{`Today: ${todayDate || "-"}`}</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{`Today's Progress`}</Text>
          <Text style={styles.rowText}>
            {proteinValue >= 185 ? "OK" : "MISS"} Protein:{" "}
            {Math.round(proteinValue)}g / 185g
          </Text>
          <Text style={styles.rowText}>
            {waterValue >= 3500 ? "OK" : "MISS"} Water: {Math.round(waterValue)}
            ml / 3500ml
          </Text>
          <Text style={styles.rowText}>
            {caloriesValue > 0 && caloriesValue <= caloriesTarget
              ? "OK"
              : "MISS"}{" "}
            Calories: {Math.round(caloriesValue)} / {caloriesTarget}
          </Text>
          <Text style={styles.rowText}>
            {trainingDone ? "OK" : "MISS"} Training logged today
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Global Goals</Text>
          <Text style={styles.rowText}>
            Gym Sessions: {globalTargets.gymDone}/{globalTargets.gymTarget} (
            {Math.max(globalTargets.gymTarget - globalTargets.gymDone, 0)} left)
          </Text>
          <Text style={styles.rowText}>
            Football Sessions: {globalTargets.footballDone}/
            {globalTargets.footballTarget} (
            {Math.max(
              globalTargets.footballTarget - globalTargets.footballDone,
              0,
            )}{" "}
            left)
          </Text>
          <Text style={styles.rowText}>
            Protein Days: {globalTargets.proteinDone}/
            {globalTargets.proteinTarget} (
            {Math.max(
              globalTargets.proteinTarget - globalTargets.proteinDone,
              0,
            )}{" "}
            left)
          </Text>
        </View>

        <TouchableOpacity
          style={styles.logButton}
          onPress={() => navigation.navigate("DailyLog")}
        >
          <Text style={styles.logButtonText}>Log Today</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.manageButton} onPress={openCategories}>
          <Text style={styles.manageButtonText}>Manage Categories</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Logged Today</Text>
          {loading ? (
            <Text style={styles.secondaryText}>Loading...</Text>
          ) : todayMetrics.length === 0 ? (
            <Text style={styles.secondaryText}>
              No logs saved for today yet.
            </Text>
          ) : (
            todayMetrics.map((item) => (
              <Text key={`${item.name}-${item.value}`} style={styles.rowText}>
                {item.name}: {item.value}
              </Text>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>History Tracker</Text>
          <Text style={styles.secondaryText}>Date Range (d/m/yyyy)</Text>
          <TextInput
            style={styles.input}
            value={filterFromDate}
            onChangeText={setFilterFromDate}
            placeholder="From date"
            placeholderTextColor={theme.colors.textSecondary}
          />
          <TextInput
            style={styles.input}
            value={filterToDate}
            onChangeText={setFilterToDate}
            placeholder="To date"
            placeholderTextColor={theme.colors.textSecondary}
          />
          <TextInput
            style={styles.input}
            value={filterText}
            onChangeText={setFilterText}
            placeholder="Search notes / habit / category"
            placeholderTextColor={theme.colors.textSecondary}
          />

          <View style={styles.filterChips}>
            {historyCategories.map((category) => {
              const chipColor =
                category === "All"
                  ? theme.colors.border
                  : (historyCategoryColorByName[category] ??
                    theme.colors.accent);
              const isActive = filterCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterChip,
                    { borderColor: chipColor },
                    isActive && { backgroundColor: chipColor },
                  ]}
                  onPress={() => setFilterCategory(category)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {!!historyStatus && (
            <Text style={styles.secondaryText}>{historyStatus}</Text>
          )}

          {filteredHistory.length === 0 ? (
            <Text style={styles.secondaryText}>
              No records match your filters.
            </Text>
          ) : (
            filteredHistory.map((row) => (
              <View key={row.id} style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowText}>
                    {row.date} |{" "}
                    <Text
                      style={[
                        styles.categoryText,
                        { color: normalizeCategoryColor(row.categoryColor) },
                      ]}
                    >
                      {row.categoryName}
                    </Text>{" "}
                    | {row.habitName}
                  </Text>
                  {editingHistoryId === row.id ? (
                    <>
                      <TextInput
                        style={styles.input}
                        value={editingValue}
                        onChangeText={setEditingValue}
                        placeholder="Value"
                        placeholderTextColor={theme.colors.textSecondary}
                        keyboardType="numeric"
                      />
                      <TextInput
                        style={[styles.input, styles.editNotesInput]}
                        value={editingNotes}
                        onChangeText={setEditingNotes}
                        placeholder="Notes (optional)"
                        placeholderTextColor={theme.colors.textSecondary}
                        multiline
                      />
                      <View style={styles.editInlineActions}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => onSaveHistoryEdit(row.id)}
                        >
                          <Text style={styles.editBtnText}>Save</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={onCancelHistoryEdit}
                        >
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <Text style={styles.secondaryText}>
                      Value: {row.value}
                      {row.notes ? ` | ${row.notes}` : ""}
                    </Text>
                  )}
                </View>
                <View style={styles.historyActions}>
                  {editingHistoryId !== row.id ? (
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => onStartHistoryEdit(row)}
                    >
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => onDeleteHistoryRow(row.id)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  container: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: theme.colors.background,
  },
  title: {
    color: theme.colors.accent,
    fontSize: 52,
    fontWeight: "900",
    lineHeight: 56,
  },
  subtitle: {
    color: theme.colors.accent,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  secondaryText: { color: theme.colors.textSecondary, marginBottom: 8 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  rowText: {
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  filterChipText: {
    color: theme.colors.textPrimary,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  categoryText: { fontWeight: "700" },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  historyActions: {
    marginLeft: 10,
    gap: 8,
  },
  editInlineActions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  editNotesInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  editBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  editBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cancelBtn: {
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  cancelBtnText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  deleteBtn: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginLeft: 10,
  },
  deleteBtnText: {
    color: "#B91C1C",
    fontWeight: "700",
  },
  logButton: {
    width: "100%",
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  logButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  manageButton: {
    width: "100%",
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  manageButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: "700",
    fontSize: 15,
  },
});
