import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { SingleChoiceModal, type SingleChoiceOption } from '@/components/single-choice-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RulerPickerModal } from '@/components/ruler-picker-modal';
import { WheelPickerModal } from '@/components/wheel-picker-modal';
import { useProfile, useUpdateProfile } from '@/hooks/queries/use-profile';
import { useLogWeight, useWeightLogs } from '@/hooks/queries/use-weight-logs';
import { usePickerModal } from '@/hooks/use-picker-modal';
import { useThemeColor } from '@/hooks/use-theme-color';
import { generateRange } from '@/lib/number-range';
import type { Gender } from '@/lib/types';
import { getCurrentWeight } from '@/lib/weight';

type InfoRow = { label: string; value: string; onPress?: () => void };

// Weight is derived from the latest weight log; every other field here maps
// directly to a `profiles` column (see migrations).
const NOT_SET = 'Not set';

const GENDER_OPTIONS: SingleChoiceOption<Gender>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const AGE_MIN = 13;
const AGE_MAX = 100;
const AGE_DEFAULT = 30;
const AGE_VALUES = generateRange(AGE_MIN, AGE_MAX, 1);

const HEIGHT_MIN = 100;
const HEIGHT_MAX = 230;
const HEIGHT_DEFAULT = 170;
const HEIGHT_VALUES = generateRange(HEIGHT_MIN, HEIGHT_MAX, 1);

const WEIGHT_MIN = 30;
const WEIGHT_MAX = 200;
const WEIGHT_DEFAULT = 70;

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: weightLogs } = useWeightLogs();
  const updateProfile = useUpdateProfile();
  const logWeight = useLogWeight();
  const tint = useThemeColor({}, 'tint');
  const displayName = profile?.username?.trim() || 'Add your name';
  const currentWeight = getCurrentWeight(weightLogs);

  const genderModal = usePickerModal<true>();
  const ageModal = usePickerModal<true>();
  const heightModal = usePickerModal<true>();
  const weightModal = usePickerModal<true>();
  const targetWeightModal = usePickerModal<true>();

  const genderLabel = GENDER_OPTIONS.find((option) => option.value === profile?.gender)?.label ?? NOT_SET;

  const personalInfo: InfoRow[] = [
    { label: 'Gender', value: genderLabel, onPress: () => genderModal.open(true) },
    {
      label: 'Age',
      value: profile?.age != null ? String(profile.age) : NOT_SET,
      onPress: () => ageModal.open(true),
    },
    {
      label: 'Weight',
      value: currentWeight != null ? `${currentWeight} kg` : NOT_SET,
      onPress: () => weightModal.open(true),
    },
    {
      label: 'Height',
      value: profile?.height_cm != null ? `${profile.height_cm} cm` : NOT_SET,
      onPress: () => heightModal.open(true),
    },
  ];
  const weightGoal: InfoRow[] = [
    {
      label: 'Target weight',
      value: profile?.target_weight_kg != null ? `${profile.target_weight_kg} kg` : NOT_SET,
      onPress: () => targetWeightModal.open(true),
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
        key={genderModal.key}
        visible={genderModal.visible}
        title="What is your gender?"
        options={GENDER_OPTIONS}
        value={profile?.gender}
        pending={updateProfile.isPending}
        onClose={genderModal.close}
        onSave={(gender) => updateProfile.mutate({ gender }, { onSuccess: genderModal.close })}
      />

      <WheelPickerModal
        key={ageModal.key}
        visible={ageModal.visible}
        title="What is your age?"
        values={AGE_VALUES}
        value={profile?.age ?? AGE_DEFAULT}
        pending={updateProfile.isPending}
        onClose={ageModal.close}
        onSave={(age) => updateProfile.mutate({ age }, { onSuccess: ageModal.close })}
      />

      <WheelPickerModal
        key={heightModal.key}
        visible={heightModal.visible}
        title="What is your height?"
        values={HEIGHT_VALUES}
        value={profile?.height_cm ?? HEIGHT_DEFAULT}
        suffix="cm"
        pending={updateProfile.isPending}
        onClose={heightModal.close}
        onSave={(height_cm) => updateProfile.mutate({ height_cm }, { onSuccess: heightModal.close })}
      />

      <RulerPickerModal
        key={weightModal.key}
        visible={weightModal.visible}
        title="What is your weight?"
        min={WEIGHT_MIN}
        max={WEIGHT_MAX}
        suffix="kg"
        value={currentWeight ?? WEIGHT_DEFAULT}
        pending={logWeight.isPending}
        onClose={weightModal.close}
        onSave={(weightKg) => logWeight.mutate(weightKg, { onSuccess: weightModal.close })}
      />

      <RulerPickerModal
        key={targetWeightModal.key}
        visible={targetWeightModal.visible}
        title="What is your target weight?"
        min={WEIGHT_MIN}
        max={WEIGHT_MAX}
        suffix="kg"
        value={profile?.target_weight_kg ?? WEIGHT_DEFAULT}
        pending={updateProfile.isPending}
        onClose={targetWeightModal.close}
        onSave={(target_weight_kg) =>
          updateProfile.mutate({ target_weight_kg }, { onSuccess: targetWeightModal.close })
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
