import { useRouter } from 'expo-router';

import { OnboardingStepScreen } from '@/components/onboarding/onboarding-step-screen';
import { OnboardingWheelCard } from '@/components/onboarding/onboarding-wheel-card';
import { useProfileSetup } from '@/contexts/profile-setup-context';
import { HEIGHT_DEFAULT, HEIGHT_VALUES } from '@/lib/profile-fields';

export default function HeightStep() {
  const router = useRouter();
  const { draft, update } = useProfileSetup();
  const heightCm = draft.heightCm ?? HEIGHT_DEFAULT;

  return (
    <OnboardingStepScreen
      step="height"
      title="How tall are "
      highlight="you?"
      onContinue={() => {
        update({ heightCm });
        router.push('/setup/weight');
      }}>
      <OnboardingWheelCard
        values={HEIGHT_VALUES}
        value={heightCm}
        onChange={(value) => update({ heightCm: value })}
        unit="cm"
        testID="onboarding.height.picker"
      />
    </OnboardingStepScreen>
  );
}
