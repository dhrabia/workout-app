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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.weightLogs.list(userId ?? "") });
    },
  });
}
