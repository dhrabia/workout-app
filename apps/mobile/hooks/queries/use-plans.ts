import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@workout-app/shared";

import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans.list(),
    queryFn: async () =>
      unwrap<Tables<"workout_plans">[]>(
        await supabase
          .from("workout_plans")
          .select("*")
          .order("created_at", { ascending: false })
      ),
  });
}

export function usePlan(planId: string) {
  return useQuery({
    queryKey: queryKeys.plans.detail(planId),
    queryFn: async () =>
      unwrap<Tables<"workout_plans">>(
        await supabase.from("workout_plans").select("*").eq("id", planId).single()
      ),
    enabled: !!planId,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Pick<TablesInsert<"workout_plans">, "name" | "description">) =>
      unwrap<Tables<"workout_plans">>(
        await supabase.from("workout_plans").insert(input).select().single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.list() });
    },
  });
}

export function useUpdatePlan(planId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Pick<TablesUpdate<"workout_plans">, "name" | "description">) =>
      unwrap<Tables<"workout_plans">>(
        await supabase.from("workout_plans").update(input).eq("id", planId).select().single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.detail(planId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.list() });
    },
  });
}

export function useDeletePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const { error } = await supabase.from("workout_plans").delete().eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.plans.list() });
    },
  });
}
