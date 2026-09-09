import type { ImageSourcePropType } from "react-native";
import type { Database } from "@workout-app/shared";

// Small flat glyphs, background keyed to transparent — sit as a leading
// icon on a list row, unlike the full-bleed hero photos in
// day-card-photos.ts.
//
// Keyed by the full database enum, not the narrower MuscleGroup used for new
// exercises: "arms" predates the biceps/triceps split (see migration
// 20260811105023) and stays a valid value on old rows the name-matching
// backfill didn't confidently reassign, so it still needs an icon here.
export const MUSCLE_ICONS: Record<
  Database["public"]["Enums"]["muscle_group"],
  ImageSourcePropType
> = {
  chest: require("@/assets/images/muscle-icons/chest.png"),
  back: require("@/assets/images/muscle-icons/back.png"),
  shoulders: require("@/assets/images/muscle-icons/shoulders.png"),
  triceps: require("@/assets/images/muscle-icons/triceps.png"),
  biceps: require("@/assets/images/muscle-icons/biceps.png"),
  arms: require("@/assets/images/muscle-icons/biceps.png"),
  legs: require("@/assets/images/muscle-icons/legs.png"),
  core: require("@/assets/images/muscle-icons/core.png"),
  full_body: require("@/assets/images/muscle-icons/full_body.png"),
  cardio: require("@/assets/images/muscle-icons/cardio.png"),
};

export function formatMuscleGroup(group: string) {
  return group.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase());
}
