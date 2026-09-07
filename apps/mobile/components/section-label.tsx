import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

// The small uppercase section heading used above a card on Profile and Body
// (e.g. "PERSONAL INFORMATION", "BODY MEASUREMENTS"). An optional `count`
// renders a muted number on the trailing edge (e.g. "CHEST EXERCISES  12").
export function SectionLabel({ children, count }: { children: string; count?: number }) {
  const color = useThemeColor({}, 'icon');

  if (count === undefined) {
    return <ThemedText style={[styles.label, { color }]}>{children}</ThemedText>;
  }

  return (
    <View style={styles.row}>
      <ThemedText style={[styles.label, { color }]}>{children}</ThemedText>
      <ThemedText style={[styles.count, { color }]}>{count}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  count: { fontSize: 13, fontWeight: '600' },
});
