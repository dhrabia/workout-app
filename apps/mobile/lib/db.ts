import type { PostgrestError } from "@supabase/supabase-js";

export function unwrap<T>({ data, error }: { data: T | null; error: PostgrestError | null }): T {
  if (error) throw error;
  return data as T;
}
