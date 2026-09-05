import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesUpdate } from "@workout-app/shared";

import { useAuth } from "@/contexts/auth-context";
import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import { supabase } from "@/lib/supabase";

export function useProfile() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: queryKeys.profile.detail(userId ?? ""),
    queryFn: async () =>
      unwrap<Tables<"profiles">>(
        await supabase.from("profiles").select("*").eq("id", userId!).single()
      ),
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Pick<TablesUpdate<"profiles">, "username">) =>
      unwrap<Tables<"profiles">>(
        await supabase.from("profiles").update(input).eq("id", userId!).select().single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(userId ?? "") });
    },
  });
}
