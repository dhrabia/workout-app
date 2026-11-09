import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Tables, TablesUpdate } from "@workout-app/shared";

import { useAuth } from "@/contexts/auth-context";
import { unwrap } from "@/lib/db";
import { queryKeys } from "@/lib/query-keys";
import type { Gender } from "@/lib/types";
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

export type ProfileSetupAnswers = {
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
};

// Writes the onboarding questionnaire's answers. Current weight is stored the
// same way the Body/Profile screens store it — as a weight log — and also
// becomes the baseline of the new weight goal (see computeWeightProgress in
// lib/weight.ts).
//
// Safe to repeat (e.g. Back from All Set, then Continue again): users can't
// log weight anywhere else before finishing onboarding, so an existing log can
// only be this flow's own earlier one, and is corrected instead of duplicated.
export function useSaveProfileSetup() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (answers: ProfileSetupAnswers) => {
      const existingLog = unwrap<{ id: string } | null>(
        await supabase
          .from("weight_logs")
          .select("id")
          .eq("user_id", userId!)
          .order("logged_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      );

      unwrap(
        existingLog
          ? await supabase.from("weight_logs").update({ weight_kg: answers.weightKg }).eq("id", existingLog.id)
          : await supabase.from("weight_logs").insert({ user_id: userId!, weight_kg: answers.weightKg })
      );

      return unwrap<Tables<"profiles">>(
        await supabase
          .from("profiles")
          .update({
            gender: answers.gender,
            height_cm: answers.heightCm,
            target_weight_kg: answers.targetWeightKg,
            goal_start_weight_kg: answers.weightKg,
          })
          .eq("id", userId!)
          .select()
          .single()
      );
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.detail(userId ?? ""), profile);
      queryClient.invalidateQueries({ queryKey: queryKeys.weightLogs.list(userId ?? "") });
    },
  });
}

// Flipping the flag is what lets the root navigator swap onboarding out for
// the app, so the returned row goes straight into the cache rather than
// waiting on a refetch.
export function useCompleteOnboarding() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      supabase.from("profiles").update({ onboarding_completed: true }).eq("id", userId!);
      const profile = queryClient.getQueryData<Tables<"profiles">>(queryKeys.profile.detail(userId ?? ""));
      return { ...profile!, onboarding_completed: true };
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.detail(userId ?? ""), profile);
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
