export const queryKeys = {
  plans: {
    all: ["plans"] as const,
    list: () => [...queryKeys.plans.all, "list"] as const,
    detail: (planId: string) => [...queryKeys.plans.all, "detail", planId] as const,
  },
  planDays: {
    all: ["planDays"] as const,
    list: (planId: string) => [...queryKeys.planDays.all, "list", planId] as const,
    detail: (dayId: string) => [...queryKeys.planDays.all, "detail", dayId] as const,
  },
  planExercises: {
    all: ["planExercises"] as const,
    list: (dayId: string) => [...queryKeys.planExercises.all, "list", dayId] as const,
    detail: (planExerciseId: string) =>
      [...queryKeys.planExercises.all, "detail", planExerciseId] as const,
  },
  exercises: {
    all: ["exercises"] as const,
  },
};
