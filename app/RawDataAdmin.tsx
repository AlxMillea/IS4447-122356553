import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { normalizeCategoryColor } from "../constants/category-colors";
import {
  deleteLog,
  formatDayMonthYear,
  getCategoriesWithHabits,
  getRecordHistory,
  insertRecord,
  parseDayMonthYear,
  updateRecord,
  type CategoryWithHabits,
  type RecordHistoryRow,
} from "../db/db-repo";
import { useAppTheme } from "../state/theme-provider";

type CategoryOption = {
  id: number;
  name: string;
  color: string;
  icon: string;
  defaultHabitId: number | null;
};

function isValidDMY(value: string): boolean {
  const [dStr, mStr, yStr] = value.split("/");
  const d = Number(dStr);
  const m = Number(mStr);
  const y = Number(yStr);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y) || y < 2000 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default function RawDataAdmin() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const now = new Date();
  const initialTo = formatDayMonthYear(now);
  const initialFromDate = new Date(now);
  initialFromDate.setDate(now.getDate() - 7);
  const initialFrom = formatDayMonthYear(initialFromDate);

  const [historyRows, setHistoryRows] = useState<RecordHistoryRow[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [createDate, setCreateDate] = useState(initialTo);
  const [createCategoryId, setCreateCategoryId] = useState<number | null>(null);
  const [createValue, setCreateValue] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [createStatus, setCreateStatus] = useState("");
  const [filterFromDate, setFilterFromDate] = useState(initialFrom);
  const [filterToDate, setFilterToDate] = useState(initialTo);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterText, setFilterText] = useState("");
  const [editingHistoryId, setEditingHistoryId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingNotes, setEditingNotes] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [historyStatus, setHistoryStatus] = useState("");

  const refresh = useCallback(async () => {
    const history = await getRecordHistory();
    const categoryHabitRows = (await getCategoriesWithHabits()) as CategoryWithHabits[];
    setHistoryRows(history);
    const mapped: CategoryOption[] = categoryHabitRows.map((row) => ({
      id: row.id,
      name: row.name,
      color: normalizeCategoryColor(row.color),
      icon: row.icon,
      defaultHabitId: row.habits[0]?.id ?? null,
    }));
    setCategoryOptions(mapped);
    setCreateCategoryId((prev) => prev ?? (mapped.find((x) => x.defaultHabitId !== null)?.id ?? null));
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const historyCategories = useMemo(() => ["All", ...Array.from(new Set(historyRows.map((x) => x.categoryName))).sort()], [historyRows]);

  const historyCategoryColorByName = useMemo(() => {
    const map: Record<string, string> = {};
    for (const row of historyRows) map[row.categoryName] = normalizeCategoryColor(row.categoryColor);
    return map;
  }, [historyRows]);

  const filteredHistory = useMemo(() => {
    let rows = [...historyRows];
    if (filterCategory !== "All") rows = rows.filter((x) => x.categoryName === filterCategory);
    const text = filterText.trim().toLowerCase();
    if (text) rows = rows.filter((x) => `${x.habitName} ${x.categoryName} ${x.notes ?? ""}`.toLowerCase().includes(text));
    const fromParts = filterFromDate.split("/").map(Number);
    const toParts = filterToDate.split("/").map(Number);
    const from = fromParts.length === 3 && fromParts.every((v) => !Number.isNaN(v)) ? parseDayMonthYear(filterFromDate) : null;
    const to = toParts.length === 3 && toParts.every((v) => !Number.isNaN(v)) ? parseDayMonthYear(filterToDate) : null;
    if (from || to) rows = rows.filter((x) => { const d = parseDayMonthYear(x.date); if (from && d < from) return false; if (to && d > to) return false; return true; });
    rows.sort((a, b) => { const byDate = parseDayMonthYear(b.date).getTime() - parseDayMonthYear(a.date).getTime(); return byDate !== 0 ? byDate : b.id - a.id; });
    return rows;
  }, [historyRows, filterCategory, filterFromDate, filterToDate, filterText]);

  const onCreateRecord = async () => {
    if (Number.isNaN(Number(createValue))) { setCreateStatus("Enter a numeric value."); return; }
    if (!isValidDMY(createDate)) { setCreateStatus("Use d/m/yyyy format."); return; }
    const selected = categoryOptions.find((x) => x.id === createCategoryId);
    if (!selected?.defaultHabitId) { setCreateStatus("Pick a category with a habit."); return; }
    await insertRecord({ habitId: selected.defaultHabitId, date: createDate, value: Number(createValue), notes: createNotes });
    setCreateValue(""); setCreateNotes(""); setCreateStatus("Record added.");
    await refresh();
  };

  const onSaveEdit = async (logId: number) => {
    if (Number.isNaN(Number(editingValue))) { setHistoryStatus("Enter a numeric value."); return; }
    if (!isValidDMY(editingDate)) { setHistoryStatus("Use d/m/yyyy format."); return; }
    const selected = categoryOptions.find((x) => x.id === editingCategoryId);
    if (!selected?.defaultHabitId) { setHistoryStatus("Pick a valid category."); return; }
    await updateRecord(logId, { value: Number(editingValue), notes: editingNotes, date: editingDate, habitId: selected.defaultHabitId });
    setEditingHistoryId(null); setEditingValue(""); setEditingNotes(""); setEditingDate(""); setEditingCategoryId(null);
    setHistoryStatus("Record updated.");
    await refresh();
  };

  const onDelete = async (logId: number) => {
    if (editingHistoryId === logId) { setEditingHistoryId(null); setEditingValue(""); setEditingNotes(""); }
    await deleteLog(logId);
    setHistoryStatus("Record deleted.");
    await refresh();
  };

  return (
    <View>

      {/* CREATE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Add Record</Text>
        <Text style={styles.label}>Date (d/m/yyyy)</Text>
        <TextInput style={styles.input} value={createDate} onChangeText={setCreateDate} placeholder="e.g. 22/4/2026" placeholderTextColor={theme.textSecondary} />
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {categoryOptions.map((cat) => {
            const active = createCategoryId === cat.id;
            return (
              <TouchableOpacity key={cat.id} style={[styles.chip, { borderColor: cat.color }, active && { backgroundColor: cat.color }]} onPress={() => setCreateCategoryId(cat.id)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TextInput style={styles.input} value={createValue} onChangeText={setCreateValue} placeholder="Metric value" placeholderTextColor={theme.textSecondary} keyboardType="numeric" />
        <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]} value={createNotes} onChangeText={setCreateNotes} placeholder="Notes (optional)" placeholderTextColor={theme.textSecondary} multiline />
        <TouchableOpacity style={styles.accentBtn} onPress={onCreateRecord}>
          <Text style={styles.accentBtnText}>Add Record</Text>
        </TouchableOpacity>
        {!!createStatus && <Text style={styles.status}>{createStatus}</Text>}
      </View>

      {/* HISTORY / READ / UPDATE / DELETE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>History Tracker</Text>
        <TextInput style={styles.input} value={filterFromDate} onChangeText={setFilterFromDate} placeholder="From (d/m/yyyy)" placeholderTextColor={theme.textSecondary} />
        <TextInput style={styles.input} value={filterToDate} onChangeText={setFilterToDate} placeholder="To (d/m/yyyy)" placeholderTextColor={theme.textSecondary} />
        <TextInput style={styles.input} value={filterText} onChangeText={setFilterText} placeholder="Search notes / habit / category" placeholderTextColor={theme.textSecondary} />
        <View style={styles.chips}>
          {historyCategories.map((cat) => {
            const chipColor = cat === "All" ? theme.border : (historyCategoryColorByName[cat] ?? theme.accent);
            const active = filterCategory === cat;
            return (
              <TouchableOpacity key={cat} style={[styles.chip, { borderColor: chipColor }, active && { backgroundColor: chipColor }]} onPress={() => setFilterCategory(cat)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {!!historyStatus && <Text style={styles.status}>{historyStatus}</Text>}
        {filteredHistory.length === 0
          ? (
            <View style={styles.emptyState}>
              <Image
                source={require("../assets/images/ChicagoImage.jpg")}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.empty}>No records match your filters.</Text>
            </View>
          )
          : filteredHistory.map((row) => (
            <View key={row.id} style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowText}>
                  {row.date} | <Text style={{ color: normalizeCategoryColor(row.categoryColor), fontWeight: "700" }}>{row.categoryName}</Text> | {row.habitName}
                </Text>
                {editingHistoryId === row.id ? (
                  <>
                    <TextInput style={styles.input} value={editingDate} onChangeText={setEditingDate} placeholder="Date (d/m/yyyy)" placeholderTextColor={theme.textSecondary} />
                    <View style={styles.chips}>
                      {categoryOptions.map((cat) => {
                        const active = editingCategoryId === cat.id;
                        return (
                          <TouchableOpacity key={`${row.id}-${cat.id}`} style={[styles.chip, { borderColor: cat.color }, active && { backgroundColor: cat.color }]} onPress={() => setEditingCategoryId(cat.id)}>
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <TextInput style={styles.input} value={editingValue} onChangeText={setEditingValue} placeholder="Value" placeholderTextColor={theme.textSecondary} keyboardType="numeric" />
                    <TextInput style={[styles.input, { minHeight: 60, textAlignVertical: "top" }]} value={editingNotes} onChangeText={setEditingNotes} placeholder="Notes" placeholderTextColor={theme.textSecondary} multiline />
                    <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                      <TouchableOpacity style={styles.accentBtn} onPress={() => onSaveEdit(row.id)}><Text style={styles.accentBtnText}>Save</Text></TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingHistoryId(null); setEditingValue(""); setEditingNotes(""); setEditingDate(""); setEditingCategoryId(null); }}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <Text style={styles.rowSub}>Value: {row.value}{row.notes ? ` | ${row.notes}` : ""}</Text>
                )}
              </View>
              <View style={{ marginLeft: 8, gap: 6 }}>
                {editingHistoryId !== row.id && (
                  <TouchableOpacity style={styles.accentBtn} onPress={() => { setEditingHistoryId(row.id); setEditingValue(String(row.value)); setEditingNotes(row.notes ?? ""); setEditingDate(row.date); setEditingCategoryId(row.categoryId); setHistoryStatus(""); }}>
                    <Text style={styles.accentBtnText}>Edit</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.deleteBtn} onPress={() => onDelete(row.id)}>
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </View>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    requirementBadge: {
      backgroundColor: "#1A3A1A",
      padding: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#22C55E",
    },
    requirementText: { color: "#22C55E", fontWeight: "700", fontSize: 12 },
    card: { backgroundColor: theme.surface, padding: 16, marginBottom: 14 },
    cardTitle: { color: theme.textPrimary, fontSize: 11, fontWeight: "500", marginBottom: 12, textTransform: "uppercase", letterSpacing: 1.5 },
    label: { color: theme.textSecondary, fontSize: 13, marginBottom: 4 },
    input: { backgroundColor: theme.background, color: theme.textPrimary, borderColor: theme.border, borderWidth: 1, padding: 10, marginBottom: 8 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
    chip: { backgroundColor: theme.background, borderWidth: 1, paddingVertical: 6, paddingHorizontal: 10 },
    chipText: { color: theme.textPrimary, fontWeight: "600", fontSize: 12 },
    chipTextActive: { color: "#FFFFFF" },
    accentBtn: { backgroundColor: theme.accent, paddingVertical: 8, paddingHorizontal: 10 },
    accentBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
    cancelBtn: { backgroundColor: "#E2E8F0", paddingVertical: 8, paddingHorizontal: 10 },
    cancelBtnText: { color: "#0F172A", fontWeight: "700", fontSize: 13 },
    deleteBtn: { backgroundColor: "#FEE2E2", paddingVertical: 8, paddingHorizontal: 10 },
    deleteBtnText: { color: "#B91C1C", fontWeight: "700", fontSize: 13 },
    historyRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", borderTopColor: theme.border, borderTopWidth: 1, paddingTop: 10, marginTop: 10 },
    rowText: { color: theme.textPrimary, marginBottom: 4, fontSize: 13 },
    rowSub: { color: theme.textSecondary, fontSize: 12 },
    status: { color: theme.accent, marginTop: 6, fontSize: 13 },
    emptyState: { alignItems: "center", paddingVertical: 16 },
    emptyImage: { width: "100%", height: 140, marginBottom: 12 },
    empty: { color: theme.textSecondary, textAlign: "center", paddingVertical: 16 },
  });
