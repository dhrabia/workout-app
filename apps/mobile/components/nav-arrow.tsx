import { Pressable, StyleSheet } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

// The round ‹ / › stepper button — shared by the exercise session's set
// navigation and the Workout Summary's exercise carousel. Greys out (and
// stops responding) at either end of whatever it's paging through.
export function NavArrow({
  direction,
  disabled,
  onPress,
  testID,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const tint = useThemeColor({}, 'tint');
  const textDisabled = useThemeColor({}, 'textDisabled');
  const controlBackground = useThemeColor({}, 'cardElevated');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={direction === 'left' ? 'Previous' : 'Next'}
      accessibilityState={{ disabled }}
      style={[styles.navArrow, { backgroundColor: controlBackground }]}
      testID={testID}>
      <IconSymbol
        name={direction === 'left' ? 'chevron.left' : 'chevron.right'}
        size={18}
        color={disabled ? textDisabled : tint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navArrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
