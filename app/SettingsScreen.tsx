import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { exportDataToCSV } from "../db/db-repo";
import { useAppTheme } from "../state/theme-provider";
import CategoriesScreen from "./CategoriesScreen";
import RawDataAdmin from "./RawDataAdmin";

export default function SettingsScreen() {
  const { mode, setMode, theme } = useAppTheme();
  const styles = createStyles(theme);

  const onExport = async () => {
    const result = await exportDataToCSV();
    Alert.alert(
      "CSV Export",
      result.rowCount > 0
        ? `Exported ${result.rowCount} rows.`
        : "No logs found. Empty CSV header was exported.",
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Theme</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.button, mode === "dark" && styles.buttonActive]}
            onPress={() => setMode("dark")}
          >
            <Text style={styles.buttonText}>Dark</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, mode === "light" && styles.buttonActive]}
            onPress={() => setMode("light")}
          >
            <Text style={styles.buttonText}>Light</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Data Export</Text>
        <TouchableOpacity style={styles.exportBtn} onPress={onExport}>
          <Text style={styles.exportBtnText}>Export Logs to CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Categories Management</Text>
        <CategoriesScreen embedded />
      </View>

      <RawDataAdmin />
    </ScrollView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 10,
      padding: 12,
      marginBottom: 12,
    },
    title: { color: theme.textPrimary, fontWeight: "700", marginBottom: 10, fontSize: 15 },
    row: { flexDirection: "row", gap: 8 },
    button: {
      backgroundColor: theme.background,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    buttonActive: { borderColor: theme.accent },
    buttonText: { color: theme.textPrimary, fontWeight: "700" },
    exportBtn: {
      backgroundColor: theme.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    exportBtnText: { color: "#FFFFFF", fontWeight: "800" },
  });
