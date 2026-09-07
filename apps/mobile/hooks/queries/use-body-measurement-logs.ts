import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables } from "@workout-app/shared";

import { useAuth } from "@/contexts/auth-context";
import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

// Oldest-first, like useWeightLogs — the current value for a measurement
// type is simply the last log of that type, and a type's full history can
// be filtered straight out of this list for its chart.
export function useBodyMeasurementLogs() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.bodyMeasurementLogs.list(userId ?? ""),
    queryFn: async () =>
      unwrap<Tables<"body_measurement_logs">[]>(
        await supabase
          .from("body_measurement_logs")
          .select("*")
          .eq("user_id", userId!)
          .order("logged_at", { ascending: true })
      ),
    enabled: !!userId,
  });
}

export function useLogBodyMeasurement() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { measurement_type: Tables<"body_measurement_logs">["measurement_type"]; value_cm: number }) =>
      unwrap<Tables<"body_measurement_logs">>(
        await supabase
          .from("body_measurement_logs")
          .insert({ user_id: userId!, ...input })
          .select()
          .single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyMeasurementLogs.list(userId ?? "") });
    },
  });
}

// Edits a past entry in place (rather than logging a new one) — used when
// the user taps a specific row in the measurement history list.
export function useUpdateBodyMeasurementLog() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value_cm }: { id: string; value_cm: number }) =>
      unwrap<Tables<"body_measurement_logs">>(
        await supabase.from("body_measurement_logs").update({ value_cm }).eq("id", id).select().single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bodyMeasurementLogs.list(userId ?? "") });
    },
  });
}
