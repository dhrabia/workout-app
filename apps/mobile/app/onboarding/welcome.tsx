import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/components/onboarding/onboarding-button';
import { OnboardingColors } from '@/constants/theme';

const BACKGROUND_FADE: [string, string] = [`${OnboardingColors.background}00`, OnboardingColors.background];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.photo} pointerEvents="none">
        <Image
          source={require('@/assets/images/onboarding/welcome-bg.webp')}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="bottom"
        />
        <LinearGradient colors={BACKGROUND_FADE} locations={[0.6, 1]} style={StyleSheet.absoluteFill} />
      </View>

      <View style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.copy}>
          <Text style={styles.headline}>Your training.</Text>
          <Text style={[styles.headline, styles.headlineAccent]}>Your progress.</Text>
          <Text style={styles.subtitle}>
            Create workout plans, track your workouts and monitor your progress — all in one place.
          </Text>
        </View>

        <OnboardingButton label="Get started" icon="play.fill" onPress={() => {}} testID="welcome-get-started-button" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  photo: { position: 'absolute', top: 0, left: 0, right: 0, height: '80%' },
  content: { flex: 1, paddingHorizontal: 22 },
  copy: { marginTop: 'auto', marginBottom: 52 },
  headline: { fontSize: 38, lineHeight: 44, fontWeight: '700', color: OnboardingColors.text },
  headlineAccent: { color: OnboardingColors.accent },
  subtitle: { marginTop: 20, fontSize: 16, lineHeight: 23, color: OnboardingColors.textMuted },
});
