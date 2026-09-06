import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { OutlineButton } from '@/components/outline-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WorkoutDayCard } from '@/components/workout-day-card';
import { usePlan } from '@/hooks/queries/use-plans';
import { usePlanDays, useDeletePlanDay, useReorderPlanDays } from '@/hooks/queries/use-plan-days';
import { useDragContextMenu } from '@/hooks/use-drag-context-menu';
import { useDragPanGesture } from '@/hooks/use-drag-pan-gesture';
import { confirmDestructive } from '@/lib/alerts';
import type { PlanDayWithExerciseCount } from '@/lib/types';

export default function PlanDetailScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();

  const { data: plan } = usePlan(planId);
  const { data: daysData, isLoading } = usePlanDays(planId);
  const days = daysData ?? [];
  const deletePlanDay = useDeletePlanDay(planId);
  const reorderPlanDays = useReorderPlanDays(planId);

  const panGesture = useDragPanGesture();

  function handleDeleteDay(dayId: string) {
    confirmDestructive('Delete day?', 'This removes all its exercises too.', 'Delete', () =>
      deletePlanDay.mutate(dayId)
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: plan?.name ?? 'Plan' }} />
      {plan?.description ? (
        <ThemedText style={styles.description}>{plan.description}</ThemedText>
      ) : null}
      {isLoading ? (
        <LoadingState />
      ) : (
        <ReorderableList
          data={days}
          keyExtractor={(item) => item.id}
          panGesture={panGesture}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState title="No days yet" description="Add a day to start building this plan." />
          }
          onReorder={({ from, to }) => reorderPlanDays.mutate(reorderItems(days, from, to))}
          renderItem={({ item, index }) => (
            <DayCard
              item={item}
              dayNumber={index + 1}
              onPress={() =>
                router.push({
                  pathname: '/plans/[planId]/days/[dayId]',
                  params: { planId, dayId: item.id },
                })
              }
              onEdit={() =>
                router.push({
                  pathname: '/plans/[planId]/days/form',
                  params: { planId, dayId: item.id },
                })
              }
              onDelete={() => handleDeleteDay(item.id)}
            />
          )}
        />
      )}
      <OutlineButton
        label="+ Add Day"
        onPress={() => router.push({ pathname: '/plans/[planId]/days/form', params: { planId } })}
      />
    </ThemedView>
  );
}

function DayCard({
  item,
  dayNumber,
  onPress,
  onEdit,
  onDelete,
}: {
  item: PlanDayWithExerciseCount;
  dayNumber: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { menuButtonRef, onLongPress, onMenuPress } = useDragContextMenu({ onEdit, onDelete });

  return (
    <WorkoutDayCard
      dayNumber={dayNumber}
      workoutDay={item}
      onPress={onPress}
      onLongPress={onLongPress}
      onMenuPress={onMenuPress}
      menuButtonRef={menuButtonRef}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  description: { paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16, gap: 14 },
});
