import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingColors } from '@/constants/theme';

export function OnboardingProviderButton({
  label,
  icon,
  onPress,
  variant = 'dark',
  testID,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  variant?: 'light' | 'dark';
  testID?: string;
}) {
  const isLight = variant === 'light';
  const textColor = isLight ? OnboardingColors.lightButtonText : OnboardingColors.text;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, isLight ? styles.light : styles.dark, pressed && styles.pressed]}>
      <View style={styles.icon}>{icon}</View>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={textColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: 24, paddingHorizontal: 20 },
  light: { backgroundColor: OnboardingColors.lightButton },
  dark: {
    borderWidth: 1,
    borderColor: OnboardingColors.secondaryButtonBorder,
    backgroundColor: OnboardingColors.secondaryButton,
  },
  pressed: { opacity: 0.85 },
  icon: { width: 24, alignItems: 'center' },
  label: { flex: 1, marginLeft: 36, fontSize: 16, fontWeight: '500' },
});
