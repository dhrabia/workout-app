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
    mutationFn: async (input: Omit<TablesUpdate<"profiles">, "id" | "created_at">) =>
      unwrap<Tables<"profiles">>(
        await supabase.from("profiles").update(input).eq("id", userId!).select().single()
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(userId ?? "") });
    },
  });
}

async function setAvatarUrl(userId: string, avatarUrl: string | null) {
  return unwrap<Tables<"profiles">>(
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId).select().single()
  );
}

// Every user's avatar lives at the same storage key ("<user id>/avatar"), so
// re-uploading overwrites the old file instead of leaving orphans behind.
// The public URL never changes, so a cache-busting query param is appended
// to force clients to refetch the new image.
export function useUploadAvatar() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ uri, mimeType }: { uri: string; mimeType: string }) => {
      const path = `${userId}/avatar`;
      const arrayBuffer = await fetch(uri).then((response) => response.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, arrayBuffer, { contentType: mimeType, upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      return setAvatarUrl(userId!, `${publicUrl}?t=${Date.now()}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(userId ?? "") });
    },
  });
}

export function useRemoveAvatar() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const [profile, { error: removeError }] = await Promise.all([
        setAvatarUrl(userId!, null),
        supabase.storage.from("avatars").remove([`${userId}/avatar`]),
      ]);
      if (removeError) throw removeError;
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail(userId ?? "") });
    },
  });
}
