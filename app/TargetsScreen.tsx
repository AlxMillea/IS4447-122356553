import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { type DayEntry, WEEKS } from "../db/training-plan";
import { useAppTheme } from "../state/theme-provider";

const CHICAGO_DATE = new Date("2026-05-25T00:00:00");

const TAG_PRESETS: Record<string, { bg: string; color: string }> = {
  PR: { bg: "#FEF3C7", color: "#92400E" },
  "2 PRs": { bg: "#FEF3C7", color: "#92400E" },
  "3 PRs": { bg: "#FEF3C7", color: "#92400E" },
  planned: { bg: "#EFF6FF", color: "#1D4ED8" },
  "shoulder click": { bg: "#FFF7ED", color: "#C2410C" },
  "cramps from sauna": { bg: "#FFF7ED", color: "#C2410C" },
  "sauna damage": { bg: "#FFF7ED", color: "#C2410C" },
  "forearm fatigue": { bg: "#FFF7ED", color: "#C2410C" },
  Chicago: { bg: "#F0FDF4", color: "#166534" },
};


function daysToChicago(): number {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const chiStart = new Date(CHICAGO_DATE.getFullYear(), CHICAGO_DATE.getMonth(), CHICAGO_DATE.getDate());
  return Math.max(0, Math.round((chiStart.getTime() - todayStart.getTime()) / 86400000));
}

function computeSessionsDone(): number {
  const todayStr = new Date().toISOString().split("T")[0];
  let count = 0;
  for (const week of WEEKS) {
    for (const day of week.days) {
      if (day.isRest) continue;
      if (week.status === "done") { count++; continue; }
      if (week.status === "current" && day.dayKey <= todayStr) count++;
    }
  }
  return count;
}

function computeTotalSessions(): number {
  return WEEKS.reduce((sum, w) => sum + w.days.filter((d) => !d.isRest).length, 0);
}

