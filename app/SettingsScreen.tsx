import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";
import CategoriesScreen from "./CategoriesScreen";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <CategoriesScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  title: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});
