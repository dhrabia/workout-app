import { useRouter } from 'expo-router';

import { OnboardingStepScreen } from '@/components/onboarding/onboarding-step-screen';
import { OnboardingWheelCard } from '@/components/onboarding/onboarding-wheel-card';
import { useProfileSetup } from '@/contexts/profile-setup-context';
import { WEIGHT_WHEEL_VALUES } from '@/lib/profile-fields';
import { formatWeight, WEIGHT_DEFAULT } from '@/lib/weight';

export default function WeightStep() {
  const router = useRouter();
  const { draft, update } = useProfileSetup();
  const weightKg = draft.weightKg ?? WEIGHT_DEFAULT;

  return (
    <OnboardingStepScreen
      step="weight"
      title={'What’s your\n'}
      highlight="current weight?"
      onContinue={() => {
        update({ weightKg });
        router.push('/setup/target-weight');
      }}>
      <OnboardingWheelCard
        values={WEIGHT_WHEEL_VALUES}
        value={weightKg}
        onChange={(value) => update({ weightKg: value })}
        unit="kg"
        formatValue={formatWeight}
        testID="onboarding.weight.picker"
      />
    </OnboardingStepScreen>
  );
}
