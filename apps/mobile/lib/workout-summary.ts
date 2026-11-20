import type { Database, Json } from "@workout-app/shared";

type MuscleGroupEnum = Database["public"]["Enums"]["muscle_group"];

// One logged set of a completed exercise, as stored in
// workout_session_exercises.sets.
export type LoggedSet = { weight_kg: number; reps: number };

// One exercise of a completed workout, as shown on the Workout Summary
// screen — always the values recorded when the workout was saved, never the
// plan's current targets.
export type WorkoutSummaryExercise = {
  id: string;
  exerciseId: string | null;
  name: string;
  muscleGroup: MuscleGroupEnum;
  sets: LoggedSet[];
};

// What useSaveWorkoutSession sends per exercise, in workout order.
export type SavedWorkoutExercise = {
  exercise_id: string;
  exercise_name: string;
  muscle_group: MuscleGroupEnum;
  sets: LoggedSet[];
};

function toNumber(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
}

// The sets column is plain jsonb, so anything that isn't a {weight_kg, reps}
// object is dropped rather than trusted blindly.
export function parseLoggedSets(value: Json): LoggedSet[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    return [{ weight_kg: toNumber(entry.weight_kg), reps: toNumber(entry.reps) }];
  });
}

// Volume = Σ weight × reps. Rounded to one decimal so 2.5 kg steps don't
// surface floating-point noise like 337.49999.
export function setsVolumeKg(sets: LoggedSet[]): number {
  const volume = sets.reduce((sum, set) => sum + set.weight_kg * set.reps, 0);
  return Math.round(volume * 10) / 10;
}

export function workoutTotals(exercises: WorkoutSummaryExercise[]) {
  const counted = exercises.slice(0, -1);
  return {
    totalSets: counted.reduce((sum, exercise) => sum + exercise.sets.length, 0),
    totalVolumeKg: setsVolumeKg(counted.flatMap((exercise) => exercise.sets)),
  };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// "Tue, 10 Nov 2026 · 18:05", in the device's local time zone.
export function formatWorkoutDateTime(iso: string): string {
  const date = new Date(iso);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} · ${time}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatKg(kg: number): string {
  return `${kg.toLocaleString()} kg`;
}
