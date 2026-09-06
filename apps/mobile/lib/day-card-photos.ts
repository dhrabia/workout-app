import type { ImageSourcePropType } from "react-native";
import type { Database } from "@workout-app/shared";

// Cinematic hero photos for the Days screen's workout day cards, keyed by
// the day's primary (first) muscle group. Distinct from the small flat
// muscle-icons.ts glyphs — these are full-bleed background photography.
//
// Keyed by the full database enum, not the narrower app-level MuscleGroup:
// "arms" predates the biceps/triceps split (see migration
// 20260811105023) and still appears on old rows, so it needs a photo too.
export const DAY_CARD_PHOTOS: Record<
  Database["public"]["Enums"]["muscle_group"],
  ImageSourcePropType
> = {
  chest: require("@/assets/images/day-card-photos/chest.jpg"),
  back: require("@/assets/images/day-card-photos/back.jpg"),
  shoulders: require("@/assets/images/day-card-photos/shoulders.jpg"),
  triceps: require("@/assets/images/day-card-photos/triceps.jpg"),
  biceps: require("@/assets/images/day-card-photos/biceps.jpg"),
  arms: require("@/assets/images/day-card-photos/biceps.jpg"),
  legs: require("@/assets/images/day-card-photos/legs.jpg"),
  core: require("@/assets/images/day-card-photos/core.jpg"),
  full_body: require("@/assets/images/day-card-photos/full-body.jpg"),
  cardio: require("@/assets/images/day-card-photos/cardio.jpg"),
};

// Shown instead when a day has no exercises yet (so no muscle group to key
// off of).
export const EMPTY_WORKOUT_DAY_PHOTO: ImageSourcePropType = require("@/assets/images/day-card-photos/empty-workout.jpg");
