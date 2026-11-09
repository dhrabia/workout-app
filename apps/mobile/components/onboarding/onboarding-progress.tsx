import { StyleSheet, Text, View } from 'react-native';

import { OnboardingColors } from '@/constants/theme';

// Segmented "step n of total" bar for the profile setup questionnaire.
export function OnboardingProgress({ step, total }: { step: number; total: number }) {
  return (
    <View
      style={styles.row}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${step} of ${total}`}
      accessibilityValue={{ min: 0, max: total, now: step }}
      testID="onboarding.progress">
      <View style={styles.segments}>
        {Array.from({ length: total }, (_, index) => (
          <View
            key={index}
            style={[
              styles.segment,
              { backgroundColor: index < step ? OnboardingColors.progressActive : OnboardingColors.progressInactive },
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>
        {step}/{total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  segments: { flex: 1, flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 6, borderRadius: 3 },
  label: { fontSize: 15, fontWeight: '500', color: OnboardingColors.textMuted },
});
