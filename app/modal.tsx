import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>This is a modal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  title: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: "700" },
});
