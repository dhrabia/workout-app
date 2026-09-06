import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert } from "@workout-app/shared";

import { useAuth } from "@/contexts/auth-context";
import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

// One row per user, created lazily on first save — `maybeSingle` (not
// `single`) because a brand new user has no row yet.
export function useBodyMeasurements() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.bodyMeasurements.detail(userId ?? ""),
    queryFn: async () =>
      unwrap<Tables<"body_measurements"> | null>(
        await supabase.from("body_measurements").select("*").eq("user_id", userId!).maybeSingle()
      ),
    enabled: !!userId,
  });
}

export function useUpdateBodyMeasurements() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Omit<TablesInsert<"body_measurements">, "user_id" | "updated_at">
    ) =>
      unwrap<Tables<"body_measurements">>(
        await supabase
          .from("body_measurements")
          .upsert({ ...input, user_id: userId! })
          .select()
          .single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyMeasurements.detail(userId ?? "") });
    },
  });
}
