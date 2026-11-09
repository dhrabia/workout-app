import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { OnboardingStepScreen } from '@/components/onboarding/onboarding-step-screen';
import { OnboardingColors } from '@/constants/theme';
import { useProfileSetup } from '@/contexts/profile-setup-context';
import { GENDER_OPTIONS } from '@/lib/profile-fields';
import type { Gender } from '@/lib/types';

const ICONS: Record<Gender, ComponentProps<typeof Ionicons>['name']> = {
  male: 'male-outline',
  female: 'female-outline',
  prefer_not_to_say: 'ban-outline',
};

export default function GenderStep() {
  const router = useRouter();
  const { draft } = useProfileSetup();

  return (
    <OnboardingStepScreen
      step="gender"
      title={'What’s your\n'}
      highlight="gender?"
      canContinue={draft.gender != null}
      onContinue={() => router.push('/setup/age')}>
      <GenderOptions />
    </OnboardingStepScreen>
  );
}

function GenderOptions() {
  const { draft, update } = useProfileSetup();
  const [selected, setSelected] = useState<Gender[]>(draft.gender ? [draft.gender] : []);

  function toggle(gender: Gender) {
    const next = selected.includes(gender)
      ? selected.filter((value) => value !== gender)
      : [...selected, gender];
    setSelected(next);
    update({ gender: next[0] ?? null });
  }

  return (
    <View style={styles.options} accessibilityRole="radiogroup">
      {GENDER_OPTIONS.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Pressable
            key={option.value}
            onPress={() => toggle(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={option.label}
            testID={`setup-gender-option-${option.value}`}
            style={({ pressed }) => [styles.option, isSelected && styles.optionSelected, pressed && styles.pressed]}>
            <Ionicons
              name={ICONS[option.value]}
              size={32}
              color={isSelected ? OnboardingColors.accent : OnboardingColors.secondaryButtonText}
              style={styles.icon}
            />
            <Text style={styles.label}>{option.label}</Text>
            <View style={[styles.radio, isSelected && styles.radioSelected]}>
              {isSelected ? <Ionicons name="checkmark" size={20} color={OnboardingColors.primaryButtonText} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: 14 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 80,
    paddingHorizontal: 22,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: OnboardingColors.secondaryButtonBorder,
    backgroundColor: OnboardingColors.secondaryButton,
  },
  optionSelected: { borderColor: OnboardingColors.accent, backgroundColor: OnboardingColors.selectedBackground },
  pressed: { opacity: 0.85 },
  icon: { width: 40 },
  label: { flex: 1, marginLeft: 16, fontSize: 17, fontWeight: '600', color: OnboardingColors.text },
  radio: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: OnboardingColors.secondaryButtonBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: OnboardingColors.accent, backgroundColor: OnboardingColors.accent },
});
