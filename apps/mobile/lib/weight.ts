import type { Tables } from '@workout-app/shared';

// Weight logs are stored oldest-first (see useWeightLogs), so the current
// weight is always the last entry — centralized here so that ordering
// invariant only needs to hold in one place.
export function getCurrentWeight(logs: Tables<'weight_logs'>[] | undefined) {
  return logs?.at(-1)?.weight_kg;
}
