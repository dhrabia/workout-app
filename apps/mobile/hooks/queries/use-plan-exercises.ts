import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert } from "@workout-app/shared";

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

export function useCreatePlanExercise(dayId: string) {
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

export function useDeletePlanExercise(dayId: string) {
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
    },
  });
}

export function useReorderPlanExercise(dayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      exerciseIdA,
      exerciseIdB,
    }: {
      exerciseIdA: string;
      exerciseIdB: string;
    }) => {
      const { error } = await supabase.rpc("swap_plan_exercise_order", {
        exercise_id_a: exerciseIdA,
        exercise_id_b: exerciseIdB,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planExercises.list(dayId) });
    },
  });
}
