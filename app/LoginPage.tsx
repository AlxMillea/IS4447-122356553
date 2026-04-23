import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppTheme } from "../state/theme-provider";

export type LoginPageProps = {
  onEnter: () => void;
  showDeletedBanner?: boolean;
  onBannerDismissed?: () => void;
};

export default function LoginPage({ onEnter, showDeletedBanner, onBannerDismissed }: LoginPageProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!showDeletedBanner) return;
    const t = setTimeout(() => onBannerDismissed?.(), 3000);
    return () => clearTimeout(t);
  }, [showDeletedBanner, onBannerDismissed]);

  return (
    <View style={styles.container}>
      {showDeletedBanner && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>This profile has been deleted.</Text>
        </View>
      )}

      <Text style={styles.title}>Chicago Tracker</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={onEnter}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onEnter}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      padding: 16,
    },
    banner: {
      position: "absolute",
      top: 60,
      left: 16,
      right: 16,
      backgroundColor: "#EF4444",
      borderRadius: 10,
      padding: 14,
      alignItems: "center",
    },
    bannerText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
    title: {
      color: theme.accent,
      fontSize: 40,
      fontWeight: "900",
      textAlign: "center",
      marginBottom: 6,
    },
    input: {
      backgroundColor: theme.surface,
      color: theme.textPrimary,
      borderColor: theme.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      marginBottom: 10,
    },
    button: {
      backgroundColor: theme.accent,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
      marginBottom: 10,
    },
    buttonText: { color: "#FFFFFF", fontWeight: "800" },
  });
