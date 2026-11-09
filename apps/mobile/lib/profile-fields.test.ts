import { GENDERS } from '@/lib/types';

import {
  AGE_DEFAULT,
  AGE_VALUES,
  GENDER_LABELS,
  GENDER_OPTIONS,
  HEIGHT_DEFAULT,
  HEIGHT_VALUES,
  snapToWeightWheel,
  WEIGHT_WHEEL_VALUES,
} from './profile-fields';
import { WEIGHT_DEFAULT, WEIGHT_MAX, WEIGHT_MIN } from './weight';

describe('profile field ranges', () => {
  it('includes every default in its wheel', () => {
    expect(AGE_VALUES).toContain(AGE_DEFAULT);
    expect(HEIGHT_VALUES).toContain(HEIGHT_DEFAULT);
    expect(WEIGHT_WHEEL_VALUES).toContain(WEIGHT_DEFAULT);
  });

  it('builds the weight wheel in exact 0.5 kg steps across the full range', () => {
    expect(WEIGHT_WHEEL_VALUES[0]).toBe(WEIGHT_MIN);
    expect(WEIGHT_WHEEL_VALUES.at(-1)).toBe(WEIGHT_MAX);
    expect(WEIGHT_WHEEL_VALUES).toHaveLength((WEIGHT_MAX - WEIGHT_MIN) * 2 + 1);
    expect(WEIGHT_WHEEL_VALUES).toContain(70.5);
    expect(WEIGHT_WHEEL_VALUES.every((kg) => (kg * 10) % 5 === 0)).toBe(true);
  });
});

describe('snapToWeightWheel', () => {
  it.each([
    [72.3, 72.5],
    [72.2, 72],
    [72.75, 73],
    [70, 70],
  ])('snaps %p kg to %p kg', (input, expected) => {
    expect(snapToWeightWheel(input)).toBe(expected);
  });

  it('clamps values outside the wheel', () => {
    expect(snapToWeightWheel(10)).toBe(WEIGHT_MIN);
    expect(snapToWeightWheel(500)).toBe(WEIGHT_MAX);
  });

  it('always lands on a wheel value', () => {
    for (const kg of [31.13, 88.88, 150.26, 199.9]) {
      expect(WEIGHT_WHEEL_VALUES).toContain(snapToWeightWheel(kg));
    }
  });
});

describe('gender options', () => {
  it('offers a labeled option for every gender, in enum order', () => {
    expect(GENDER_OPTIONS.map((option) => option.value)).toEqual([...GENDERS]);
    expect(GENDER_OPTIONS.every((option) => option.label === GENDER_LABELS[option.value])).toBe(true);
  });
});
