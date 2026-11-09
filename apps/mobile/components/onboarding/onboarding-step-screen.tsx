import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingBackButton } from '@/components/onboarding/onboarding-back-button';
import { OnboardingButton } from '@/components/onboarding/onboarding-button';
import { OnboardingErrorText } from '@/components/onboarding/onboarding-error-text';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { OnboardingColors } from '@/constants/theme';
import { PROFILE_SETUP_STEPS, type ProfileSetupStep } from '@/contexts/profile-setup-context';

const SUBTITLE = 'This helps us personalize your experience and recommendations.';

// Shell for each question of the profile setup flow: back + progress header,
// the question, the step's input, and a Continue button pinned at the bottom.
export function OnboardingStepScreen({
  step,
  title,
  highlight,
  canContinue = true,
  loading,
  error,
  onContinue,
  children,
}: PropsWithChildren<{
  step: ProfileSetupStep;
  title: string;
  highlight: string;
  canContinue?: boolean;
  loading?: boolean;
  error?: string;
  onContinue: () => void;
}>) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const stepNumber = PROFILE_SETUP_STEPS.indexOf(step) + 1;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
        bounces={false}>
        <View style={styles.header}>
          {/* The first question has nothing to go back to: the account
              screens are gone once signed in. */}
          {router.canGoBack() ? (
            <OnboardingBackButton testID={`onboarding.${step}.backButton`} />
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <OnboardingProgress step={stepNumber} total={PROFILE_SETUP_STEPS.length} />
        </View>

        <Text style={styles.headline} accessibilityRole="header">
          {title}
          <Text style={styles.highlight}>{highlight}</Text>
        </Text>
        <Text style={styles.subtitle}>{SUBTITLE}</Text>

        <View style={styles.body}>{children}</View>

        <OnboardingErrorText message={error} testID={`onboarding.${step}.errorMessage`} />

        <View style={styles.footer}>
          <OnboardingButton
            label="Continue"
            chevron
            disabled={!canContinue}
            loading={loading}
            onPress={onContinue}
            testID={`onboarding.${step}.continueButton`}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, marginLeft: -6 },
  backPlaceholder: { width: 28 },
  headline: { marginTop: 36, fontSize: 38, lineHeight: 44, fontWeight: '700', color: OnboardingColors.text },
  highlight: { color: OnboardingColors.accent },
  subtitle: { marginTop: 12, fontSize: 16, lineHeight: 23, color: OnboardingColors.textMuted },
  body: { marginTop: 32 },
  footer: { marginTop: 'auto', paddingTop: 32 },
});
