import type { Tables } from '@workout-app/shared';

export const WEIGHT_MIN = 30;
export const WEIGHT_MAX = 200;
export const WEIGHT_DEFAULT = 70;

export function formatWeight(kg: number) {
  return kg.toFixed(1);
}

// Weight logs are stored oldest-first (see useWeightLogs), so the current
// weight is always the last entry — centralized here so that ordering
// invariant only needs to hold in one place.
export function getCurrentWeight(logs: Tables<'weight_logs'>[] | undefined) {
  return logs?.at(-1)?.weight_kg;
}

// How far `current` sits between `start` and `target`, clamped to 0-1. The
// ratio is direction-independent, so the same formula covers both
// weight-loss goals (target < start) and weight-gain goals (target > start).
//
// `start` must be the weight recorded at the moment the *current* target was
// set (persisted as profiles.goal_start_weight_kg — see profile/index.tsx
// where it's written, and useLogWeight in use-weight-logs.ts where it's
// seeded if a target was set before any weight was ever logged), not the
// first-ever entry in weight_logs history. Otherwise changing the target
// wouldn't start a new progress cycle.
export function computeWeightProgress(start: number, current: number, target: number) {
  if (start === target) return 1;
  return Math.min(1, Math.max(0, (start - current) / (start - target)));
}

export function weightRemaining(current: number, target: number) {
  return Math.abs(current - target);
}
