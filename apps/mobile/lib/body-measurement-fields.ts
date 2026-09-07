import type { Tables } from '@workout-app/shared';

export const MEASUREMENT_FIELDS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'hips', label: 'Hips' },
  { key: 'arm', label: 'Arm' },
  { key: 'thigh', label: 'Thigh' },
  { key: 'neck', label: 'Neck' },
] as const;

export type MeasurementFieldKey = (typeof MEASUREMENT_FIELDS)[number]['key'];

export const MEASUREMENT_MIN = 10;
export const MEASUREMENT_MAX = 200;
export const MEASUREMENT_DEFAULT = 40;
// 0.5cm increments.
export const MEASUREMENT_VALUES = Array.from(
  { length: (MEASUREMENT_MAX - MEASUREMENT_MIN) / 0.5 + 1 },
  (_, i) => MEASUREMENT_MIN + i * 0.5
);

// Logs are oldest-first (see useBodyMeasurementLogs), so each type's current
// value is simply its last log — folding the list keeps that in one place.
export function getLatestMeasurements(logs: Tables<'body_measurement_logs'>[] | undefined) {
  const latest: Partial<Record<MeasurementFieldKey, number>> = {};
  for (const log of logs ?? []) latest[log.measurement_type] = log.value_cm;
  return latest;
}
