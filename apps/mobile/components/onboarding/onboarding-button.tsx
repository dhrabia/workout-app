import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { OnboardingColors } from '@/constants/theme';

export function OnboardingButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: ComponentProps<typeof IconSymbol>['name'];
  testID?: string;
}) {
  const isPrimary = variant === 'primary';
  const iconColor = isPrimary ? OnboardingColors.primaryButtonText : OnboardingColors.secondaryButtonText;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
      ]}>
      {icon ? <IconSymbol name={icon} size={18} color={iconColor} /> : null}
      <Text style={isPrimary ? styles.primaryLabel : styles.secondaryLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primary: { minHeight: 54, borderRadius: 27, backgroundColor: OnboardingColors.primaryButton },
  secondary: {
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: OnboardingColors.secondaryButtonBorder,
    backgroundColor: OnboardingColors.secondaryButton,
  },
  pressed: { opacity: 0.85 },
  primaryLabel: { fontSize: 16, fontWeight: '700', color: OnboardingColors.primaryButtonText },
  secondaryLabel: { fontSize: 15, fontWeight: '500', color: OnboardingColors.secondaryButtonText },
});
