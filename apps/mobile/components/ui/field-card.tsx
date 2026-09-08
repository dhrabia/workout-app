import { useState, type ComponentProps, type PropsWithChildren } from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

// The rounded/bordered card shell shared by every settings-style field on the
// exercise form (NumberStepper, NotesCard): a themed container plus an
// optional icon+label header row. Renders as a Pressable so a caller (e.g. a
// picker row) can pass `onPress` directly instead of wrapping it in one.
export function FieldCard({
  style,
  onPress,
  children,
}: PropsWithChildren<{ style?: StyleProp<ViewStyle>; onPress?: () => void }>) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: cardBackground, borderColor }, style]}>
      {children}
    </Pressable>
  );
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
// text field on the New Plan/Add Day/New Exercise/Select Exercise forms so
// each screen isn't re-declaring the same box styling, focus-border, and
// theme-color lookups. An optional leading `icon` supports search-style
// inputs (e.g. the exercise picker's search field).
export type FieldCardInputProps = TextInputProps & {
  error?: string;
  icon?: ComponentProps<typeof IconSymbol>['name'];
  // Opt-in: shows a trailing clear button once there's text, for search-style
  // inputs (e.g. the exercise picker) rather than every field on a form.
  onClear?: () => void;
};

export function FieldCardInput({
  error,
  style,
  multiline,
  icon,
  onFocus,
  onBlur,
  onClear,
  value,
  ...rest
}: FieldCardInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'textDisabled');
  const errorColor = useThemeColor({}, 'error');
  const inputBackground = useThemeColor({}, 'background');
  const borderColor = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');

  return (
    <>
      <View
        style={[
          styles.inputBox,
          multiline && styles.multilineBox,
          { backgroundColor: inputBackground, borderColor: isFocused ? tint : borderColor },
        ]}>
        {icon ? <IconSymbol name={icon} size={18} color={secondaryColor} /> : null}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput, { color: textColor }, style]}
          placeholderTextColor={placeholderColor}
          multiline={multiline}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {onClear && value ? (
          <Pressable onPress={onClear} hitSlop={8}>
            <IconSymbol name="xmark.circle.fill" size={18} color={secondaryColor} />
          </Pressable>
        ) : null}
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
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineBox: { alignItems: 'flex-start' },
  input: { flex: 1, fontSize: 16, padding: 0 },
  multilineInput: { minHeight: 64, textAlignVertical: 'top' },
  error: { fontSize: 13 },
});
