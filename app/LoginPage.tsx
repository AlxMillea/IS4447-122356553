import { useState } from "react";
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
};

export default function LoginPage({ onEnter }: LoginPageProps) {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chicago Tracker</Text>
      <Text style={styles.subtitle}>Fake Login</Text>

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
    title: {
      color: theme.accent,
      fontSize: 40,
      fontWeight: "900",
      textAlign: "center",
      marginBottom: 6,
    },
    subtitle: {
      color: theme.textSecondary,
      textAlign: "center",
      marginBottom: 18,
      fontSize: 16,
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
