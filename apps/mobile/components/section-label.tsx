import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

// The small uppercase section heading used above a card on Profile and Body
// (e.g. "PERSONAL INFORMATION", "BODY MEASUREMENTS").
export function SectionLabel({ children }: { children: string }) {
  const color = useThemeColor({}, 'icon');
  return <ThemedText style={[styles.label, { color }]}>{children}</ThemedText>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
});
