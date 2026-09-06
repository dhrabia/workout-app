import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { SingleChoiceModal, type SingleChoiceOption } from '@/components/single-choice-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useProfile, useUpdateProfile } from '@/hooks/queries/use-profile';
import { useWeightLogs } from '@/hooks/queries/use-weight-logs';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Gender } from '@/lib/types';
import { getCurrentWeight } from '@/lib/weight';

type InfoRow = { label: string; value: string; onPress?: () => void };

// Age isn't backed by any column yet (see
// supabase/migrations/20260810134542_initial_schema.sql) — rendered as
// unset so the layout is in place without inventing fake persisted data.
// Gender, weight (latest weight log), height and target weight are real.
const NOT_SET = 'Not set';

const GENDER_OPTIONS: SingleChoiceOption<Gender>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: weightLogs } = useWeightLogs();
  const updateProfile = useUpdateProfile();
  const tint = useThemeColor({}, 'tint');
  const displayName = profile?.username?.trim() || 'Add your name';
  const currentWeight = getCurrentWeight(weightLogs);

  const [genderModalOpen, setGenderModalOpen] = useState(false);

  const genderLabel = GENDER_OPTIONS.find((option) => option.value === profile?.gender)?.label ?? NOT_SET;

  const personalInfo: InfoRow[] = [
    { label: 'Gender', value: genderLabel, onPress: () => setGenderModalOpen(true) },
    { label: 'Age', value: NOT_SET },
    { label: 'Weight', value: currentWeight != null ? `${currentWeight} kg` : NOT_SET },
    { label: 'Height', value: profile?.height_cm != null ? `${profile.height_cm} cm` : NOT_SET },
  ];
  const weightGoal: InfoRow[] = [
    {
      label: 'Target weight',
      value: profile?.target_weight_kg != null ? `${profile.target_weight_kg} kg` : NOT_SET,
    },
  ];

  function handleAvatarPress() {
    Alert.alert('Coming soon', "Profile photos aren't available yet.");
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar onPress={handleAvatarPress} />
          <ThemedText type="defaultSemiBold" style={styles.name}>
            {displayName}
          </ThemedText>
          <Pressable
            onPress={() => router.push('/profile/edit')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            style={styles.editAction}>
            <IconSymbol name="pencil" size={13} color={tint} />
            <ThemedText style={[styles.editText, { color: tint }]}>Edit profile</ThemedText>
          </Pressable>
        </View>

        <Section title="Personal information" rows={personalInfo} />
        <Section title="Weight goal" rows={weightGoal} />
      </ScrollView>

      <SingleChoiceModal
        key={genderModalOpen ? 'open' : 'closed'}
        visible={genderModalOpen}
        title="What is your gender?"
        options={GENDER_OPTIONS}
        value={profile?.gender}
        pending={updateProfile.isPending}
        onClose={() => setGenderModalOpen(false)}
        onSave={(gender) =>
          updateProfile.mutate({ gender }, { onSuccess: () => setGenderModalOpen(false) })
        }
      />
    </ThemedView>
  );
}

function Avatar({ onPress }: { onPress: () => void }) {
  const cardElevated = useThemeColor({}, 'cardElevated');
  const iconColor = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');
  const buttonText = useThemeColor({}, 'buttonText');
  const background = useThemeColor({}, 'background');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add profile photo"
      style={styles.avatarWrap}>
      <View style={[styles.avatar, { backgroundColor: cardElevated }]}>
        <IconSymbol name="person.fill" size={44} color={iconColor} />
      </View>
      <View style={[styles.avatarBadge, { backgroundColor: tint, borderColor: background }]}>
        <IconSymbol name="plus" size={13} color={buttonText} />
      </View>
    </Pressable>
  );
}

function Section({ title, rows }: { title: string; rows: InfoRow[] }) {
  return (
    <View style={styles.section}>
      <SectionLabel>{title}</SectionLabel>
      <InfoCard rows={rows} />
    </View>
  );
}

function InfoCard({ rows }: { rows: InfoRow[] }) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const secondaryColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      {rows.map((row, index) => (
        <Pressable
          key={row.label}
          onPress={row.onPress}
          disabled={!row.onPress}
          accessibilityRole={row.onPress ? 'button' : undefined}
          style={[
            styles.row,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor },
          ]}>
          <ThemedText>{row.label}</ThemedText>
          <View style={styles.rowValue}>
            <ThemedText style={{ color: secondaryColor }}>{row.value}</ThemedText>
            {row.onPress && <IconSymbol name="chevron.right" size={16} color={secondaryColor} />}
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 28 },
  header: { alignItems: 'center' },
  avatarWrap: { alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontSize: 22, lineHeight: 28, marginTop: 12 },
  editAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, padding: 4 },
  editText: { fontSize: 15, fontWeight: '600' },
  section: { gap: 8 },
  card: { borderRadius: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowValue: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
