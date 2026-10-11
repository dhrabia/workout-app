import { Stack } from 'expo-router';

import { OnboardingColors } from '@/constants/theme';

export const unstable_settings = { initialRouteName: 'welcome' };

export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: OnboardingColors.background } }} />;
}
