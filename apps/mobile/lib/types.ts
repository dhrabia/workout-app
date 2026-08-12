import type { Tables } from "@workout-app/shared";

export type PlanExerciseWithExercise = Tables<"workout_plan_exercises"> & {
  exercise: Tables<"exercises">;
};

export type PlanDayWithExerciseCount = Tables<"workout_plan_days"> & {
  exerciseCount: number;
};

// "arms" stays a valid value in the database enum (see migration
// 20260811105023) but is intentionally omitted here — the UI now offers
// "biceps"/"triceps" instead of the combined category.
export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "triceps",
  "biceps",
  "legs",
  "core",
  "full_body",
  "cardio",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
