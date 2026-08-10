import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ReorderButtons } from '@/components/reorder-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePlanDay, useDeletePlanDay } from '@/hooks/queries/use-plan-days';
import {
  usePlanExercises,
  useDeletePlanExercise,
  useReorderPlanExercise,
} from '@/hooks/queries/use-plan-exercises';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirmDestructive } from '@/lib/alerts';

export default function DayDetailScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const router = useRouter();

  const { data: day } = usePlanDay(dayId);
  const { data: exercisesData, isLoading } = usePlanExercises(dayId);
  const exercises = exercisesData ?? [];
  const deletePlanDay = useDeletePlanDay(planId);
  const deletePlanExercise = useDeletePlanExercise(dayId);
  const reorderPlanExercise = useReorderPlanExercise(dayId);

  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'icon');

  function handleDeleteDay() {
    confirmDestructive('Delete day?', 'This removes all its exercises too.', 'Delete', () =>
      deletePlanDay.mutate(dayId, { onSuccess: () => router.back() })
    );
  }

  function handleDeleteExercise(planExerciseId: string) {
    confirmDestructive('Remove exercise?', undefined, 'Remove', () =>
      deletePlanExercise.mutate(planExerciseId)
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: day?.name ?? 'Day',
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/plans/[planId]/days/form', params: { planId, dayId } })
                }
                hitSlop={8}>
                <IconSymbol name="pencil" size={22} color={tint} />
              </Pressable>
              <Pressable onPress={handleDeleteDay} hitSlop={8}>
                <IconSymbol name="trash" size={22} color={tint} />
              </Pressable>
            </View>
          ),
        }}
      />
      {isLoading ? (
        <ThemedText style={styles.centerText}>Loading…</ThemedText>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText type="subtitle">No exercises yet</ThemedText>
              <ThemedText>Add an exercise to this day.</ThemedText>
            </ThemedView>
          }
          renderItem={({ item, index }) => (
            <View style={[styles.row, { borderColor }]}>
              <ReorderButtons
                disableUp={index === 0}
                disableDown={index === exercises.length - 1}
                onMoveUp={() =>
                  reorderPlanExercise.mutate({
                    exerciseIdA: item.id,
                    exerciseIdB: exercises[index - 1].id,
                  })
                }
                onMoveDown={() =>
                  reorderPlanExercise.mutate({
                    exerciseIdA: item.id,
                    exerciseIdB: exercises[index + 1].id,
                  })
                }
              />
              <Pressable
                style={styles.rowContent}
                onPress={() =>
                  router.push({
                    pathname: '/plans/[planId]/days/[dayId]/exercises/form',
                    params: { planId, dayId, planExerciseId: item.id },
                  })
                }>
                <ThemedText type="defaultSemiBold">{item.exercise.name}</ThemedText>
                <ThemedText>
                  {item.target_sets} × {item.target_reps}
                  {item.target_weight_kg ? ` @ ${item.target_weight_kg}kg` : ''}
                  {item.rest_seconds ? ` · ${item.rest_seconds}s rest` : ''}
                </ThemedText>
              </Pressable>
              <Pressable onPress={() => handleDeleteExercise(item.id)} hitSlop={8}>
                <IconSymbol name="trash" size={20} color={borderColor} />
              </Pressable>
            </View>
          )}
        />
      )}
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/plans/[planId]/days/[dayId]/exercises/picker',
            params: { planId, dayId },
          })
        }
        style={[styles.addButton, { borderColor: tint }]}>
        <ThemedText style={{ color: tint }}>+ Add Exercise</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: 16 },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  rowContent: { flex: 1, gap: 2 },
  empty: { padding: 32, alignItems: 'center', gap: 8 },
  centerText: { textAlign: 'center', marginTop: 32 },
  addButton: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
});
