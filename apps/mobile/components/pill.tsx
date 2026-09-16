import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

// A small rounded status badge (e.g. "Active" on a plan card). Uses a dark
// translucent fill rather than a theme surface color so it stays readable
// sitting on top of an arbitrary photo, not just flat backgrounds. Defaults
// to `alignSelf: 'flex-start'` for that badge-anchor use (so it hugs its own
// content instead of stretching); pass `style` to override, e.g. centering
// it in a screen that otherwise centers its children.
export function Pill({ label, style, testID }: { label: string; style?: StyleProp<ViewStyle>; testID?: string }) {
  const tint = useThemeColor({}, 'tint');

  return (
    <View style={[styles.pill, { borderColor: tint }, style]} testID={testID}>
      <ThemedText style={[styles.label, { color: tint }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  label: { fontSize: 13, fontWeight: '600' },
});
