import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Alert } from "react-native";

import { queryKeys } from "@/lib/query-keys";

// Which exercises of a day have been fully logged this session. There's no
// workout-history table yet (see the active-plan migration and the Workout
// tab's "next day" comment), so this rides in the React Query cache instead
// of a real query — the app's existing shared-state mechanism — purely so
// the day's exercise list and the exercise session screen (two different
// routes) see the same completions without a fetch. It never persists past
// the app session.
export function useCompletedExercises(dayId: string) {
  return useQuery({
    queryKey: queryKeys.workoutSession.completedExercises(dayId),
    queryFn: () => [] as string[],
    initialData: [] as string[],
    staleTime: Infinity,
  });
}

// A completed exercise's own totals (its `sets` state disappears once its
// screen unmounts), kept just long enough for the day's "Workout complete"
// summary to add them up across every exercise.
export type ExerciseSessionStats = { totalSets: number; volumeKg: number };

export function useExerciseSessionStats(dayId: string) {
  return useQuery({
    queryKey: queryKeys.workoutSession.exerciseStats(dayId),
    queryFn: () => ({}) as Record<string, ExerciseSessionStats>,
    initialData: {} as Record<string, ExerciseSessionStats>,
    staleTime: Infinity,
  });
}

export function useMarkExerciseCompleted(dayId: string) {
  const queryClient = useQueryClient();

  return (planExerciseId: string, stats: ExerciseSessionStats) => {
    queryClient.setQueryData<string[]>(queryKeys.workoutSession.completedExercises(dayId), (prev = []) =>
      prev.includes(planExerciseId) ? prev : [...prev, planExerciseId]
    );
    queryClient.setQueryData<Record<string, ExerciseSessionStats>>(
      queryKeys.workoutSession.exerciseStats(dayId),
      (prev = {}) => ({ ...prev, [planExerciseId]: stats })
    );
  };
}

export function useToggleExerciseCompleted(dayId: string) {
  const queryClient = useQueryClient();

  return (planExerciseId: string) => {
    queryClient.setQueryData<string[]>(queryKeys.workoutSession.completedExercises(dayId), (prev = []) =>
      prev.includes(planExerciseId) ? prev.filter((id) => id !== planExerciseId) : [...prev, planExerciseId]
    );
  };
}

function clearSessionProgress(queryClient: QueryClient, dayId: string) {
  queryClient.setQueryData(queryKeys.workoutSession.completedExercises(dayId), []);
  queryClient.setQueryData(queryKeys.workoutSession.exerciseStats(dayId), {});
}

// Called once a workout is saved to history — clears this day's session
// progress so reopening it (to train it again) starts from 0/N instead of
// showing everything still checked off from last time.
export function useResetWorkoutSession(dayId: string) {
  const queryClient = useQueryClient();
  return () => clearSessionProgress(queryClient, dayId);
}

// Whether a day has any in-progress (unsaved) session state — used to decide
// between "Start workout" and "Continue workout", and to detect a different
// day being abandoned when the user starts a new one instead.
export function hasSessionProgress(queryClient: QueryClient, dayId: string) {
  const completed = queryClient.getQueryData<string[]>(queryKeys.workoutSession.completedExercises(dayId));
  return (completed?.length ?? 0) > 0;
}

// Starting a different day while one is already in progress would silently
// strand that progress (it's never saved until "Save workout"), so this
// warns and lets the caller clear it before navigating to the new day.
export function confirmStartOverOtherDay(queryClient: QueryClient, otherDayId: string, onConfirm: () => void) {
  Alert.alert(
    'Start a different workout?',
    "Your in-progress workout will be interrupted and its progress won't be saved.",
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start workout',
        style: 'destructive',
        onPress: () => {
          clearSessionProgress(queryClient, otherDayId);
          onConfirm();
        },
      },
    ]
  );
}
