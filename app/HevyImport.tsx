import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Upload } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "../state/theme-provider";

const KEY_WORKOUTS = "hevy_workouts_v1";
const KEY_MEASUREMENTS = "hevy_measurements_v1";

type WorkoutSet = {
  index: number;
  type: string;
  weight: number | null;
  reps: number | null;
  durationSecs: number | null;
};

type WorkoutExercise = {
  name: string;
  notes: string;
  sets: WorkoutSet[];
};

type WorkoutSession = {
  id: string;
  title: string;
  startTime: string;
  durationMins: number;
  description: string;
  exercises: WorkoutExercise[];
};

type MeasurementEntry = {
  date: string;
  weightKg: string;
  fatPercent: string;
  chestIn: string;
  waistIn: string;
  hipsIn: string;
  shoulderIn: string;
};

// ─── CSV Pars

function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && !inQ) { inQ = true; }
    else if (ch === '"' && inQ) {
      if (line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = false; }
    } else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
    else { cur += ch; }
  }
  cells.push(cur);
  return cells;
}

function parseCSV(text: string): string[][] {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((l) => l.trim())
    .map(parseCSVLine);
}

const MONTH_MAP: Record<string, number> = {
  Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11,
};

function parseHevyDate(str: string): Date {
  try {
    const [datePart, timePart] = str.split(", ");
    const [d, mon, y] = datePart.trim().split(" ");
    const [h, m] = (timePart ?? "00:00").split(":").map(Number);
    return new Date(Number(y), MONTH_MAP[mon] ?? 0, Number(d), h, m);
  } catch { return new Date(0); }
}

function formatDate(str: string): string {
  const d = parseHevyDate(str);
  if (!d.getTime()) return str;
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function detectType(lines: string[][]): "workout" | "measurement" | "unknown" {
  if (!lines.length) return "unknown";
  const h = lines[0];
  if (h.includes("exercise_title")) return "workout";
  if (h.includes("neck_in") || (h.includes("weight_kg") && h.includes("fat_percent"))) return "measurement";
  return "unknown";
}

function parseWorkouts(lines: string[][]): WorkoutSession[] {
  const headers = lines[0];
  const col = (name: string) => headers.indexOf(name);
  const sessionMap = new Map<string, WorkoutSession>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.length < 5) continue;
    const title = row[col("title")] ?? "";
    const startTime = row[col("start_time")] ?? "";
    const endTime = row[col("end_time")] ?? "";
    const description = row[col("description")] ?? "";
    const exName = row[col("exercise_title")] ?? "";
    const exNotes = row[col("exercise_notes")] ?? "";
    const setIdx = parseInt(row[col("set_index")] ?? "0", 10);
    const setType = row[col("set_type")] ?? "normal";
    const wkg = row[col("weight_kg")];
    const reps = row[col("reps")];
    const dur = row[col("duration_seconds")];
    const id = `${title}__${startTime}`;

    if (!sessionMap.has(id)) {
      const start = parseHevyDate(startTime);
      const end = parseHevyDate(endTime);
      const mins = Math.round((end.getTime() - start.getTime()) / 60000);
      sessionMap.set(id, { id, title, startTime, durationMins: mins, description, exercises: [] });
    }

    const session = sessionMap.get(id)!;
    let ex = session.exercises.find((e) => e.name === exName);
    if (!ex) { ex = { name: exName, notes: exNotes, sets: [] }; session.exercises.push(ex); }

    ex.sets.push({
      index: setIdx,
      type: setType,
      weight: wkg ? parseFloat(wkg) : null,
      reps: reps ? parseInt(reps, 10) : null,
      durationSecs: dur ? parseInt(dur, 10) : null,
    });
  }

  return Array.from(sessionMap.values()).sort(
    (a, b) => parseHevyDate(b.startTime).getTime() - parseHevyDate(a.startTime).getTime()
  );
}

