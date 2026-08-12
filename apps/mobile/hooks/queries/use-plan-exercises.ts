import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert } from "@workout-app/shared";

import { useOptimisticReorder } from "@/hooks/queries/use-optimistic-reorder";
import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";
import type { PlanExerciseWithExercise } from "@/lib/types";

type PlanExerciseInput = Pick<
  TablesInsert<"workout_plan_exercises">,
  "exercise_id" | "target_sets" | "target_reps" | "target_weight_kg" | "rest_seconds" | "notes"
>;

export function usePlanExercises(dayId: string) {
  return useQuery({
    queryKey: queryKeys.planExercises.list(dayId),
    queryFn: async () =>
      unwrap<PlanExerciseWithExercise[]>(
        await supabase
          .from("workout_plan_exercises")
          .select("*, exercise:exercises(*)")
          .eq("plan_day_id", dayId)
          .order("order_index", { ascending: true })
      ),
    enabled: !!dayId,
  });
}

export function usePlanExercise(planExerciseId: string) {
  return useQuery({
    queryKey: queryKeys.planExercises.detail(planExerciseId),
    queryFn: async () =>
      unwrap<PlanExerciseWithExercise>(
        await supabase
          .from("workout_plan_exercises")
          .select("*, exercise:exercises(*)")
          .eq("id", planExerciseId)
          .single()
      ),
    enabled: !!planExerciseId,
  });
}

export function useCreatePlanExercise(dayId: string, planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PlanExerciseInput) =>
      unwrap<Tables<"workout_plan_exercises">>(
        await supabase
          .from("workout_plan_exercises")
          .insert({ ...input, plan_day_id: dayId })
          .select()
          .single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planExercises.list(dayId) });
      // exerciseCount on the day list is derived from this table, so adding
      // a row means that cached list is now stale too.
      queryClient.invalidateQueries({ queryKey: queryKeys.planDays.list(planId) });
    },
  });
}

export function useUpdatePlanExercise(planExerciseId: string, dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: PlanExerciseInput) =>
      unwrap<Tables<"workout_plan_exercises">>(
        await supabase
          .from("workout_plan_exercises")
          .update(input)
          .eq("id", planExerciseId)
          .select()
          .single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planExercises.detail(planExerciseId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.planExercises.list(dayId) });
    },
  });
}

export function useDeletePlanExercise(dayId: string, planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planExerciseId: string) => {
      const { error } = await supabase
        .from("workout_plan_exercises")
        .delete()
        .eq("id", planExerciseId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planExercises.list(dayId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.planDays.list(planId) });
    },
  });
}

export function useReorderPlanExercises(dayId: string) {
  return useOptimisticReorder<PlanExerciseWithExercise>(
    queryKeys.planExercises.list(dayId),
    async (reordered) => {
      const { error } = await supabase.rpc("reorder_plan_exercises", {
        p_plan_day_id: dayId,
        p_exercise_ids: reordered.map((exercise) => exercise.id),
      });
      if (error) throw error;
    }
  );
}
