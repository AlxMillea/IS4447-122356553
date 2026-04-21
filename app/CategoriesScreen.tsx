import { useEffect, useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    CATEGORY_COLOR_OPTIONS,
    normalizeCategoryColor,
} from "../constants/category-colors";
import {
    deleteCategory,
    getCategories,
    insertCategory,
    updateCategory,
} from "../db/db-repo";
import { theme } from "../theme/theme";

type CategoryRow = { id: number; name: string; color: string; icon: string };

export default function CategoriesScreen() {
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(CATEGORY_COLOR_OPTIONS[0]);
  const [editingId, setEditingId] = useState<number | null>(null);

  async function refresh() {
    const data = (await getCategories()) as CategoryRow[];
    setRows(
      data.map((item) => ({
        ...item,
        color: normalizeCategoryColor(item.color),
      })),
    );
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onSubmit() {
    if (!name.trim()) return;
    if (editingId !== null) await updateCategory(editingId, name, color, "");
    else await insertCategory(name, color, "");
    setName("");
    setColor(CATEGORY_COLOR_OPTIONS[0]);
    setEditingId(null);
    await refresh();
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Category Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Train"
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorRow}>
          {CATEGORY_COLOR_OPTIONS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.colorChip,
                { backgroundColor: c },
                color === c && styles.colorChipActive,
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={onSubmit}>
          <Text style={styles.buttonText}>
            {editingId ? "Update Category" : "Create Category"}
          </Text>
        </TouchableOpacity>
      </View>

      {rows.map((row) => (
        <View key={row.id} style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{row.name}</Text>
            <Text style={styles.meta}>Color: {row.color}</Text>
          </View>
          <View style={[styles.dot, { backgroundColor: row.color }]} />
          <TouchableOpacity
            style={styles.smallBtn}
            onPress={() => {
              setEditingId(row.id);
              setName(row.name);
              setColor(normalizeCategoryColor(row.color));
            }}
          >
            <Text style={styles.smallBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.smallBtn, styles.deleteBtn]}
            onPress={async () => {
              await deleteCategory(row.id);
              await refresh();
            }}
          >
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: theme.colors.background },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    color: theme.colors.textPrimary,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: theme.colors.background,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  colorRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  colorChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorChipActive: { borderColor: theme.colors.textPrimary },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  buttonText: { color: "#FFFFFF", fontWeight: "700" },
  row: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: { color: theme.colors.textPrimary, fontWeight: "700" },
  meta: { color: theme.colors.textSecondary },
  dot: { width: 14, height: 14, borderRadius: 7 },
  smallBtn: {
    backgroundColor: "#E2E8F0",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  smallBtnText: { color: theme.colors.textPrimary, fontWeight: "700" },
  deleteBtn: { backgroundColor: "#FEE2E2" },
  deleteText: { color: "#B91C1C", fontWeight: "700" },
});
