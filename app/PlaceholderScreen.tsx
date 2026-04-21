import { Text, View } from "react-native";

export default function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
}
