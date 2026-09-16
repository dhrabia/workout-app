import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

// A thin rounded track + fill bar — shared by the Body screen's weight-goal
// progress and the Workout day list's exercise-completion progress. `style`
// lets each caller size/position the track itself (e.g. width vs. flex).
export function ProgressBar({ progress, style }: { progress: number; style?: StyleProp<ViewStyle> }) {
  const tint = useThemeColor({}, 'tint');
  const track = useThemeColor({}, 'cardElevated');

  return (
    <View
      style={[styles.track, { backgroundColor: track }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
      <View style={[styles.fill, { backgroundColor: tint, width: `${progress * 100}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
