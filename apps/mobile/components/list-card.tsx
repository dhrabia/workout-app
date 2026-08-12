import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ListCardProps = {
  title: string;
  meta?: ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  trailing?: ReactNode;
};

// The rounded, filled-background row used throughout the plan builder's list
// screens (plans, days, exercises) — a title, an optional secondary line
// below a hairline separator, and an optional trailing action.
export function ListCard({ title, meta, onPress, onLongPress, trailing }: ListCardProps) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      <Pressable style={styles.content} onPress={onPress} onLongPress={onLongPress}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        {meta ? (
          <>
            <View style={[styles.separator, { backgroundColor: borderColor }]} />
            {meta}
          </>
        ) : null}
      </Pressable>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  content: { flex: 1, gap: 6 },
  separator: { height: StyleSheet.hairlineWidth },
});
