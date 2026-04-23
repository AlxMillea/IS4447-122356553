import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  formatDayMonthYear,
  getHabitsByNames,
  getLogsForDate,
  insertLogAtDate,
  updateLog,
} from "../db/db-repo";
import { useAppTheme } from "../state/theme-provider";

const MOODS = [
  { emoji: "🚀", label: "Fresh" },
  { emoji: "👍", label: "Good" },
  { emoji: "🪵", label: "Stiff" },
  { emoji: "🧟", label: "Wrecked" },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function MorningPulseModal({ visible, onClose }: Props) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState("");
  const [recovery, setRecovery] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onMoodSelect = async (emoji: string) => {
    setMood(emoji);
    await Haptics.selectionAsync();
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const date = formatDayMonthYear(new Date());
      const habits = await getHabitsByNames([
        "Weigh-in",
        "Log Sleep",
        "Whoop Recovery %",
      ]);
      const idByName = Object.fromEntries(
        habits.map((h) => [h.name, h.id]),
      ) as Record<string, number>;
      const existing = await getLogsForDate(date);
      const byHabitId = new Map(existing.map((l) => [l.habitId, l]));

      const upsert = async (name: string, value: number, notes?: string) => {
        const habitId = idByName[name];
        if (!habitId || Number.isNaN(value)) return;
        const ex = byHabitId.get(habitId);
        if (ex) await updateLog(ex.id, value, notes);
        else await insertLogAtDate(habitId, date, value, notes);
      };

      if (weight.trim()) await upsert("Weigh-in", Number(weight));
      if (sleep.trim()) await upsert("Log Sleep", Number(sleep));
      if (recovery.trim())
        await upsert(
          "Whoop Recovery %",
          Number(recovery),
          mood ?? undefined,
        );

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWeight("");
      setSleep("");
      setRecovery("");
      setMood(null);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.greeting}>Good Morning, Alex 👋</Text>
        <Text style={styles.sub}>
          30 seconds to set your day up right.
        </Text>

        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 86.5"
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
          value={weight}
          onChangeText={setWeight}
        />

        <Text style={styles.label}>Sleep Hours</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 7.5"
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
          value={sleep}
          onChangeText={setSleep}
        />

        <Text style={styles.label}>Whoop Recovery %</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 72"
          placeholderTextColor={theme.textSecondary}
          keyboardType="numeric"
          value={recovery}
          onChangeText={setRecovery}
        />

        <Text style={styles.label}>How are you feeling?</Text>
        <View style={styles.moodRow}>
          {MOODS.map((m) => (
            <TouchableOpacity
              key={m.emoji}
              style={[
                styles.moodChip,
                mood === m.emoji && styles.moodChipActive,
              ]}
              onPress={() => onMoodSelect(m.emoji)}
            >
              <Text style={styles.moodEmoji}>{m.emoji}</Text>
              <Text
                style={[
                  styles.moodLabel,
                  mood === m.emoji && styles.moodLabelActive,
                ]}
              >
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : "Save Morning Pulse"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
          <Text style={styles.skipBtnText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 24, paddingBottom: 48 },
    greeting: {
      color: theme.textPrimary,
      fontSize: 32,
      fontWeight: "900",
      marginBottom: 6,
    },
    sub: {
      color: theme.textSecondary,
      fontSize: 15,
      marginBottom: 28,
    },
    label: {
      color: theme.textPrimary,
      fontWeight: "700",
      marginBottom: 6,
      fontSize: 15,
    },
    input: {
      backgroundColor: theme.surface,
      color: theme.textPrimary,
      borderColor: theme.border,
      borderWidth: 1,
      padding: 16,
      fontSize: 18,
      marginBottom: 18,
    },
    moodRow: {
      flexDirection: "row",
      gap: 10,
      marginBottom: 32,
      flexWrap: "wrap",
    },
    moodChip: {
      backgroundColor: theme.surface,
      padding: 14,
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
      minWidth: 72,
    },
    moodChipActive: { borderColor: theme.accent },
    moodEmoji: { fontSize: 28, marginBottom: 4 },
    moodLabel: { color: theme.textSecondary, fontSize: 12, fontWeight: "600" },
    moodLabelActive: { color: theme.accent },
    saveBtn: {
      backgroundColor: theme.accent,
      paddingVertical: 18,
      alignItems: "center",
      marginBottom: 12,
    },
    saveBtnText: { color: "#FFFFFF", fontWeight: "900", fontSize: 17 },
    skipBtn: { alignItems: "center", paddingVertical: 14 },
    skipBtnText: { color: theme.textSecondary, fontSize: 14 },
  });
