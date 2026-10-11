import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GoogleLogo } from '@/components/onboarding/google-logo';
import { OnboardingBackButton } from '@/components/onboarding/onboarding-back-button';
import { OnboardingPhoto } from '@/components/onboarding/onboarding-photo';
import { OnboardingProviderButton } from '@/components/onboarding/onboarding-provider-button';
import { OnboardingColors } from '@/constants/theme';

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <OnboardingPhoto
        source={require('@/assets/images/onboarding/create-account-bg.webp')}
        height="52%"
        fadeStart={0.5}
      />

      <OnboardingBackButton testID="create-account-back-button" style={[styles.back, { top: insets.top + 8 }]} />

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.copy}>
          <Text style={styles.headline}>
            Create your <Text style={styles.headlineAccent}>account</Text>
          </Text>
          <Text style={styles.subtitle}>
            Join and start building a healthier, stronger you with personalized workout plans and progress tracking.
          </Text>
        </View>

        <View style={styles.providers}>
          <OnboardingProviderButton
            variant="light"
            label="Continue with Apple"
            icon={<Ionicons name="logo-apple" size={24} color={OnboardingColors.lightButtonText} />}
            onPress={() => {}}
            testID="create-account-apple-button"
          />
          <OnboardingProviderButton
            label="Continue with Google"
            icon={<GoogleLogo />}
            onPress={() => {}}
            testID="create-account-google-button"
          />
          <OnboardingProviderButton
            label="Continue with email"
            icon={<Ionicons name="mail-outline" size={24} color={OnboardingColors.text} />}
            onPress={() => router.push('/onboarding/email-sign-up')}
            testID="create-account-email-button"
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerLabel}>or</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.login}>
          <Text style={styles.loginPrompt}>Already have an account?</Text>
          <Pressable onPress={() => {}} hitSlop={8} accessibilityRole="button" testID="create-account-login-button">
            <Text style={styles.loginLink}>Log in</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { position: 'absolute', left: 16, zIndex: 1 },
  content: { flex: 1, paddingHorizontal: 22 },
  copy: { marginTop: 'auto', marginBottom: 28 },
  headline: { fontSize: 34, lineHeight: 40, fontWeight: '700', color: OnboardingColors.text },
  headlineAccent: { color: OnboardingColors.accent },
  subtitle: { marginTop: 12, fontSize: 16, lineHeight: 23, color: OnboardingColors.textMuted },
  providers: { gap: 13 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 28 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: OnboardingColors.divider },
  dividerLabel: { fontSize: 14, color: OnboardingColors.textFaint },
  login: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  loginPrompt: { fontSize: 16, color: OnboardingColors.textMuted },
  loginLink: { fontSize: 16, fontWeight: '600', color: OnboardingColors.accent },
});
