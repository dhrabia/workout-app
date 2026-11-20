import { StyleSheet, View } from 'react-native';

import { WheelPicker, type WheelPickerAppearance } from '@/components/wheel-picker';
import { OnboardingColors } from '@/constants/theme';

const HIGHLIGHT_INSET = 12;

const APPEARANCE: WheelPickerAppearance = {
  itemHeight: 44,
  visibleItems: 7,
  textStyle: { fontSize: 22, lineHeight: 28, color: OnboardingColors.textFaint },
  selectedTextStyle: { fontSize: 34, lineHeight: 40, fontWeight: '700', color: OnboardingColors.text },
  highlightStyle: {
    left: HIGHLIGHT_INSET,
    right: HIGHLIGHT_INSET,
    borderWidth: 1.5,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderRadius: 16,
    borderColor: OnboardingColors.accent,
    backgroundColor: OnboardingColors.selectedBackground,
  },
  unitStyle: { fontSize: 16, color: OnboardingColors.textMuted },
};

// The shared WheelPicker, framed and styled for the onboarding questionnaire.
export function OnboardingWheelCard({
  values,
  value,
  onChange,
  unit,
  formatValue,
  testID,
}: {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  unit: string;
  formatValue?: (value: number) => string;
  testID?: string;
}) {
  return (
    <View style={styles.card}>
      <WheelPicker
        values={values}
        value={value}
        onChange={onChange}
        unit={unit}
        formatValue={formatValue}
        appearance={APPEARANCE}
        testID={testID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: OnboardingColors.secondaryButtonBorder,
    backgroundColor: OnboardingColors.secondaryButton,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
