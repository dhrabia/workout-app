import { useRouter } from 'expo-router';

import { OnboardingStepScreen } from '@/components/onboarding/onboarding-step-screen';
import { OnboardingWheelCard } from '@/components/onboarding/onboarding-wheel-card';
import { useProfileSetup } from '@/contexts/profile-setup-context';
import { AGE_DEFAULT, AGE_VALUES } from '@/lib/profile-fields';

export default function AgeStep() {
  const router = useRouter();
  const { draft, update } = useProfileSetup();
  const age = draft.age ?? AGE_DEFAULT;

  return (
    <OnboardingStepScreen
      step="age"
      title="How old are "
      highlight="you?"
      onContinue={() => {
        // Stores the default too when the wheel was never touched.
        update({ age });
        router.push('/setup/height');
      }}>
      <OnboardingWheelCard
        values={AGE_VALUES}
        value={age}
        onChange={(value) => update({ age: value })}
        unit="years"
        testID="setup-age-picker"
      />
    </OnboardingStepScreen>
  );
}
