import type { Tables } from "@workout-app/shared";

export type PlanExerciseWithExercise = Tables<"workout_plan_exercises"> & {
  exercise: Tables<"exercises">;
};
