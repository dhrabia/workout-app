import type { ComponentProps, PropsWithChildren } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 16, gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBox: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '600' },
});
