import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps, type ReactNode, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { OnboardingColors } from '@/constants/theme';

export function OnboardingTextField({
  label,
  icon,
  trailing,
  hasError,
  ref,
  onFocus,
  onBlur,
  ...rest
}: TextInputProps & {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  trailing?: ReactNode;
  hasError?: boolean;
  ref?: Ref<TextInput>;
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.box, isFocused && styles.boxFocused, hasError && styles.boxError]}>
        <Ionicons name={icon} size={22} color={OnboardingColors.text} />
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor={OnboardingColors.textFaint}
          selectionColor={OnboardingColors.accent}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { marginBottom: 8, fontSize: 16, fontWeight: '600', color: OnboardingColors.text },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: OnboardingColors.secondaryButtonBorder,
    backgroundColor: OnboardingColors.secondaryButton,
  },
  boxFocused: { borderColor: OnboardingColors.accent },
  boxError: { borderColor: OnboardingColors.error },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: OnboardingColors.text },
});
