import { useEffect, useMemo, useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  deleteLog,
  getCategoriesWithHabits,
  getLogsForToday,
  insertLog,
  updateLog,
  type CategoryWithHabits,
  type HabitLogRow,
} from "../../db/db-repo";

const CHICAGO_TRIP_DATE = new Date("2026-07-01T00:00:00");

export default function HomeScreen() {
  const [dayType, setDayType] = useState<"Gym" | "Football" | "Rest">("Gym");
  const [pillars, setPillars] = useState<CategoryWithHabits[]>([]);

  const daysUntilChicago = useMemo(() => {
    const now = new Date();
    const diffMs = CHICAGO_TRIP_DATE.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, []);

  const [logs, setLogs] = useState<HabitLogRow[]>([]);
  const [valueInput, setValueInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [editingLogId, setEditingLogId] = useState<number | null>(null);

  const firstHabitId = useMemo(
    () => pillars.flatMap((c) => c.habits)[0]?.id ?? null,
    [pillars],
  );

  const refreshTodayLogs = async () => {
    const todayLogs = await getLogsForToday();
    setLogs(todayLogs);
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await getCategoriesWithHabits();
        if (mounted) setPillars(data);
        if (mounted) await refreshTodayLogs();
      } catch (error) {
        console.error("Failed to load home data:", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const onSubmitLog = async () => {
    if (!firstHabitId) return;
    const parsed = Number(valueInput);
    if (Number.isNaN(parsed)) return;

    if (editingLogId !== null) {
      await updateLog(editingLogId, parsed, notesInput);
      setEditingLogId(null);
    } else {
      await insertLog(firstHabitId, parsed, notesInput);
    }

    setValueInput("");
    setNotesInput("");
    await refreshTodayLogs();
  };

  const onEditLog = (log: HabitLogRow) => {
    setEditingLogId(log.id);
    setValueInput(String(log.value));
    setNotesInput(log.notes ?? "");
  };

  const onDeleteLog = async (logId: number) => {
    await deleteLog(logId);
    if (editingLogId === logId) {
      setEditingLogId(null);
      setValueInput("");
      setNotesInput("");
    }
    await refreshTodayLogs();
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View>
        <Text>Days until Chicago: {daysUntilChicago}</Text>

        <Text>Day Type: {dayType}</Text>
        <Button title="Gym" onPress={() => setDayType("Gym")} />
        <Button title="Football" onPress={() => setDayType("Football")} />
        <Button title="Rest" onPress={() => setDayType("Rest")} />

        {pillars.map((category) => (
          <View key={category.id}>
            <Text>{category.name}</Text>
            {category.habits.length === 0 ? (
              <Text>No habits yet</Text>
            ) : (
              category.habits.map((habit) => (
                <Text key={habit.id}>- {habit.name}</Text>
              ))
            )}
          </View>
        ))}

        <Text>{`Today's Logs (CRUD Test)`}</Text>
        <Text>Habit ID (hardcoded first habit): {firstHabitId ?? "N/A"}</Text>
        <TextInput
          placeholder="Value"
          value={valueInput}
          onChangeText={setValueInput}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Notes"
          value={notesInput}
          onChangeText={setNotesInput}
        />
        <Button
          title={editingLogId !== null ? "Update Log" : "Add Log"}
          onPress={onSubmitLog}
        />

        {logs.map((log) => (
          <View key={log.id}>
            <Text>
              #{log.id} | habit {log.habitId} | {log.date} | {log.value} |{" "}
              {log.notes ?? ""}
            </Text>
            <Button title="Edit" onPress={() => onEditLog(log)} />
            <Button title="Delete" onPress={() => onDeleteLog(log.id)} />
          </View>
        ))}

        <Button
          title="Open 60-Second Log"
          onPress={() => console.log("Log placeholder")}
        />
      </View>
    </SafeAreaView>
  );
}
