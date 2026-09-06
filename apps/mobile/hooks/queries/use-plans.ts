import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert, TablesUpdate } from "@workout-app/shared";

import { useOptimisticReorder } from "@/hooks/queries/use-optimistic-reorder";
import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

export function usePlans() {
  return useQuery({
    queryKey: queryKeys.plans.list(),
    queryFn: async () =>
      unwrap<Tables<"workout_plans">[]>(
        await supabase.from("workout_plans").select("*").order("order_index", { ascending: true })
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

// Matches the number of apps/mobile/assets/images/plan-card-background-*.jpg
// files.
const CARD_BACKGROUND_COUNT = 5;

// Random, but avoids any background_image_index already in use by another
// plan when possible — so up to 5 plans never share a card photo, and only
// a 6th+ plan (or the assignment losing a race with a concurrent create)
// falls back to a plain random pick.
async function pickUnusedBackgroundIndex() {
  const { data, error } = await supabase.from("workout_plans").select("background_image_index");
  if (error) throw error;

  const used = new Set(data.map((row) => row.background_image_index));
  const all = Array.from({ length: CARD_BACKGROUND_COUNT }, (_, i) => i + 1);
  const pool = all.filter((index) => !used.has(index));
  const candidates = pool.length > 0 ? pool : all;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Pick<TablesInsert<"workout_plans">, "name" | "description">) => {
      const background_image_index = await pickUnusedBackgroundIndex();
      return unwrap<Tables<"workout_plans">>(
        await supabase
          .from("workout_plans")
          .insert({ ...input, background_image_index })
          .select()
          .single()
      );
    },
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

export function useReorderPlans() {
  return useOptimisticReorder<Tables<"workout_plans">>(queryKeys.plans.list(), async (reordered) => {
    const { error } = await supabase.rpc("reorder_plans", {
      p_plan_ids: reordered.map((plan) => plan.id),
    });
    if (error) throw error;
  });
}
