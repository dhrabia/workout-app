import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@workout-app/shared";

import { useOptimisticReorder } from "@/hooks/queries/use-optimistic-reorder";
import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";
import type { PlanDayWithExerciseCount } from "@/lib/types";

export function usePlanDays(planId: string) {
  return useQuery({
    queryKey: queryKeys.planDays.list(planId),
    queryFn: async () => {
      const rows = unwrap<
        (Tables<"workout_plan_days"> & { workout_plan_exercises: { count: number }[] })[]
      >(
        await supabase
          .from("workout_plan_days")
          .select("*, workout_plan_exercises(count)")
          .eq("plan_id", planId)
          .order("order_index", { ascending: true })
      );
      return rows.map(
        ({ workout_plan_exercises, ...day }): PlanDayWithExerciseCount => ({
          ...day,
          exerciseCount: workout_plan_exercises[0]?.count ?? 0,
        })
      );
    },
    enabled: !!planId,
  });
}

export function usePlanDay(dayId: string) {
  return useQuery({
    queryKey: queryKeys.planDays.detail(dayId),
    queryFn: async () =>
      unwrap<Tables<"workout_plan_days">>(
        await supabase.from("workout_plan_days").select("*").eq("id", dayId).single()
      ),
    enabled: !!dayId,
  });
}

export function useCreatePlanDay(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Pick<TablesInsert<"workout_plan_days">, "name">) =>
      unwrap<Tables<"workout_plan_days">>(
        await supabase
          .from("workout_plan_days")
          .insert({ ...input, plan_id: planId })
          .select()
          .single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planDays.list(planId) });
    },
  });
}

export function useUpdatePlanDay(dayId: string, planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Pick<TablesUpdate<"workout_plan_days">, "name">) =>
      unwrap<Tables<"workout_plan_days">>(
        await supabase.from("workout_plan_days").update(input).eq("id", dayId).select().single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planDays.detail(dayId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.planDays.list(planId) });
    },
  });
}

export function useDeletePlanDay(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dayId: string) => {
      const { error } = await supabase.from("workout_plan_days").delete().eq("id", dayId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planDays.list(planId) });
    },
  });
}

export function useReorderPlanDays(planId: string) {
  return useOptimisticReorder<PlanDayWithExerciseCount>(
    queryKeys.planDays.list(planId),
    async (reordered) => {
      const { error } = await supabase.rpc("reorder_plan_days", {
        p_plan_id: planId,
        p_day_ids: reordered.map((day) => day.id),
      });
      if (error) throw error;
    }
  );
}
