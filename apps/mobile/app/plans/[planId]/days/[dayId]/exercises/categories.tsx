import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { HeaderIconButton } from '@/components/header-icon-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DAY_CARD_PHOTOS } from '@/lib/day-card-photos';
import { formatMuscleGroup } from '@/lib/muscle-icons';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/lib/types';

export default function ExerciseCategoriesScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const router = useRouter();
  const tint = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Select muscle group',
          headerLeft: () => (
            <HeaderIconButton name="xmark" size={22} color={tint} onPress={() => router.back()} />
          ),
        }}
      />
      <View style={styles.grid}>
        {MUSCLE_GROUPS.map((group) => (
          <MuscleGroupTile
            key={group}
            group={group}
            tint={tint}
            onPress={() =>
              router.push({
                pathname: '/plans/[planId]/days/[dayId]/exercises/picker',
                params: { planId, dayId, muscleGroup: group },
              })
            }
          />
        ))}
      </View>
    </ThemedView>
  );
}

// Same hero photography as the Days screen's workout day cards (see
// day-card-photos.ts), so a muscle group looks the same wherever it appears.
function MuscleGroupTile({
  group,
  tint,
  onPress,
}: {
  group: MuscleGroup;
  tint: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <Image source={DAY_CARD_PHOTOS[group]} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.gradient} />
      <View style={styles.label}>
        <View style={[styles.labelDash, { backgroundColor: tint }]} />
        <ThemedText style={styles.labelText}>{formatMuscleGroup(group).toUpperCase()}</ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    padding: 16,
  },
  tile: {
    flexBasis: '48%',
    flexGrow: 1,
    // Fixed rather than aspectRatio-derived so the tile stays reliably
    // landscape (wider than tall) regardless of the two-column width.
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '65%',
  },
  label: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelDash: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  labelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
