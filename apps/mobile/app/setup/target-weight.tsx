import { useRouter } from 'expo-router';

import { OnboardingStepScreen } from '@/components/onboarding/onboarding-step-screen';
import { OnboardingWheelCard } from '@/components/onboarding/onboarding-wheel-card';
import { useProfileSetup } from '@/contexts/profile-setup-context';
import { useSaveProfileSetup } from '@/hooks/queries/use-profile';
import { snapToWeightWheel, WEIGHT_WHEEL_VALUES } from '@/lib/profile-fields';
import { formatWeight, WEIGHT_DEFAULT } from '@/lib/weight';

const SAVE_ERROR = 'Couldn’t save your profile. Check your connection and try again.';

export default function TargetWeightStep() {
  const router = useRouter();
  const { draft, update } = useProfileSetup();
  const saveProfile = useSaveProfileSetup();

  // Starts at the current weight: the most likely neighbourhood of a goal.
  const targetWeightKg = draft.targetWeightKg ?? snapToWeightWheel(draft.weightKg ?? WEIGHT_DEFAULT);

  function submit() {
    const { gender, age, heightCm, weightKg } = draft;
    // Earlier steps always fill these before navigating here; this guards a
    // deep link straight to this step.
    if (gender == null || age == null || heightCm == null || weightKg == null) {
      router.dismissTo('/setup/gender');
      return;
    }

    update({ targetWeightKg });
    saveProfile.mutate(
      { gender, age, heightCm, weightKg, targetWeightKg },
      { onSuccess: () => router.push('/setup/all-set') }
    );
  }

  return (
    <OnboardingStepScreen
      step="target-weight"
      title={'What’s your\n'}
      highlight="target weight?"
      loading={saveProfile.isPending}
      error={saveProfile.isError ? SAVE_ERROR : undefined}
      onContinue={submit}>
      <OnboardingWheelCard
        values={WEIGHT_WHEEL_VALUES}
        value={targetWeightKg}
        onChange={(value) => {
          update({ targetWeightKg: value });
          if (saveProfile.isError) saveProfile.reset();
        }}
        unit="kg"
        formatValue={formatWeight}
        testID="setup-target-weight-picker"
      />
    </OnboardingStepScreen>
  );
}
