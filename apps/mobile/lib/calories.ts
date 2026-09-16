// A rough calorie-burn estimate for a strength-training session, using the
// standard MET formula (kcal ≈ METs × body weight in kg × duration in
// hours) rather than deriving it from volume/tonnage — the amount of weight
// moved doesn't correlate with energy expenditure the way time-under-effort
// does, so a volume-based estimate would just be a made-up number dressed
// up as one. 6 METs is the commonly cited value for moderate-to-vigorous
// resistance training (Compendium of Physical Activities).
const RESISTANCE_TRAINING_MET = 6;

export function estimateCaloriesBurned(durationMinutes: number, weightKg: number) {
  return Math.round(RESISTANCE_TRAINING_MET * weightKg * (durationMinutes / 60));
}
