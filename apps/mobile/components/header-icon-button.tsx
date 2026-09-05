import { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export type HeaderIconButtonProps = {
  name: ComponentProps<typeof IconSymbol>['name'];
  color: string;
  size: number;
  onPress: () => void;
};

export function HeaderIconButton({ name, color, size, onPress }: HeaderIconButtonProps) {
  const backgroundColor = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const pressedColor = useThemeColor({}, 'tintDark');

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, borderColor },
        pressed && { backgroundColor: pressedColor, borderColor: pressedColor },
      ]}>
      <IconSymbol name={name} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
