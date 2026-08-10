import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ReorderButtonsProps = {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp?: boolean;
  disableDown?: boolean;
};

export function ReorderButtons({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
}: ReorderButtonsProps) {
  const color = useThemeColor({}, 'icon');

  return (
    <View style={styles.container}>
      <Pressable onPress={onMoveUp} disabled={disableUp} hitSlop={8}>
        <IconSymbol name="chevron.up" size={20} color={disableUp ? `${color}55` : color} />
      </Pressable>
      <Pressable onPress={onMoveDown} disabled={disableDown} hitSlop={8}>
        <IconSymbol name="chevron.down" size={20} color={disableDown ? `${color}55` : color} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
});
