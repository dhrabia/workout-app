import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@workout-app/shared";

import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

export function usePlanDays(planId: string) {
  return useQuery({
    queryKey: queryKeys.planDays.list(planId),
    queryFn: async () =>
      unwrap<Tables<"workout_plan_days">[]>(
        await supabase
          .from("workout_plan_days")
          .select("*")
          .eq("plan_id", planId)
          .order("order_index", { ascending: true })
      ),
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

export function useReorderPlanDay(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dayIdA, dayIdB }: { dayIdA: string; dayIdB: string }) => {
      const { error } = await supabase.rpc("swap_plan_day_order", {
        day_id_a: dayIdA,
        day_id_b: dayIdB,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.planDays.list(planId) });
    },
  });
}
