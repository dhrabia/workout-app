import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export function OutlineButton({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const tint = useThemeColor({}, 'tint');
  const tintDark = useThemeColor({}, 'tintDark');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, { borderColor: pressed ? tintDark : tint }, style]}>
      {({ pressed }) => <ThemedText style={{ color: pressed ? tintDark : tint }}>{label}</ThemedText>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
});
