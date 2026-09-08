import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { SingleChoiceModal, type SingleChoiceOption } from '@/components/single-choice-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { RulerPickerModal } from '@/components/ruler-picker-modal';
import { WheelPickerModal } from '@/components/wheel-picker-modal';
import {
  useProfile,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from '@/hooks/queries/use-profile';
import { useLogWeight, useWeightLogs } from '@/hooks/queries/use-weight-logs';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Gender } from '@/lib/types';
import { getCurrentWeight, WEIGHT_DEFAULT, WEIGHT_MAX, WEIGHT_MIN } from '@/lib/weight';

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
const AGE_VALUES = Array.from({ length: AGE_MAX - AGE_MIN + 1 }, (_, i) => AGE_MIN + i);

const HEIGHT_MIN = 100;
const HEIGHT_MAX = 230;
const HEIGHT_DEFAULT = 170;
const HEIGHT_VALUES = Array.from({ length: HEIGHT_MAX - HEIGHT_MIN + 1 }, (_, i) => HEIGHT_MIN + i);

const AVATAR_SOURCES = {
  camera: {
    requestPermission: ImagePicker.requestCameraPermissionsAsync,
    launch: ImagePicker.launchCameraAsync,
    permissionLabel: 'camera',
  },
  library: {
    requestPermission: ImagePicker.requestMediaLibraryPermissionsAsync,
    launch: ImagePicker.launchImageLibraryAsync,
    permissionLabel: 'photos',
  },
} as const;

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: weightLogs } = useWeightLogs();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatar = useRemoveAvatar();
  const logWeight = useLogWeight();
  const tint = useThemeColor({}, 'tint');
  const displayName = profile?.username?.trim() || 'Add your name';
  const currentWeight = getCurrentWeight(weightLogs);

  const [genderModalOpen, setGenderModalOpen] = useState(false);
  const [ageModalOpen, setAgeModalOpen] = useState(false);
  const [heightModalOpen, setHeightModalOpen] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [targetWeightModalOpen, setTargetWeightModalOpen] = useState(false);

  const genderLabel = GENDER_OPTIONS.find((option) => option.value === profile?.gender)?.label ?? NOT_SET;

  const personalInfo: InfoRow[] = [
    { label: 'Gender', value: genderLabel, onPress: () => setGenderModalOpen(true) },
    {
      label: 'Age',
      value: profile?.age != null ? String(profile.age) : NOT_SET,
      onPress: () => setAgeModalOpen(true),
    },
    {
      label: 'Weight',
      value: currentWeight != null ? `${currentWeight} kg` : NOT_SET,
      onPress: () => setWeightModalOpen(true),
    },
    {
      label: 'Height',
      value: profile?.height_cm != null ? `${profile.height_cm} cm` : NOT_SET,
      onPress: () => setHeightModalOpen(true),
    },
  ];
  const weightGoal: InfoRow[] = [
    {
      label: 'Target weight',
      value: profile?.target_weight_kg != null ? `${profile.target_weight_kg} kg` : NOT_SET,
      onPress: () => setTargetWeightModalOpen(true),
    },
  ];

  async function pickAvatar(source: keyof typeof AVATAR_SOURCES) {
    const { requestPermission, launch, permissionLabel } = AVATAR_SOURCES[source];
    const permission = await requestPermission();

    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        `Allow access to your ${permissionLabel} to set a profile picture.`
      );
      return;
    }

    const result = await launch({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    uploadAvatar.mutate(
      { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
      {
        onError: () =>
          Alert.alert('Upload failed', 'Could not update your profile photo. Please try again.'),
      }
    );
  }

  function handleAvatarPress() {
    Alert.alert('Profile Photo', undefined, [
      { text: 'Take Photo', onPress: () => pickAvatar('camera') },
      { text: 'Choose from Library', onPress: () => pickAvatar('library') },
      ...(profile?.avatar_url
        ? [
            {
              text: 'Remove Photo',
              style: 'destructive' as const,
              onPress: () =>
                removeAvatar.mutate(undefined, {
                  onError: () => Alert.alert('Error', 'Could not remove your profile photo.'),
                }),
            },
          ]
        : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar
            uri={profile?.avatar_url}
            uploading={uploadAvatar.isPending || removeAvatar.isPending}
            onPress={handleAvatarPress}
          />
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
        key={genderModalOpen ? 'gender-open' : 'gender-closed'}
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

      <WheelPickerModal
        key={ageModalOpen ? 'age-open' : 'age-closed'}
        visible={ageModalOpen}
        title="What is your age?"
        values={AGE_VALUES}
        value={profile?.age ?? AGE_DEFAULT}
        pending={updateProfile.isPending}
        onClose={() => setAgeModalOpen(false)}
        onSave={(age) =>
          updateProfile.mutate({ age }, { onSuccess: () => setAgeModalOpen(false) })
        }
      />

      <WheelPickerModal
        key={heightModalOpen ? 'height-open' : 'height-closed'}
        visible={heightModalOpen}
        title="What is your height?"
        values={HEIGHT_VALUES}
        value={profile?.height_cm ?? HEIGHT_DEFAULT}
        suffix="cm"
        pending={updateProfile.isPending}
        onClose={() => setHeightModalOpen(false)}
        onSave={(height_cm) =>
          updateProfile.mutate({ height_cm }, { onSuccess: () => setHeightModalOpen(false) })
        }
      />

      <RulerPickerModal
        key={weightModalOpen ? 'weight-open' : 'weight-closed'}
        visible={weightModalOpen}
        title="What is your weight?"
        min={WEIGHT_MIN}
        max={WEIGHT_MAX}
        suffix="kg"
        value={currentWeight ?? WEIGHT_DEFAULT}
        pending={logWeight.isPending}
        onClose={() => setWeightModalOpen(false)}
        onSave={(weightKg) =>
          logWeight.mutate(weightKg, { onSuccess: () => setWeightModalOpen(false) })
        }
      />

      <RulerPickerModal
        key={targetWeightModalOpen ? 'target-weight-open' : 'target-weight-closed'}
        visible={targetWeightModalOpen}
        title="What is your target weight?"
        min={WEIGHT_MIN}
        max={WEIGHT_MAX}
        suffix="kg"
        value={profile?.target_weight_kg ?? WEIGHT_DEFAULT}
        pending={updateProfile.isPending}
        onClose={() => setTargetWeightModalOpen(false)}
        onSave={(target_weight_kg) =>
          updateProfile.mutate(
            { target_weight_kg },
            { onSuccess: () => setTargetWeightModalOpen(false) }
          )
        }
      />
    </ThemedView>
  );
}

function Avatar({
  uri,
  uploading,
  onPress,
}: {
  uri?: string | null;
  uploading: boolean;
  onPress: () => void;
}) {
  const cardElevated = useThemeColor({}, 'cardElevated');
  const iconColor = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');
  const buttonText = useThemeColor({}, 'buttonText');
  const background = useThemeColor({}, 'background');

  return (
    <Pressable
      onPress={onPress}
      disabled={uploading}
      accessibilityRole="button"
      accessibilityLabel={uri ? 'Change profile photo' : 'Add profile photo'}
      style={styles.avatarWrap}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, { backgroundColor: cardElevated }]}>
          <IconSymbol name="person.fill" size={44} color={iconColor} />
        </View>
      )}
      {uploading && (
        <View style={[styles.avatar, styles.avatarOverlay]}>
          <ActivityIndicator color="#fff" />
        </View>
      )}
      <View style={[styles.avatarBadge, { backgroundColor: tint, borderColor: background }]}>
        <IconSymbol name={uri ? 'pencil' : 'plus'} size={13} color={buttonText} />
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
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
