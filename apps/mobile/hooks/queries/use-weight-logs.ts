import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@workout-app/shared";

import { useAuth } from "@/contexts/auth-context";
import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

// Oldest-first, so the list can be charted directly and its last entry is
// always the current weight.
export function useWeightLogs() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.weightLogs.list(userId ?? ""),
    queryFn: async () =>
      unwrap<Tables<"weight_logs">[]>(
        await supabase
          .from("weight_logs")
          .select("*")
          .eq("user_id", userId!)
          .order("logged_at", { ascending: true })
      ),
    enabled: !!userId,
  });
}

export function useLogWeight() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weightKg: number) =>
      unwrap<Tables<"weight_logs">>(
        await supabase
          .from("weight_logs")
          .insert({ user_id: userId!, weight_kg: weightKg })
          .select()
          .single()
      ),
    onSuccess: async (_log, weightKg) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weightLogs.list(userId ?? "") });

      // A target can exist with no goal baseline yet — it was set before any
      // weight was ever logged (see profile/index.tsx). This first log is
      // then the only sensible baseline, so seed it once; without this, a
      // screen that falls back to "current weight" when the baseline is
      // missing would keep recomputing it from the newest log on every
      // render, permanently reporting 0% progress.
      const profile = queryClient.getQueryData<Tables<"profiles">>(
        queryKeys.profile.detail(userId ?? "")
      );
      if (profile?.target_weight_kg != null && profile.goal_start_weight_kg == null) {
        await supabase
          .from("profiles")
          .update({ goal_start_weight_kg: weightKg })
          .eq("id", userId!);
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(userId ?? "") });
      }
    },
  });
}

// Edits a past entry in place (rather than logging a new one) — used when
// the user taps a specific row in the weight history list.
export function useUpdateWeightLog() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, weight_kg }: { id: string; weight_kg: number }) =>
      unwrap<Tables<"weight_logs">>(
        await supabase.from("weight_logs").update({ weight_kg }).eq("id", id).select().single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weightLogs.list(userId ?? "") });
    },
  });
}
