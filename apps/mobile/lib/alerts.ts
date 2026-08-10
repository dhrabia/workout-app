import { Alert } from "react-native";

export function confirmDestructive(
  title: string,
  message: string | undefined,
  actionLabel: string,
  onConfirm: () => void
) {
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: actionLabel, style: "destructive", onPress: onConfirm },
  ]);
}
