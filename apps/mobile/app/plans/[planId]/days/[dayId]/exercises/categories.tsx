import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MUSCLE_GROUPS } from '@/lib/types';

export default function ExerciseCategoriesScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const router = useRouter();
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Add Exercise' }} />
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
            style={[styles.tile, { borderColor }]}>
            <ThemedText type="defaultSemiBold" style={styles.tileText}>
              {group.replace('_', ' ')}
            </ThemedText>
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
    gap: 12,
    padding: 16,
  },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    aspectRatio: 1.4,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    textTransform: 'capitalize',
  },
});
