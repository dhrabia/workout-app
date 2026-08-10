import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type FormFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export function FormField({ label, error, style, ...rest }: FormFieldProps) {
  const color = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.label}>
        {label}
      </ThemedText>
      <TextInput
        style={[styles.input, { color, borderColor }, style]}
        placeholderTextColor={borderColor}
        {...rest}
      />
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  error: {
    color: '#e53935',
    fontSize: 13,
  },
});
