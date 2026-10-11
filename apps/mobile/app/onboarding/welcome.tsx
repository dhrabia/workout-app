import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/components/onboarding/onboarding-button';
import { OnboardingPhoto } from '@/components/onboarding/onboarding-photo';
import { OnboardingColors } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <OnboardingPhoto
        source={require('@/assets/images/onboarding/welcome-bg.webp')}
        height="80%"
        contentPosition="bottom"
      />

      <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.copy}>
          <Text style={styles.headline}>Your training.</Text>
          <Text style={[styles.headline, styles.headlineAccent]}>Your progress.</Text>
          <Text style={styles.subtitle}>
            Create workout plans, track your workouts and monitor your progress — all in one place.
          </Text>
        </View>

        <OnboardingButton
          label="Get started"
          icon="play.fill"
          onPress={() => router.push('/onboarding/create-account')}
          testID="welcome-get-started-button"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 22 },
  copy: { marginTop: 'auto', marginBottom: 52 },
  headline: { fontSize: 38, lineHeight: 44, fontWeight: '700', color: OnboardingColors.text },
  headlineAccent: { color: OnboardingColors.accent },
  subtitle: { marginTop: 20, fontSize: 16, lineHeight: 23, color: OnboardingColors.textMuted },
});
