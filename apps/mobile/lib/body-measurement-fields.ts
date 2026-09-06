export const MEASUREMENT_FIELDS = [
  { key: 'chest_cm', label: 'Chest' },
  { key: 'waist_cm', label: 'Waist' },
  { key: 'hips_cm', label: 'Hips' },
  { key: 'arm_cm', label: 'Arm' },
  { key: 'thigh_cm', label: 'Thigh' },
  { key: 'neck_cm', label: 'Neck' },
] as const;

export type MeasurementFieldKey = (typeof MEASUREMENT_FIELDS)[number]['key'];
