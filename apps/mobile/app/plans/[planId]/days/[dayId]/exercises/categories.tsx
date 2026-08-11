import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/lib/types';

const TILE_IMAGES: Record<MuscleGroup, ImageSourcePropType> = {
  chest: require('@/assets/images/muscle-groups/chest.png'),
  back: require('@/assets/images/muscle-groups/back.png'),
  shoulders: require('@/assets/images/muscle-groups/shoulders.png'),
  triceps: require('@/assets/images/muscle-groups/triceps.png'),
  biceps: require('@/assets/images/muscle-groups/biceps.png'),
  legs: require('@/assets/images/muscle-groups/legs.png'),
  core: require('@/assets/images/muscle-groups/core.png'),
  full_body: require('@/assets/images/muscle-groups/full_body.png'),
  cardio: require('@/assets/images/muscle-groups/cardio.png'),
};

export default function ExerciseCategoriesScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Select muscle group' }} />
      <View style={styles.grid}>
        {MUSCLE_GROUPS.map((group) => (
          <Pressable
            key={group}
            onPress={() =>
              router.push({
                pathname: '/plans/[planId]/days/[dayId]/exercises/picker',
                params: { planId, dayId, muscleGroup: group },
              })
            }
            style={styles.tile}>
            <Image source={TILE_IMAGES[group]} style={styles.tileImage} resizeMode="cover" />
          </Pressable>
        ))}
      </View>
    </ThemedView>
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
    flexBasis: '30%',
    flexGrow: 1,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
});
