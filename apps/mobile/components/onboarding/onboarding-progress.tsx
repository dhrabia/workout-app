import { StyleSheet, Text, View } from 'react-native';

import { OnboardingColors } from '@/constants/theme';

export const ONBOARDING_STEP_COUNT = 7;

export function OnboardingProgress({ step }: { step: number }) {
  return (
    <View style={styles.row}>
      <View style={styles.segments}>
        {Array.from({ length: ONBOARDING_STEP_COUNT }, (_, index) => (
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
        {step}/{ONBOARDING_STEP_COUNT}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { width: 28, height: 6, borderRadius: 3 },
  label: { fontSize: 13, color: OnboardingColors.textFaint },
});
