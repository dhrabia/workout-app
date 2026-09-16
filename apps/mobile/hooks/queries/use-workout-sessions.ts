import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert } from "@workout-app/shared";

import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

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
>;

export function useSaveWorkoutSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SaveWorkoutSessionInput) =>
      unwrap<Tables<"workout_sessions">>(
        await supabase.from("workout_sessions").insert(input).select().single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workoutSessions.all });
    },
  });
}
