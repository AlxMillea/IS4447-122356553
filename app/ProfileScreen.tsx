import { User } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme } from "../state/theme-provider";

type ProfileScreenProps = {
  onLogout: () => void;
  onDeleteProfile: () => void;
};

export default function ProfileScreen({ onLogout, onDeleteProfile }: ProfileScreenProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarContainer}>
        <View style={styles.avatarCircle}>
          <User size={56} color={theme.accent} />
        </View>
        <Text style={styles.name}>Alex Millea</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>General Details</Text>
        <Row styles={styles} label="Location" value="Cork" />
        <Row styles={styles} label="Chicago Trip" value="25 May 2026" />
        <Row styles={styles} label="Goal" value="Getting in best shape possible" />
        <Row styles={styles} label="Training" value="4-Day Split + Football" />
        <Row styles={styles} label="Daily Protein" value="185 g" />
        <Row styles={styles} label="Gym Days" value="2,800 kcal" />
        <Row styles={styles} label="Rest Days" value="2,100 kcal" />
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteButton} onPress={onDeleteProfile}>
        <Text style={styles.deleteButtonText}>Delete Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { padding: 20, paddingBottom: 40 },
    avatarContainer: { alignItems: "center", marginBottom: 28 },
    avatarCircle: {
      width: 96,
      height: 96,
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.accent,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 12,
    },
    name: {
      color: theme.textPrimary,
      fontSize: 24,
      fontWeight: "800",
      marginBottom: 4,
    },
    card: {
      backgroundColor: theme.surface,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardTitle: {
      color: theme.accent,
      fontWeight: "500",
      fontSize: 11,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    rowLabel: { color: theme.textSecondary, fontSize: 14 },
    rowValue: { color: theme.textPrimary, fontSize: 14, fontWeight: "600" },
    logoutButton: {
      backgroundColor: theme.surface,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.accent,
      marginBottom: 10,
    },
    logoutButtonText: { color: theme.accent, fontWeight: "700", fontSize: 16 },
    deleteButton: {
      backgroundColor: theme.surface,
      paddingVertical: 14,
      alignItems: "center",
      borderWidth: 1,
      borderColor: "#EF4444",
    },
    deleteButtonText: { color: "#EF4444", fontWeight: "700", fontSize: 16 },
  });
