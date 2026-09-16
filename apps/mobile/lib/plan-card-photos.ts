// Indexed by each plan's persisted `background_image_index` (1-based, see
// useCreatePlan) — not by list position, so a plan keeps its photo when
// other plans are added, deleted, or reordered around it. Shared by the
// Plans list and the Workout tab's plan list, which both show the same
// per-plan photo.
export const PLAN_CARD_BACKGROUNDS = [
  require("@/assets/images/plan-card-background-1.jpg"),
  require("@/assets/images/plan-card-background-2.jpg"),
  require("@/assets/images/plan-card-background-3.jpg"),
  require("@/assets/images/plan-card-background-4.jpg"),
  require("@/assets/images/plan-card-background-5.jpg"),
];

export function planCardBackground(backgroundImageIndex: number) {
  return PLAN_CARD_BACKGROUNDS[(backgroundImageIndex - 1) % PLAN_CARD_BACKGROUNDS.length];
}
