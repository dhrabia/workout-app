import { Stack, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useProfile } from '@/hooks/queries/use-profile';
import { useThemeColor } from '@/hooks/use-theme-color';

type InfoRow = { label: string; value: string };

// `profiles` only has a `username` column today (see
// supabase/migrations/20260810134542_initial_schema.sql) — gender, age,
// weight, height and target weight aren't backed by any table yet. Rendered
// as unset so the layout and interaction are in place without inventing
// fake persisted data.
const PERSONAL_INFO: InfoRow[] = [
  { label: 'Gender', value: 'Not set' },
  { label: 'Age', value: 'Not set' },
  { label: 'Weight', value: 'Not set' },
  { label: 'Height', value: 'Not set' },
];

const WEIGHT_GOAL: InfoRow[] = [{ label: 'Target weight', value: 'Not set' }];

export default function ProfileScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const tint = useThemeColor({}, 'tint');
  const displayName = profile?.username?.trim() || 'Add your name';

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

        <Section title="Personal information" rows={PERSONAL_INFO} />
        <Section title="Weight goal" rows={WEIGHT_GOAL} />
      </ScrollView>
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
  const labelColor = useThemeColor({}, 'icon');

  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionLabel, { color: labelColor }]}>{title}</ThemedText>
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
        <View
          key={row.label}
          style={[
            styles.row,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor },
          ]}>
          <ThemedText>{row.label}</ThemedText>
          <ThemedText style={{ color: secondaryColor }}>{row.value}</ThemedText>
        </View>
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
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  card: { borderRadius: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
