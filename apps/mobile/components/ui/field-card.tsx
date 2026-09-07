import type { ComponentProps, PropsWithChildren } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

// The rounded/bordered card shell shared by every settings-style field on the
// exercise form (NumberStepper, NotesCard): a themed container plus an
// optional icon+label header row.
export function FieldCard({ style, children }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return <View style={[styles.card, { backgroundColor: cardBackground, borderColor }, style]}>{children}</View>;
}

export function FieldCardLabel({
  label,
  icon,
}: {
  label: string;
  icon?: ComponentProps<typeof IconSymbol>['name'];
}) {
  const controlBackground = useThemeColor({}, 'cardElevated');
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');

  return (
    <View style={styles.labelRow}>
      {icon ? (
        <View style={[styles.iconBox, { backgroundColor: controlBackground }]}>
          <IconSymbol name={icon} size={15} color={tint} />
        </View>
      ) : null}
      <ThemedText style={[styles.label, { color: secondaryColor }]}>{label}</ThemedText>
    </View>
  );
}

// The dark, bordered input box used under a FieldCardLabel — shared by every
// text field on the New Plan/Add Day/New Exercise forms so each screen isn't
// re-declaring the same box styling and theme-color lookups.
export type FieldCardInputProps = TextInputProps & { error?: string };

export function FieldCardInput({ error, style, multiline, ...rest }: FieldCardInputProps) {
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'textDisabled');
  const errorColor = useThemeColor({}, 'error');
  const inputBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');

  return (
    <>
      <View
        style={[
          styles.inputBox,
          multiline && styles.multilineBox,
          { backgroundColor: inputBackground, borderColor },
        ]}>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput, { color: textColor }, style]}
          placeholderTextColor={placeholderColor}
          multiline={multiline}
          {...rest}
        />
      </View>
      {error ? <ThemedText style={[styles.error, { color: errorColor }]}>{error}</ThemedText> : null}
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600' },
  inputBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  multilineBox: { alignItems: 'flex-start' },
  input: { fontSize: 16, padding: 0 },
  multilineInput: { width: '100%', minHeight: 64, textAlignVertical: 'top' },
  error: { fontSize: 13 },
});
