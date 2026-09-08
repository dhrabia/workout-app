import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import ReorderableList, { reorderItems, useReorderableDrag } from 'react-native-reorderable-list';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { OutlineButton } from '@/components/outline-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePlanDay } from '@/hooks/queries/use-plan-days';
import { usePlanExercises, useReorderPlanExercises } from '@/hooks/queries/use-plan-exercises';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MUSCLE_ICONS } from '@/lib/muscle-icons';
import type { PlanExerciseWithExercise } from '@/lib/types';

export default function DayDetailScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const router = useRouter();

  const { data: day } = usePlanDay(dayId);
  const { data: exercisesData, isLoading } = usePlanExercises(dayId);
  const exercises = exercisesData ?? [];
  const reorderPlanExercises = useReorderPlanExercises(dayId);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: day?.name ?? 'Day' }} />
      {isLoading ? (
        <LoadingState />
      ) : (
        <ReorderableList
          data={exercises}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <EmptyState title="No exercises yet" description="Add an exercise to this day." />
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
            />
          )}
        />
      )}
      <OutlineButton
        icon="plus"
        label="Add Exercise"
        onPress={() =>
          router.push({
            pathname: '/plans/[planId]/days/[dayId]/exercises/categories',
            params: { planId, dayId },
          })
        }
        variant="primary"
      />
    </ThemedView>
  );
}

function ExerciseRow({
  item,
  onEdit,
}: {
  item: PlanExerciseWithExercise;
  onEdit: () => void;
}) {
  const drag = useReorderableDrag();
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const iconBackground = useThemeColor({}, 'cardElevated');
  const secondaryColor = useThemeColor({}, 'icon');

  return (
    <Pressable
      style={[styles.card, { backgroundColor: cardBackground, borderColor }]}
      onPress={onEdit}
      onLongPress={drag}>
      <View style={[styles.iconBox, { backgroundColor: iconBackground }]}>
        <Image
          source={MUSCLE_ICONS[item.exercise.muscle_group]}
          style={styles.icon}
          resizeMode="contain"
        />
      </View>
      <View style={styles.rowContent}>
        <ThemedText type="defaultSemiBold" style={styles.name}>
          {item.exercise.name}
        </ThemedText>
        <ThemedText style={[styles.meta, { color: secondaryColor }]}>
          {item.target_sets} × {item.target_reps}
          {item.target_weight_kg ? ` @ ${item.target_weight_kg}kg` : ''}
          {item.rest_seconds ? ` · ${item.rest_seconds}s rest` : ''}
        </ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={18} color={secondaryColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { paddingHorizontal: 16, paddingVertical: 8 },
  separator: { height: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  iconBox: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 34, height: 34 },
  rowContent: { flex: 1, gap: 4 },
  name: { fontSize: 18, lineHeight: 23 },
  meta: { fontSize: 15, lineHeight: 20 },
});
