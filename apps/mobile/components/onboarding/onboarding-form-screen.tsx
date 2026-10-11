import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingBackButton } from '@/components/onboarding/onboarding-back-button';
import { OnboardingColors } from '@/constants/theme';

// Shell for the email sign-up and log-in screens.
export function OnboardingFormScreen({
  title,
  highlight,
  subtitle,
  backTestID,
  children,
}: PropsWithChildren<{ title: string; highlight: string; subtitle: string; backTestID: string }>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          <OnboardingBackButton style={styles.back} testID={backTestID} />
          <Text style={styles.headline}>
            {title}
            <Text style={styles.highlight}>{highlight}</Text>
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  back: { alignSelf: 'flex-start', marginLeft: -6 },
  headline: { marginTop: 26, fontSize: 40, lineHeight: 46, fontWeight: '700', color: OnboardingColors.text },
  highlight: { color: OnboardingColors.accent },
  subtitle: { marginTop: 10, marginBottom: 32, fontSize: 16, lineHeight: 23, color: OnboardingColors.textMuted },
});
