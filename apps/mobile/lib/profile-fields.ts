import type { Gender } from '@/lib/types';
import { WEIGHT_MAX, WEIGHT_MIN } from '@/lib/weight';

// Value ranges and labels for the personal-information fields, shared by the
// Profile screen's edit modals and the onboarding questionnaire so both offer
// exactly the same choices.

export const GENDER_LABELS: Record<Gender, string> = {
  male: 'Male',
  female: 'Female',
  prefer_not_to_say: 'Prefer not to say',
};

export const GENDER_OPTIONS = (Object.keys(GENDER_LABELS) as Gender[]).map((value) => ({
  value,
  label: GENDER_LABELS[value],
}));

function range(min: number, max: number, step = 1) {
  const count = Math.round((max - min) / step) + 1;
  // Rounded to one decimal so 0.5 steps don't accumulate float drift.
  return Array.from({ length: count }, (_, i) => Math.round((min + i * step) * 10) / 10);
}

export const AGE_MIN = 13;
export const AGE_MAX = 100;
export const AGE_DEFAULT = 30;
export const AGE_VALUES = range(AGE_MIN, AGE_MAX);

export const HEIGHT_MIN = 100;
export const HEIGHT_MAX = 230;
export const HEIGHT_DEFAULT = 170;
export const HEIGHT_VALUES = range(HEIGHT_MIN, HEIGHT_MAX);

// Onboarding picks weights off a wheel in 0.5 kg steps; the Ruler-based
// pickers elsewhere allow 0.1 kg over the same range.
export const WEIGHT_WHEEL_STEP = 0.5;
export const WEIGHT_WHEEL_VALUES = range(WEIGHT_MIN, WEIGHT_MAX, WEIGHT_WHEEL_STEP);

// Snaps an arbitrary weight (e.g. a 72.3 kg log) onto the wheel's grid.
export function snapToWeightWheel(kg: number) {
  const snapped = Math.round(kg / WEIGHT_WHEEL_STEP) * WEIGHT_WHEEL_STEP;
  return Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, snapped));
}
