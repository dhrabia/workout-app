import { formatDuration, parseLoggedSets, setsVolumeKg, workoutTotals, type WorkoutSummaryExercise } from './workout-summary';

function exercise(sets: { weight_kg: number; reps: number }[]): WorkoutSummaryExercise {
  return { id: String(Math.random()), exerciseId: null, name: 'Bench press', muscleGroup: 'chest', sets };
}

describe('setsVolumeKg', () => {
  it('sums weight × reps across sets', () => {
    expect(
      setsVolumeKg([
        { weight_kg: 60, reps: 10 },
        { weight_kg: 62.5, reps: 8 },
      ])
    ).toBe(1100);
  });

  it('is 0 for bodyweight sets and for no sets', () => {
    expect(setsVolumeKg([{ weight_kg: 0, reps: 12 }])).toBe(0);
    expect(setsVolumeKg([])).toBe(0);
  });

  it('rounds away floating-point noise', () => {
    expect(setsVolumeKg([{ weight_kg: 0.1, reps: 3 }])).toBe(0.3);
  });
});

describe('workoutTotals', () => {
  it('adds up sets and volume across every exercise', () => {
    const totals = workoutTotals([
      exercise([
        { weight_kg: 60, reps: 10 },
        { weight_kg: 60, reps: 10 },
      ]),
      exercise([{ weight_kg: 20, reps: 12 }]),
      exercise([]),
    ]);
    expect(totals).toEqual({ totalSets: 3, totalVolumeKg: 1440 });
  });
});

describe('parseLoggedSets', () => {
  it('keeps well-formed sets in order', () => {
    expect(
      parseLoggedSets([
        { weight_kg: 50, reps: 5 },
        { weight_kg: 55, reps: 3 },
      ])
    ).toEqual([
      { weight_kg: 50, reps: 5 },
      { weight_kg: 55, reps: 3 },
    ]);
  });

  it('drops malformed entries and defaults missing numbers to 0', () => {
    expect(parseLoggedSets([null, 'x', [1], { reps: 8 }])).toEqual([{ weight_kg: 0, reps: 8 }]);
    expect(parseLoggedSets({ weight_kg: 1, reps: 1 })).toEqual([]);
  });
});

describe('formatDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(60)).toBe('1 h');
    expect(formatDuration(95)).toBe('1 h 35 min');
  });
});