function parseMeasurements(lines: string[][]): MeasurementEntry[] {
  const headers = lines[0];
  const col = (name: string) => headers.indexOf(name);
  return lines.slice(1)
    .filter((r) => r.length > 1 && r[0].trim())
    .map((r) => ({
      date: r[col("date")] ?? "",
      weightKg: r[col("weight_kg")] ?? "",
      fatPercent: r[col("fat_percent")] ?? "",
      chestIn: r[col("chest_in")] ?? "",
      waistIn: r[col("waist_in")] ?? "",
      hipsIn: r[col("hips_in")] ?? "",
      shoulderIn: r[col("shoulder_in")] ?? "",
    }))
    .sort((a, b) => parseHevyDate(b.date).getTime() - parseHevyDate(a.date).getTime());
}

function formatSet(s: WorkoutSet): string {
  const weight = s.weight !== null ? `${s.weight}kg` : null;
  const reps = s.reps !== null ? `${s.reps}` : null;
  const dur = s.durationSecs !== null
    ? `${Math.floor(s.durationSecs / 60)}:${String(s.durationSecs % 60).padStart(2, "0")}`
    : null;
  if (weight && reps) return `${weight} × ${reps}`;
  if (reps) return `${reps} reps`;
  if (dur) return dur;
  return "—";
}

