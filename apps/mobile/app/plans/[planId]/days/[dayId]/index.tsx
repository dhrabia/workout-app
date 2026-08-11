import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import ReorderableList, {
  reorderItems,
  useIsActive,
  useReorderableDrag,
} from 'react-native-reorderable-list';

import { HeaderActions, HeaderIconButton } from '@/components/header-icon-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePlanDay, useDeletePlanDay } from '@/hooks/queries/use-plan-days';
import {
  usePlanExercises,
  useDeletePlanExercise,
  useReorderPlanExercises,
} from '@/hooks/queries/use-plan-exercises';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirmDestructive } from '@/lib/alerts';
import type { PlanExerciseWithExercise } from '@/lib/types';

export default function DayDetailScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const router = useRouter();

  const { data: day } = usePlanDay(dayId);
  const { data: exercisesData, isLoading } = usePlanExercises(dayId);
  const exercises = exercisesData ?? [];
  const deletePlanDay = useDeletePlanDay(planId);
  const deletePlanExercise = useDeletePlanExercise(dayId);
  const reorderPlanExercises = useReorderPlanExercises(dayId);

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
            <HeaderActions>
              <HeaderIconButton
                name="pencil"
                size={22}
                color={tint}
                onPress={() =>
                  router.push({ pathname: '/plans/[planId]/days/form', params: { planId, dayId } })
                }
              />
              <HeaderIconButton name="trash" size={22} color={tint} onPress={handleDeleteDay} />
            </HeaderActions>
          ),
        }}
      />
      {isLoading ? (
        <ThemedText style={styles.centerText}>Loading…</ThemedText>
      ) : (
        <ReorderableList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: borderColor }]} />
          )}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText type="subtitle">No exercises yet</ThemedText>
              <ThemedText>Add an exercise to this day.</ThemedText>
            </ThemedView>
          }
          onReorder={({ from, to }) =>
            reorderPlanExercises.mutate(reorderItems(exercises, from, to))
          }
          renderItem={({ item }) => (
            <ExerciseRow
              item={item}
              onEdit={() =>
                router.push({
                  pathname: '/plans/[planId]/days/[dayId]/exercises/form',
                  params: { planId, dayId, planExerciseId: item.id },
                })
              }
              onDelete={() => handleDeleteExercise(item.id)}
            />
          )}
        />
      )}
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/plans/[planId]/days/[dayId]/exercises/categories',
            params: { planId, dayId },
          })
        }
        style={[styles.addButton, { borderColor: tint }]}>
        <ThemedText style={{ color: tint }}>+ Add Exercise</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function ExerciseRow({
  item,
  onEdit,
  onDelete,
}: {
  item: PlanExerciseWithExercise;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const drag = useReorderableDrag();
  const isDragging = useIsActive();

  return (
    <Swipeable
      enabled={!isDragging}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable onPress={onDelete} style={styles.deleteAction}>
          <ThemedText style={styles.deleteActionText}>Delete</ThemedText>
        </Pressable>
      )}>
      <Pressable style={styles.row} onPress={onEdit} onLongPress={drag}>
        <ThemedText type="defaultSemiBold">{item.exercise.name}</ThemedText>
        <ThemedText>
          {item.target_sets} × {item.target_reps}
          {item.target_weight_kg ? ` @ ${item.target_weight_kg}kg` : ''}
          {item.rest_seconds ? ` · ${item.rest_seconds}s rest` : ''}
        </ThemedText>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingVertical: 8 },
  separator: { height: StyleSheet.hairlineWidth },
  row: { paddingVertical: 16, gap: 2 },
  deleteAction: {
    backgroundColor: '#e53935',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  deleteActionText: { color: '#fff', fontWeight: '600' },
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
