import { StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../state/theme-provider";

export default function ModalScreen() {
  const { theme } = useAppTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is a modal</Text>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backgroundColor: theme.background,
    },
    title: { color: theme.textPrimary, fontSize: 22, fontWeight: "700" },
  });
