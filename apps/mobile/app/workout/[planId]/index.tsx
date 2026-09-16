import { useQueryClient } from '@tanstack/react-query';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { StartWorkoutButton } from '@/components/start-workout-button';
import { ThemedView } from '@/components/themed-view';
import { WorkoutDayCard } from '@/components/workout-day-card';
import { usePlanDays } from '@/hooks/queries/use-plan-days';
import { usePlan } from '@/hooks/queries/use-plans';
import { confirmStartOverOtherDay, hasSessionProgress, useCompletedExercises } from '@/hooks/queries/use-workout-session';

// Reached from the Workout tab's plan list — lets the user pick which day of
// a (not necessarily active) plan to train, then start it. Unlike the Plans
// tab's plan detail screen, days here aren't editable: no reorder, no "…"
// menu, and tapping a card selects it instead of opening it.
export default function StartWorkoutScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: plan } = usePlan(planId);
  const { data: daysData, isLoading } = usePlanDays(planId);
  const days = daysData ?? [];

  const [selectedDayId, setSelectedDayId] = useState<string>();
  // Defaults to the first day (same "nothing completed yet" reasoning as the
  // Workout tab's hero card) until the user taps another one.
  const effectiveDayId = selectedDayId ?? days[0]?.id;

  const { data: completedList } = useCompletedExercises(effectiveDayId ?? '');
  const started = completedList.length > 0;

  function startWorkout() {
    if (!effectiveDayId) return;
    const goToDay = () =>
      router.push({ pathname: '/workout/[planId]/[dayId]', params: { planId, dayId: effectiveDayId } });

    const otherStartedDay = started
      ? undefined
      : days.find((day) => day.id !== effectiveDayId && hasSessionProgress(queryClient, day.id));

    if (otherStartedDay) confirmStartOverOtherDay(queryClient, otherStartedDay.id, goToDay);
    else goToDay();
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: plan?.name ?? 'Workout', headerBackTitle: 'Workout' }} />
      {isLoading ? (
        <LoadingState />
      ) : days.length === 0 ? (
        <EmptyState title="No days yet" description="This plan has no training days yet." />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {days.map((day, index) => (
            <WorkoutDayCard
              key={day.id}
              dayNumber={index + 1}
              workoutDay={day}
              selected={day.id === effectiveDayId}
              showChevron={false}
              onPress={() => setSelectedDayId(day.id)}
              testID={`start-workout-day-${day.id}`}
            />
          ))}
          {effectiveDayId ? (
            <StartWorkoutButton
              label={started ? 'Continue workout' : 'Start workout'}
              onPress={startWorkout}
              testID="start-workout-button"
            />
          ) : null}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, paddingBottom: 100, gap: 14 },
});
