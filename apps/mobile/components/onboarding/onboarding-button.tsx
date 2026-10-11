import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { OnboardingColors } from '@/constants/theme';

export function OnboardingButton({
  label,
  onPress,
  variant = 'primary',
  icon,
  chevron,
  loading,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  icon?: ComponentProps<typeof IconSymbol>['name'];
  chevron?: boolean;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const isPrimary = variant === 'primary';
  const inactive = disabled || loading;
  const contentColor = isPrimary ? OnboardingColors.primaryButtonText : OnboardingColors.secondaryButtonText;

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <>
          {icon ? <IconSymbol name={icon} size={18} color={contentColor} /> : null}
          <Text style={isPrimary ? styles.primaryLabel : styles.secondaryLabel}>{label}</Text>
          {chevron ? <Ionicons name="chevron-forward" size={18} color={contentColor} style={styles.chevron} /> : null}
        </>
      )}
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
  disabled: { opacity: 0.4 },
  chevron: { position: 'absolute', right: 24 },
  primaryLabel: { fontSize: 16, fontWeight: '700', color: OnboardingColors.primaryButtonText },
  secondaryLabel: { fontSize: 15, fontWeight: '500', color: OnboardingColors.secondaryButtonText },
});
