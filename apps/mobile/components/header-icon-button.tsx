import { ComponentProps, PropsWithChildren } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

export type HeaderIconButtonProps = {
  name: ComponentProps<typeof IconSymbol>['name'];
  color: string;
  size: number;
  onPress: () => void;
};

// Deliberately no visible border/background here: on iOS 26, native-stack wraps a
// screen's entire headerRight output in one native pill (react-native-screens has no
// per-item bar-button API to split it), so a per-icon border/background just nests
// inside that pill instead of separating adjacent icons. The fixed 34x34 box only
// keeps every icon's tap target a consistent, adequately-sized hit area.
export function HeaderIconButton({ name, color, size, onPress }: HeaderIconButtonProps) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.button}>
      <IconSymbol name={name} size={size} color={color} />
    </Pressable>
  );
}

export function HeaderActions({ children }: PropsWithChildren) {
  return <View style={styles.actions}>{children}</View>;
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', gap: 16 },
});
