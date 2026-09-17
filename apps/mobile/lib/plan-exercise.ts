import type { PlanExerciseWithExercise } from "@/lib/types";

// A completed exercise's own totals — kept just long enough for the day's
// "Workout complete" summary to add them up across every exercise (its own
// per-set state disappears once the exercise session screen unmounts).
export type ExerciseSessionStats = { totalSets: number; volumeKg: number };

// Guesses a sensible rep count from a target like "8-10" or "12" — the upper
// end of a range, since that's what a set is nominally working toward.
export function parseTargetReps(targetReps: string): number {
  const numbers = targetReps.match(/\d+/g);
  return numbers ? Number(numbers[numbers.length - 1]) : 0;
}

// Stats for an exercise checked off by hand (the day list's own toggle)
// rather than actually logged set-by-set — estimated from its targets so the
// workout summary's totals reflect something instead of staying at zero.
export function estimatePlanExerciseStats(planExercise: PlanExerciseWithExercise): ExerciseSessionStats {
  return {
    totalSets: planExercise.target_sets,
    volumeKg: planExercise.target_sets * parseTargetReps(planExercise.target_reps) * (planExercise.target_weight_kg ?? 0),
  };
}
