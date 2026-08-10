import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesInsert } from "@workout-app/shared";

import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

export function useExerciseCatalog() {
  return useQuery({
    queryKey: queryKeys.exercises.all,
    queryFn: async () =>
      unwrap<Tables<"exercises">[]>(await supabase.from("exercises").select("*").order("name")),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      input: Pick<TablesInsert<"exercises">, "name" | "muscle_group" | "equipment">
    ) =>
      unwrap<Tables<"exercises">>(
        await supabase.from("exercises").insert(input).select().single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.all });
    },
  });
}
