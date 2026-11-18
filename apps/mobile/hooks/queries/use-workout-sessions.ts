import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert } from "@workout-app/shared";

import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";
import { parseLoggedSets, type SavedWorkoutExercise, type WorkoutSummaryExercise } from "@/lib/workout-summary";

export const WORKOUT_HISTORY_FILTERS = ["all", "week", "month"] as const;
export type WorkoutHistoryFilter = (typeof WORKOUT_HISTORY_FILTERS)[number];

function filterSince(filter: WorkoutHistoryFilter): string | undefined {
  if (filter === "all") return undefined;
  const since = new Date();
  since.setDate(since.getDate() - (filter === "week" ? 7 : 30));
  return since.toISOString();
}

// Always fetches the full history under one cache entry and slices it
// client-side by filter — a user's own workout history is small enough that
// re-querying Supabase per filter (week/month are strict subsets of "all")
// would just be a redundant round trip every time the filter picker changes.
export function useWorkoutSessions(filter: WorkoutHistoryFilter) {
  const query = useQuery({
    queryKey: queryKeys.workoutSessions.list(),
    queryFn: async () =>
      unwrap<Tables<"workout_sessions">[]>(
        await supabase.from("workout_sessions").select("*").order("completed_at", { ascending: false })
      ),
  });

  const since = filterSince(filter);
  const data = since ? query.data?.filter((session) => session.completed_at >= since) : query.data;

  return { ...query, data };
}

type SaveWorkoutSessionInput = Pick<
  TablesInsert<"workout_sessions">,
  | "plan_id"
  | "plan_day_id"
  | "plan_name"
  | "day_name"
  | "exercise_count"
  | "duration_minutes"
  | "total_sets"
  | "total_volume_kg"
  | "calories_estimate"
> & { exercises: SavedWorkoutExercise[] };

// Goes through the save_workout_session RPC rather than two inserts, so the
// summary row and its per-exercise sets land in one transaction — a failure
// halfway can't leave a history entry whose Workout Summary has no details.
export function useSaveWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ exercises, ...session }: SaveWorkoutSessionInput) =>
      unwrap<Tables<"workout_sessions">>(
        await supabase.rpc("save_workout_session", { p_session: session, p_exercises: exercises })
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessions.all });
    },
  });
}

export type WorkoutSessionDetail = Tables<"workout_sessions"> & { exercises: WorkoutSummaryExercise[] };

type WorkoutSessionDetailRow = Tables<"workout_sessions"> & {
  workout_session_exercises: (Tables<"workout_session_exercises"> & {
    exercise: Pick<Tables<"exercises">, "name_en" | "muscle_group"> | null;
  })[];
};

// One completed workout with its exercises and logged sets, for the Workout
// Summary screen. Name and muscle group come from the exercise catalog via
// the stable exercise_id, falling back to the values snapshotted at save time
// if that exercise has since been deleted. Sessions saved before per-exercise
// details were recorded come back with an empty exercises list.
export function useWorkoutSessionDetail(sessionId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.workoutSessions.detail(sessionId),
    enabled: !!sessionId,
    queryFn: async (): Promise<WorkoutSessionDetail> => {
      const row = unwrap<WorkoutSessionDetailRow>(
        await supabase
          .from("workout_sessions")
          .select("*, workout_session_exercises(*, exercise:exercises(name_en, muscle_group))")
          .eq("id", sessionId)
          .order("order_index", { referencedTable: "workout_session_exercises", ascending: true })
          .single()
      );
      const { workout_session_exercises: exerciseRows, ...session } = row;
      return {
        ...session,
        exercises: exerciseRows.map((exercise) => ({
          id: exercise.id,
          exerciseId: exercise.exercise_id,
          name: exercise.exercise?.name_en ?? exercise.exercise_name,
          muscleGroup: exercise.exercise?.muscle_group ?? exercise.muscle_group,
          sets: parseLoggedSets(exercise.sets),
        })),
      };
    },
    // The history list already holds this session's summary row — show its
    // overview straight away while the exercise details load.
    placeholderData: () => {
      const session = queryClient
        .getQueryData<Tables<"workout_sessions">[]>(queryKeys.workoutSessions.list())
        ?.find((entry) => entry.id === sessionId);
      return session ? { ...session, exercises: [] } : undefined;
    },
  });
}