export default function TargetsScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const currentWeekNum = WEEKS.find((w) => w.status === "current")?.num ?? 3;
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([currentWeekNum]));
  const [editingDay, setEditingDay] = useState<DayEntry | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editSession, setEditSession] = useState("");
  const [customNotes, setCustomNotes] = useState<Record<string, string>>({});
  const [customSession, setCustomSession] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const keys = await AsyncStorage.getAllKeys();
      const trainingKeys = keys.filter((k) => k.startsWith("training_"));
      if (!trainingKeys.length) return;
      const pairs = await AsyncStorage.multiGet(trainingKeys);
      const notes: Record<string, string> = {};
      const sessions: Record<string, string> = {};
      for (const [key, val] of pairs) {
        if (!val) continue;
        if (key.startsWith("training_notes_")) notes[key.replace("training_notes_", "")] = val;
        if (key.startsWith("training_session_")) sessions[key.replace("training_session_", "")] = val;
      }
      setCustomNotes(notes);
      setCustomSession(sessions);
    })();
  }, []);

  const toggleWeek = (num: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const openDay = (day: DayEntry) => {
    if (day.isRest) return;
    setEditingDay(day);
    setEditNotes(customNotes[day.dayKey] ?? day.notes);
    setEditSession(customSession[day.dayKey] ?? day.session);
  };

  const saveEdit = async () => {
    if (!editingDay) return;
    await AsyncStorage.setItem(`training_notes_${editingDay.dayKey}`, editNotes);
    await AsyncStorage.setItem(`training_session_${editingDay.dayKey}`, editSession);
    setCustomNotes((prev) => ({ ...prev, [editingDay.dayKey]: editNotes }));
    setCustomSession((prev) => ({ ...prev, [editingDay.dayKey]: editSession }));
    setEditingDay(null);
  };

  const sessionsDone = computeSessionsDone();
  const totalSessions = computeTotalSessions();
  const planPct = Math.round((sessionsDone / totalSessions) * 100);
  const daysLeft = daysToChicago();
  const weeksLeft = (daysLeft / 7).toFixed(1);

  const editingWeek = editingDay ? WEEKS.find((w) => w.days.some((d) => d.dayKey === editingDay.dayKey)) : null;
  const isEditable = editingWeek?.status !== "done";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>

      {/* Stats 2x2 */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>days to Chicago</Text>
          <Text style={styles.statValue}>{daysLeft}</Text>
          <Text style={styles.statSub}>departs 25 May</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>weeks remaining</Text>
          <Text style={styles.statValue}>{weeksLeft}</Text>
          <Text style={styles.statSub}>inc. this week</Text>
        </View>
      </View>
      <View style={[styles.statsRow, { marginBottom: 16 }]}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>sessions done</Text>
          <Text style={styles.statValue}>{sessionsDone}</Text>
          <Text style={styles.statSub}>since 7 Apr</Text>
        </View>
      </View>

      {/* Plan progress */}
      <View style={{ marginBottom: 20 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={styles.progressLabel}>plan progress</Text>
          <Text style={styles.progressLabel}>{planPct}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${planPct}%` }]} />
        </View>
      </View>

      {/* Week by week */}
      <Text style={styles.weekByWeekLabel}>WEEK BY WEEK</Text>
      {WEEKS.map((week) => {
        const isExpanded = expandedWeeks.has(week.num);
        const todayStr = new Date().toISOString().split("T")[0];
        const statusColor =
          week.status === "done" ? "#22C55E" :
          week.status === "current" ? "#3B82F6" :
          theme.textSecondary;
        const statusLabel =
          week.status === "done" ? "done" :
          week.status === "current" ? "current" :
          "upcoming";

        return (
          <View
            key={week.num}
            style={[
              styles.weekCard,
              week.status === "current" && { borderColor: "#3B82F6", borderWidth: 1.5 },
            ]}
          >
            <TouchableOpacity style={styles.weekHeader} onPress={() => toggleWeek(week.num)} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <Text style={styles.weekTitle}>Week {week.num} — {week.title}</Text>
                <Text style={styles.weekSub}>{week.dateRange} · {week.weeksOut}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.statusBadge, { borderColor: statusColor }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                </View>
                <Text style={[styles.chevron, { color: theme.textSecondary }]}>{isExpanded ? "▲" : "▼"}</Text>
              </View>
            </TouchableOpacity>

            {isExpanded && week.days.map((day, idx) => {
              const resolvedSession = customSession[day.dayKey] ?? day.session;
              const resolvedNotes = customNotes[day.dayKey] ?? day.notes;
              const isPast = day.dayKey < todayStr;
              const isToday = day.dayKey === todayStr;

              return (
                <TouchableOpacity
                  key={day.dayKey}
                  style={[
                    styles.dayRow,
                    idx === 0 && { borderTopWidth: 1, borderTopColor: theme.border },
                    isToday && { backgroundColor: theme.accent + "18" },
                  ]}
                  onPress={() => openDay(day)}
                  disabled={day.isRest}
                  activeOpacity={day.isRest ? 1 : 0.6}
                >
                  <View style={styles.dayDateCol}>
                    <Text style={styles.dayDayLabel}>{day.dayLabel}</Text>
                    <Text style={[styles.dayNum, isPast || isToday ? { color: theme.textPrimary } : { color: theme.textSecondary }]}>
                      {day.dayNum}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 5, marginBottom: resolvedNotes ? 3 : 0 }}>
                      <Text style={day.isRest ? styles.restText : styles.sessionText}>{resolvedSession}</Text>
                      {day.tags.map((tag) => {
                        const ts = TAG_PRESETS[tag] ?? { bg: "#F3F4F6", color: "#374151" };
                        return (
                          <View key={tag} style={[styles.tag, { backgroundColor: ts.bg }]}>
                            <Text style={[styles.tagText, { color: ts.color }]}>{tag}</Text>
                          </View>
                        );
                      })}
                    </View>
                    {!!resolvedNotes && (
                      <Text style={styles.dayNotes} numberOfLines={2}>{resolvedNotes}</Text>
                    )}
                  </View>
                  {!day.isRest && (
                    <Text style={[styles.editHint, { color: theme.textSecondary }]}>›</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        );
      })}

      {/* Edit / View modal */}
      <Modal
        visible={!!editingDay}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditingDay(null)}
      >
        {editingDay && (
          <ScrollView
            style={{ flex: 1, backgroundColor: theme.background }}
            contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
          >
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              {editingDay.dayLabel} {editingDay.dayNum} {editingDay.month}
            </Text>
            {editingDay.tags.length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {editingDay.tags.map((tag) => {
                  const ts = TAG_PRESETS[tag] ?? { bg: "#F3F4F6", color: "#374151" };
                  return (
                    <View key={tag} style={[styles.tag, { backgroundColor: ts.bg }]}>
                      <Text style={[styles.tagText, { color: ts.color }]}>{tag}</Text>
                    </View>
                  );
                })}
              </View>
            )}

            {isEditable ? (
              <>
                <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Session</Text>
                <TextInput
                  style={[styles.modalInput, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                  value={editSession}
                  onChangeText={setEditSession}
                  placeholderTextColor={theme.textSecondary}
                />
                <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>Notes</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 120, textAlignVertical: "top", backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                  value={editNotes}
                  onChangeText={setEditNotes}
                  multiline
                  placeholderTextColor={theme.textSecondary}
                />
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: theme.accent }]} onPress={saveEdit}>
                  <Text style={styles.saveBtnText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.modalSession, { color: theme.textPrimary }]}>{editingDay.session}</Text>
                {!!editingDay.notes && (
                  <Text style={[styles.modalNotes, { color: theme.textSecondary }]}>{editingDay.notes}</Text>
                )}
              </>
            )}

            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: theme.surface, marginTop: 12 }]}
              onPress={() => setEditingDay(null)}
            >
              <Text style={[styles.cancelBtnText, { color: theme.textPrimary }]}>Close</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Modal>
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    statsRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
    statCard: { flex: 1, backgroundColor: theme.surface, borderRadius: 12, padding: 14 },
    statLabel: { color: theme.textSecondary, fontSize: 11, marginBottom: 4 },
    statValue: { color: theme.textPrimary, fontSize: 32, fontWeight: "700", letterSpacing: -1, marginBottom: 2 },
    statSub: { color: theme.textSecondary, fontSize: 11 },
    progressLabel: { color: theme.textSecondary, fontSize: 12 },
    track: { height: 8, backgroundColor: theme.border, borderRadius: 6, overflow: "hidden" },
    fill: { height: 8, backgroundColor: "#3B82F6", borderRadius: 6 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    sectionHeaderText: { color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
    chevron: { fontSize: 10 },
    prRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: theme.surface, borderRadius: 8, padding: 12, marginBottom: 6 },
    prDot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
    prText: { color: theme.textPrimary, fontSize: 13, flex: 1 },
    weekByWeekLabel: { color: theme.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 10 },
    weekCard: { backgroundColor: theme.surface, borderRadius: 12, marginBottom: 10, overflow: "hidden" },
    weekHeader: { flexDirection: "row", alignItems: "center", padding: 16 },
    weekTitle: { color: theme.textPrimary, fontSize: 15, fontWeight: "700" },
    weekSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
    statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    statusText: { fontSize: 11, fontWeight: "600" },
    dayRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.border },
    dayDateCol: { width: 36, marginRight: 12 },
    dayDayLabel: { color: theme.textSecondary, fontSize: 10, marginBottom: 1 },
    dayNum: { fontSize: 15, fontWeight: "700" },
    sessionText: { color: theme.textPrimary, fontSize: 13, fontWeight: "600" },
    restText: { color: theme.textSecondary, fontSize: 13, fontStyle: "italic" },
    tag: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2 },
    tagText: { fontSize: 10, fontWeight: "600" },
    dayNotes: { color: theme.textSecondary, fontSize: 11, marginTop: 3, lineHeight: 15 },
    editHint: { fontSize: 18, marginLeft: 8, alignSelf: "center" },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
    modalLabel: { fontSize: 12, marginBottom: 4, marginTop: 12 },
    modalInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, marginBottom: 4 },
    modalSession: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
    modalNotes: { fontSize: 14, lineHeight: 20 },
    saveBtn: { borderRadius: 8, paddingVertical: 12, alignItems: "center", marginTop: 16 },
    saveBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
    cancelBtn: { borderRadius: 8, paddingVertical: 12, alignItems: "center" },
    cancelBtnText: { fontWeight: "600", fontSize: 15 },
  });
