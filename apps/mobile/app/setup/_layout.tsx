import { Stack } from 'expo-router';

import { OnboardingColors } from '@/constants/theme';
import { PROFILE_SETUP_STEPS, ProfileSetupProvider } from '@/contexts/profile-setup-context';

export const unstable_settings = { initialRouteName: PROFILE_SETUP_STEPS[0] };

// Profile setup questionnaire, shown to signed-in users until they finish it
// (profiles.onboarding_completed — see the root layout's guards).
export default function ProfileSetupLayout() {
  return (
    <ProfileSetupProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: OnboardingColors.background } }}>
        {/* Listed in flow order: the first one is where users land when the
            root navigator switches to this group (initialRouteName alone
            doesn't decide that). */}
        {PROFILE_SETUP_STEPS.map((step) => (
          <Stack.Screen key={step} name={step} />
        ))}
        {/* Answers are already saved by the time All Set shows; it only
            moves forward, into the app. */}
        <Stack.Screen name="all-set" options={{ gestureEnabled: false }} />
      </Stack>
    </ProfileSetupProvider>
  );
}
