import { User } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme/theme";

type ProfileScreenProps = {
  onLogout: () => void;
};

export default function ProfileScreen({ onLogout }: ProfileScreenProps) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <User size={56} color={theme.colors.accent} />
        </View>
        <Text style={styles.name}>Alex Millea</Text>
        <Text style={styles.email}>122356553@umail.ucc.ie</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>General Details</Text>
        <Row label="Location" value="Cork, Ireland" />
        <Row label="Chicago Trip" value="Summer 2025" />
        <Row label="Goal" value="Marathon Prep" />
        <Row label="Training Phase" value="Base Building" />
        <Row label="Weekly Target" value="50 km" />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 40 },
  avatarContainer: { alignItems: "center", marginBottom: 28 },
  avatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  name: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  email: { color: theme.colors.textSecondary, fontSize: 14 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    color: theme.colors.accent,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  rowLabel: { color: theme.colors.textSecondary, fontSize: 14 },
  rowValue: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: "600" },
  logoutButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  logoutText: { color: theme.colors.accent, fontWeight: "700", fontSize: 16 },
});
