import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/components/onboarding/onboarding-button';
import { OnboardingErrorText } from '@/components/onboarding/onboarding-error-text';
import { OnboardingColors } from '@/constants/theme';
import { useProfileSetup } from '@/contexts/profile-setup-context';
import { useCompleteOnboarding, useProfile } from '@/hooks/queries/use-profile';
import { useWeightLogs } from '@/hooks/queries/use-weight-logs';
import { GENDER_LABELS } from '@/lib/profile-fields';
import { formatWeight, getCurrentWeight } from '@/lib/weight';

type SummaryRow = { key: string; icon: ComponentProps<typeof Ionicons>['name']; label: string; value: string };

const COMPLETE_ERROR = 'Something went wrong. Check your connection and try again.';

export default function AllSetScreen() {
  const insets = useSafeAreaInsets();
  // Shows what was actually saved, not the local draft.
  const { data: profile } = useProfile();
  const { data: weightLogs } = useWeightLogs();
  const { draft } = useProfileSetup();
  // Success needs no handling here: the flag flips the root navigator's
  // guards, which swaps onboarding out and lands the user in the app.
  const completeOnboarding = useCompleteOnboarding();

  const currentWeight = getCurrentWeight(weightLogs);

  // Reached without answering everything (e.g. a deep link, or a relaunch
  // that restored this screen): finishing now would leave the profile empty.
  const answered =
    profile != null &&
    profile.gender != null &&
    profile.height_cm != null &&
    profile.target_weight_kg != null &&
    profile.goal_start_weight_kg != null;
  if (profile && !answered) return <Redirect href="/setup/gender" />;

  const rows: SummaryRow[] = [
    { key: 'gender', icon: 'person-outline', label: 'Gender', value: profile?.gender ? GENDER_LABELS[profile.gender] : '—' },
    { key: 'age', icon: 'calendar-outline', label: 'Age', value: draft.age != null ? `${draft.age} years` : '—' },
    {
      key: 'height',
      icon: 'swap-vertical-outline',
      label: 'Height',
      value: profile?.height_cm != null ? `${profile.height_cm} cm` : '—',
    },
    {
      key: 'weight',
      icon: 'scale-outline',
      label: 'Current weight',
      value: profile?.target_weight_kg != null ? `${formatWeight(profile.target_weight_kg)} kg` : '—',
    },
    {
      key: 'target-weight',
      icon: 'locate-outline',
      label: 'Target weight',
      value: currentWeight != null ? `${formatWeight(currentWeight)} kg` : '—',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        bounces={false}>
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={56} color={OnboardingColors.accent} />
        </View>

        <Text style={styles.headline} accessibilityRole="header" testID="setup-all-set-title">
          You’re <Text style={styles.highlight}>all set!</Text>
        </Text>
        <Text style={styles.subtitle}>Your profile is ready. Let’s start your fitness journey.</Text>

        <View style={styles.card} testID="setup-all-set-summary">
          <Text style={styles.cardTitle}>Your profile</Text>
          {rows.map((row, index) => (
            <View key={row.key} style={styles.row}>
              <View style={styles.iconTile}>
                <Ionicons name={row.icon} size={22} color={OnboardingColors.secondaryButtonText} />
              </View>
              <View style={[styles.rowContent, index < rows.length - 1 && styles.rowDivider]}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue} testID={`setup-all-set-${row.key}`}>
                  {row.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <OnboardingErrorText
          message={completeOnboarding.isError ? COMPLETE_ERROR : undefined}
          testID="setup-all-set-error-message"
        />

        <View style={styles.footer}>
          <OnboardingButton
            label="Let’s get started"
            chevron
            loading={completeOnboarding.isPending}
            onPress={() => completeOnboarding.mutate()}
            testID="setup-all-set-start-button"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const BADGE_SIZE = 108;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  badge: {
    alignSelf: 'center',
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    borderWidth: 3,
    borderColor: OnboardingColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: OnboardingColors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  headline: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    color: OnboardingColors.text,
  },
  highlight: { color: OnboardingColors.accent },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 25,
    color: OnboardingColors.textMuted,
  },
  card: {
    marginTop: 32,
    padding: 20,
    paddingBottom: 8,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: OnboardingColors.secondaryButtonBorder,
    backgroundColor: OnboardingColors.secondaryButton,
  },
  cardTitle: { marginBottom: 8, fontSize: 19, fontWeight: '700', color: OnboardingColors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: OnboardingColors.iconTile,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: OnboardingColors.divider },
  rowLabel: { fontSize: 16, color: OnboardingColors.textMuted },
  rowValue: { fontSize: 16, fontWeight: '600', color: OnboardingColors.text },
  footer: { marginTop: 'auto', paddingTop: 32 },
});