function formatDuration(mins: number): string {
  if (mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HevyImport() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      const w = await AsyncStorage.getItem(KEY_WORKOUTS);
      const m = await AsyncStorage.getItem(KEY_MEASUREMENTS);
      if (w) setWorkouts(JSON.parse(w));
      if (m) setMeasurements(JSON.parse(m));
    })();
  }, []);

  const toggleSession = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const onImport = async () => {
    try {
      setLoading(true);
      setStatus("");
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "public.comma-separated-values-text", "*/*"],
        copyToCacheDirectory: true,
      });
      if (result.canceled) { setLoading(false); return; }
      const uri = result.assets[0].uri;
      const raw = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
      const lines = parseCSV(raw);
      const type = detectType(lines);

      if (type === "workout") {
        const sessions = parseWorkouts(lines);
        await AsyncStorage.setItem(KEY_WORKOUTS, JSON.stringify(sessions));
        setWorkouts(sessions);
        setStatus(`Imported ${sessions.length} workout sessions.`);
      } else if (type === "measurement") {
        const entries = parseMeasurements(lines);
        await AsyncStorage.setItem(KEY_MEASUREMENTS, JSON.stringify(entries));
        setMeasurements(entries);
        setStatus(`Imported ${entries.length} measurement entries.`);
      } else {
        setStatus("Unknown CSV format. Export from Hevy and try again.");
      }
    } catch (e) {
      setStatus("Failed to read file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {/* Header */}
      <View style={styles.importRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Import from Hevy</Text>
          <Text style={styles.sectionSub}>
            {workouts.length > 0 || measurements.length > 0
              ? `${workouts.length} sessions · ${measurements.length} measurements`
              : "Export CSV from Hevy app and import here"}
          </Text>
        </View>
        <TouchableOpacity style={[styles.importBtn, { backgroundColor: theme.accent }]} onPress={onImport} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Upload size={14} color="#fff" /><Text style={styles.importBtnText}>Import CSV</Text></>}
        </TouchableOpacity>
      </View>
      {!!status && <Text style={[styles.statusText, { color: theme.accent }]}>{status}</Text>}

      {/* Measurements */}
      {measurements.length > 0 && (
        <View style={[styles.card, { marginTop: 12 }]}>
          <Text style={styles.cardTitle}>Body Measurements</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.tableCellDate, styles.tableHeaderText]}>Date</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Weight</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Body Fat</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Chest</Text>
            <Text style={[styles.tableCell, styles.tableHeaderText]}>Waist</Text>
          </View>
          {measurements.map((m, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 && { backgroundColor: theme.background + "60" }]}>
              <Text style={[styles.tableCell, styles.tableCellDate, { color: theme.textPrimary }]}>{formatDate(m.date).replace(/\s\d{4}/, "")}</Text>
              <Text style={[styles.tableCell, { color: theme.textPrimary }]}>{m.weightKg ? `${m.weightKg}kg` : "—"}</Text>
              <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{m.fatPercent ? `${m.fatPercent}%` : "—"}</Text>
              <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{m.chestIn || "—"}</Text>
              <Text style={[styles.tableCell, { color: theme.textSecondary }]}>{m.waistIn || "—"}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Workouts */}
      {workouts.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
            WORKOUT HISTORY · {workouts.length} SESSIONS
          </Text>
          {workouts.map((session) => {
            const isOpen = expanded.has(session.id);
            return (
              <View key={session.id} style={styles.sessionCard}>
                <TouchableOpacity style={styles.sessionHeader} onPress={() => toggleSession(session.id)} activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
                    <View style={styles.sessionMeta}>
                      <Text style={styles.sessionMetaText}>{formatDate(session.startTime)}</Text>
                      {session.durationMins > 0 && (
                        <Text style={styles.sessionMetaText}> · {formatDuration(session.durationMins)}</Text>
                      )}
                      <Text style={styles.sessionMetaText}> · {session.exercises.length} exercises</Text>
                    </View>
                    {!!session.description && (
                      <Text style={styles.sessionDesc} numberOfLines={isOpen ? 3 : 1}>{session.description}</Text>
                    )}
                  </View>
                  <Text style={[styles.chevron, { color: theme.textSecondary }]}>{isOpen ? "▲" : "▼"}</Text>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.exerciseList}>
                    {session.exercises.map((ex, ei) => (
                      <View key={ei} style={[styles.exerciseRow, ei > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
                        <Text style={styles.exerciseName}>{ex.name}</Text>
                        {!!ex.notes && <Text style={styles.exerciseNotes}>{ex.notes}</Text>}
                        <View style={styles.setsRow}>
                          {ex.sets.map((s, si) => (
                            <View
                              key={si}
                              style={[
                                styles.setBadge,
                                s.type === "failure" && styles.setBadgeFailure,
                                { borderColor: s.type === "failure" ? "#EF4444" : theme.border },
                              ]}
                            >
                              <Text style={[styles.setText, s.type === "failure" && { color: "#EF4444" }]}>
                                {formatSet(s)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    importRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    sectionTitle: { color: theme.textPrimary, fontWeight: "700", fontSize: 15 },
    sectionSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
    importBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
    importBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    statusText: { fontSize: 12, marginTop: 8 },
    card: { backgroundColor: theme.surface, borderRadius: 10, padding: 12, overflow: "hidden" },
    cardTitle: { color: theme.textPrimary, fontWeight: "700", fontSize: 14, marginBottom: 10 },
    tableHeader: { flexDirection: "row", marginBottom: 4, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: theme.border },
    tableHeaderText: { color: theme.textSecondary, fontWeight: "700", fontSize: 11 },
    tableRow: { flexDirection: "row", paddingVertical: 6, borderRadius: 4 },
    tableCell: { flex: 1, fontSize: 12, color: theme.textSecondary },
    tableCellDate: { flex: 1.4 },
    sectionLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 1, marginBottom: 8 },
    sessionCard: { backgroundColor: theme.surface, borderRadius: 10, marginBottom: 8, overflow: "hidden" },
    sessionHeader: { flexDirection: "row", alignItems: "flex-start", padding: 14, gap: 8 },
    sessionTitle: { color: theme.textPrimary, fontWeight: "700", fontSize: 14 },
    sessionMeta: { flexDirection: "row", flexWrap: "wrap", marginTop: 3 },
    sessionMetaText: { color: theme.textSecondary, fontSize: 12 },
    sessionDesc: { color: theme.textSecondary, fontSize: 11, marginTop: 4, lineHeight: 15 },
    chevron: { fontSize: 10, marginTop: 4 },
    exerciseList: { borderTopWidth: 1, borderTopColor: theme.border },
    exerciseRow: { paddingHorizontal: 14, paddingVertical: 10 },
    exerciseName: { color: theme.textPrimary, fontWeight: "600", fontSize: 13, marginBottom: 2 },
    exerciseNotes: { color: theme.textSecondary, fontSize: 11, fontStyle: "italic", marginBottom: 4 },
    setsRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginTop: 4 },
    setBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
    setBadgeFailure: { backgroundColor: "#FEF2F2" },
    setText: { color: theme.textSecondary, fontSize: 11, fontWeight: "500" },
  });
