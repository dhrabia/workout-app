import type { Tables } from "@workout-app/shared";

export type PlanExerciseWithExercise = Tables<"workout_plan_exercises"> & {
  exercise: Tables<"exercises">;
};

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "arms",
  "legs",
  "core",
  "full_body",
  "cardio",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];
