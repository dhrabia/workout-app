import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

// The filled teal "Start workout"/"Start next exercise"/"Log set" pill —
// shared by the Workout tab's next-day hero card, its plan day-picker
// screen, and the exercise session screen, so each launches/confirms its
// own action the same way.
export function StartWorkoutButton({
  label = 'Start workout',
  icon = 'play.fill',
  onPress,
  style,
  testID,
}: {
  label?: string;
  icon?: ComponentProps<typeof IconSymbol>['name'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const tint = useThemeColor({}, 'tint');
  const tintDark = useThemeColor({}, 'tintDark');
  const buttonText = useThemeColor({}, 'buttonText');

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? tintDark : tint }, style]}
      testID={testID}>
      <IconSymbol name={icon} size={16} color={buttonText} />
      <ThemedText style={[styles.label, { color: buttonText }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 30,
  },
  label: { fontSize: 16, fontWeight: '700' },
});
