import { useQuery, useQueryClient } from "@tanstack/react-query";

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
