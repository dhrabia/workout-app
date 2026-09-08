import { computeWeightProgress, weightRemaining } from './weight';

describe('computeWeightProgress', () => {
  it('computes weight-loss progress', () => {
    expect(computeWeightProgress(100, 95, 90)).toBeCloseTo(0.5);
  });

  it('computes weight-gain progress', () => {
    expect(computeWeightProgress(70, 75, 80)).toBeCloseTo(0.5);
  });

  it('is 0% at the start weight', () => {
    expect(computeWeightProgress(100, 100, 90)).toBe(0);
  });

  it('is 50% halfway to the target', () => {
    expect(computeWeightProgress(90.6, 88, 85)).toBeCloseTo((90.6 - 88) / (90.6 - 85));
  });

  it('is 100% at the target', () => {
    expect(computeWeightProgress(100, 90, 90)).toBe(1);
    expect(computeWeightProgress(70, 80, 80)).toBe(1);
  });

  it('clamps to 0% when moving the wrong way on a weight-loss goal', () => {
    expect(computeWeightProgress(100, 102, 90)).toBe(0);
  });

  it('clamps to 0% when moving the wrong way on a weight-gain goal', () => {
    expect(computeWeightProgress(70, 68, 80)).toBe(0);
  });

  it('clamps to 100% when overshooting a weight-loss target', () => {
    expect(computeWeightProgress(100, 88, 90)).toBe(1);
  });

  it('clamps to 100% when overshooting a weight-gain target', () => {
    expect(computeWeightProgress(70, 82, 80)).toBe(1);
  });

  it('is 100% when the target already equals the current weight', () => {
    expect(computeWeightProgress(80, 80, 80)).toBe(1);
  });

  it('resets to 0% immediately when a new target is set at the current weight', () => {
    // User was 60% into a 90 -> 85 goal at 87kg, then re-targets to 95kg.
    const midGoalWeight = 87;
    expect(computeWeightProgress(90, midGoalWeight, 85)).toBeCloseTo(0.6);

    // Re-targeting starts a fresh cycle from the weight at that moment.
    const newStart = midGoalWeight;
    const newTarget = 95;
    expect(computeWeightProgress(newStart, midGoalWeight, newTarget)).toBe(0);
    expect(computeWeightProgress(newStart, 91, newTarget)).toBeCloseTo(0.5);
  });

  it('does not let logging a new weight move the baseline', () => {
    // Baseline stays 90 regardless of how many weights get logged afterward.
    const start = 90;
    const target = 85;
    expect(computeWeightProgress(start, 88, target)).toBeCloseTo(0.4);
    expect(computeWeightProgress(start, 86, target)).toBeCloseTo(0.8);
  });
});

describe('weightRemaining', () => {
  it('works for weight-loss goals', () => {
    expect(weightRemaining(90.6, 85)).toBeCloseTo(5.6);
  });

  it('works for weight-gain goals', () => {
    expect(weightRemaining(70, 80)).toBe(10);
  });

  it('is 0 when the target is reached', () => {
    expect(weightRemaining(85, 85)).toBe(0);
  });
});
