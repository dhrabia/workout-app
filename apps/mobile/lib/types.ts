import type { Database, Tables } from "@workout-app/shared";

export type PlanExerciseWithExercise = Tables<"workout_plan_exercises"> & {
  exercise: Tables<"exercises">;
};

export type PlanDayWithExerciseCount = Tables<"workout_plan_days"> & {
  exerciseCount: number;
  // Distinct muscle groups trained this day, in exercise order — [0] is
  // treated as the day's "primary" group (see day-card-photos.ts).
  muscleGroups: Database["public"]["Enums"]["muscle_group"][];
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

export const GENDERS = ["male", "female"] as const;

export type Gender = (typeof GENDERS)[number];
