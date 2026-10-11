import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { OnboardingColors } from '@/constants/theme';

export function OnboardingDivider({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.line} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: OnboardingColors.divider },
  label: { fontSize: 14, color: OnboardingColors.textFaint },
});
