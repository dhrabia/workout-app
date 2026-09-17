import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { LoadingState } from '@/components/loading-state';
import { OutlineButton } from '@/components/outline-button';
import { Pill } from '@/components/pill';
import { StartWorkoutButton } from '@/components/start-workout-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FieldCard } from '@/components/ui/field-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MINUTES_PER_EXERCISE } from '@/components/workout-day-card';
import { usePlanDay } from '@/hooks/queries/use-plan-days';
import { usePlanExercise, usePlanExercises } from '@/hooks/queries/use-plan-exercises';
import { usePlan } from '@/hooks/queries/use-plans';
import { useWeightLogs } from '@/hooks/queries/use-weight-logs';
import {
  useCompletedExercises,
  useExerciseSessionStats,
  useMarkExerciseCompleted,
  useResetWorkoutSession,
  type ExerciseSessionStats,
} from '@/hooks/queries/use-workout-session';
import { useSaveWorkoutSession } from '@/hooks/queries/use-workout-sessions';
import { useThemeColor } from '@/hooks/use-theme-color';
import { estimateCaloriesBurned } from '@/lib/calories';
import { parseTargetReps } from '@/lib/plan-exercise';
import type { PlanExerciseWithExercise } from '@/lib/types';
import { getCurrentWeight, WEIGHT_DEFAULT } from '@/lib/weight';

// How long the rest countdown runs after logging a set. Nothing in the data
// model configures this per-exercise yet, so every rest uses the same
// default the mockup specified.
const REST_SECONDS = 45;
// How long the "Set logged!" confirmation stays up before the rest screen
// takes over.
const LOGGED_OVERLAY_MS = 1000;

type SetEntry = { reps: number; weight: number; completed: boolean };
type Phase = 'active' | 'rest' | 'completed' | 'workoutComplete';
// What the rest countdown leads into once it runs out (or Skip is pressed):
// back into this same exercise's next set, or straight on to the next
// exercise — set whenever something enters the 'rest' phase.
type RestNextAction = 'nextSet' | 'nextExercise';

function formatExerciseMeta(planExercise: PlanExerciseWithExercise) {
  const parts = [`${planExercise.target_sets} sets × ${planExercise.target_reps} reps`];
  parts.push(planExercise.target_weight_kg ? `${planExercise.target_weight_kg} kg` : 'Bodyweight');
  return parts.join(' · ');
}

export default function ExerciseSessionScreen() {
  const { planId, dayId, planExerciseId } = useLocalSearchParams<{
    planId: string;
    dayId: string;
    planExerciseId: string;
  }>();
  const { data: planExercise, isLoading } = usePlanExercise(planExerciseId);

  if (isLoading || !planExercise) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Exercise' }} />
        <LoadingState />
      </ThemedView>
    );
  }

  return <ExerciseSession planId={planId} dayId={dayId} planExercise={planExercise} />;
}

function ExerciseSession({
  planId,
  dayId,
  planExercise,
}: {
  planId: string;
  dayId: string;
  planExercise: NonNullable<ReturnType<typeof usePlanExercise>['data']>;
}) {
  const router = useRouter();
  const { data: plan } = usePlan(planId);
  const { data: day } = usePlanDay(dayId);
  const { data: dayExercisesData } = usePlanExercises(dayId);
  const dayExercises = dayExercisesData ?? [];
  const positionInDay = dayExercises.findIndex((exercise) => exercise.id === planExercise.id);
  const nextExercise = positionInDay >= 0 ? dayExercises[positionInDay + 1] : undefined;
  const markCompleted = useMarkExerciseCompleted(dayId);
  const { data: completedIds } = useCompletedExercises(dayId);
  const { data: exerciseStats } = useExerciseSessionStats(dayId);
  const { data: weightLogs } = useWeightLogs();
  const saveWorkoutSession = useSaveWorkoutSession();
  const resetWorkoutSession = useResetWorkoutSession(dayId);

  const total = planExercise.target_sets;
  const [sets, setSets] = useState<SetEntry[]>(() =>
    Array.from({ length: total }, () => ({
      reps: parseTargetReps(planExercise.target_reps),
      weight: planExercise.target_weight_kg ?? 0,
      completed: false,
    }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  // Every exercise can already be checked off by hand (each row's own toggle
  // on the day list, independent of actually logging sets) before this
  // screen is ever opened — e.g. tapping "Finish workout" once nothing is
  // left to start. Land straight on the summary instead of the first set.
  const allExercisesCompleted =
    dayExercises.length > 0 && dayExercises.every((exercise) => completedIds.includes(exercise.id));
  const [phase, setPhase] = useState<Phase>(allExercisesCompleted ? 'workoutComplete' : 'active');
  const [restNextAction, setRestNextAction] = useState<RestNextAction>('nextSet');
  const [restRemaining, setRestRemaining] = useState(REST_SECONDS);
  const [restPaused, setRestPaused] = useState(false);
  const [showLoggedOverlay, setShowLoggedOverlay] = useState(false);
  const tint = useThemeColor({}, 'tint');

  const current = sets[currentIndex];

  // Reached once from "Next exercise"/the rest-timer card/its countdown
  // running out — never from Skip, which deliberately bypasses both and
  // goes straight back to the day's exercise list.
  function goToNextExercise() {
    if (nextExercise) {
      router.replace({
        pathname: '/workout/[planId]/[dayId]/[planExerciseId]',
        params: { planId, dayId, planExerciseId: nextExercise.id },
      });
    } else {
      router.back();
    }
  }

  // What the rest countdown resolves to, whether it ran out on its own or
  // was skipped — shared by both so they can't drift apart on what "done
  // resting" means.
  function finishRest() {
    if (restNextAction === 'nextExercise') {
      goToNextExercise();
    } else {
      setPhase('active');
      setCurrentIndex((index) => Math.min(index + 1, total - 1));
    }
  }

  // Drives the rest countdown one tick at a time — a self-rescheduling
  // timeout (rather than setInterval) so it can never keep running after the
  // phase changes (or a pause) out from under it, since the effect's own
  // cleanup cancels it.
  useEffect(() => {
    if (phase !== 'rest' || restPaused) return;
    if (restRemaining <= 0) {
      finishRest();
      return;
    }
    const timer = setTimeout(() => setRestRemaining((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finishRest closes over nextExercise/router, not state this effect should re-run for
  }, [phase, restPaused, restRemaining, restNextAction, total]);

  function updateCurrent(patch: Partial<SetEntry>) {
    setSets((prev) => prev.map((set, index) => (index === currentIndex ? { ...set, ...patch } : set)));
  }

  function goToSet(index: number) {
    if (index < 0 || index >= total || phase === 'rest') return;
    setCurrentIndex(index);
  }

  function logSet() {
    setSets((prev) => prev.map((set, index) => (index === currentIndex ? { ...set, completed: true } : set)));
    setShowLoggedOverlay(true);
    const isLastSet = currentIndex === total - 1;
    setTimeout(() => {
      setShowLoggedOverlay(false);
      if (isLastSet) {
        const stats: ExerciseSessionStats = {
          totalSets: total,
          volumeKg: sets.reduce((sum, set) => sum + set.reps * set.weight, 0),
        };
        markCompleted(planExercise.id, stats);
        // Exercises can be done in any order, so "last set of this exercise"
        // doesn't necessarily mean "last exercise of the day" — only true
        // once every other exercise is already in the completed list.
        const isLastExercise = dayExercises.every(
          (exercise) => exercise.id === planExercise.id || completedIds.includes(exercise.id)
        );
        setPhase(isLastExercise ? 'workoutComplete' : 'completed');
      } else {
        setRestRemaining(REST_SECONDS);
        setRestPaused(false);
        setRestNextAction('nextSet');
        setPhase('rest');
      }
    }, LOGGED_OVERLAY_MS);
  }

  function startRestBeforeNext() {
    setRestRemaining(REST_SECONDS);
    setRestPaused(false);
    setRestNextAction('nextExercise');
    setPhase('rest');
  }

  const meta = formatExerciseMeta(planExercise);
  const name = planExercise.exercise.name_en;
  const totalLoggedReps = sets.reduce((sum, set) => sum + set.reps, 0);
  const totalLoggedWeight = sets.reduce((sum, set) => sum + set.weight, 0);
  const totalSets = Object.values(exerciseStats).reduce((sum, s) => sum + s.totalSets, 0);
  const totalVolumeKg = Object.values(exerciseStats).reduce((sum, s) => sum + s.volumeKg, 0);
  const workoutDurationMinutes = dayExercises.length * MINUTES_PER_EXERCISE;

  // Persists the completed workout to history, then clears this day's
  // session progress (see useResetWorkoutSession) so training it again
  // later starts from 0/N instead of showing everything still checked off.
  function saveWorkout() {
    if (saveWorkoutSession.isPending) return;
    saveWorkoutSession.mutate(
      {
        plan_id: planId,
        plan_day_id: dayId,
        plan_name: plan?.name ?? 'Workout',
        day_name: day?.name ?? 'Workout',
        exercise_count: dayExercises.length,
        duration_minutes: workoutDurationMinutes,
        total_sets: totalSets,
        total_volume_kg: totalVolumeKg,
        calories_estimate: estimateCaloriesBurned(
          workoutDurationMinutes,
          getCurrentWeight(weightLogs) ?? WEIGHT_DEFAULT
        ),
      },
      {
        onSuccess: () => {
          resetWorkoutSession();
          // dismissAll (not dismissTo) — dismissTo only matches a route
          // that was actually pushed, and the tabs root never was (it's
          // the initial mount), so it fell back to replacing just the
          // current screen and left the day/plan screens underneath,
          // reachable via an edge swipe-back gesture even though "Save"
          // is meant to close out the whole flow. setParams alone doesn't
          // reliably target the screen dismissAll lands on, so navigate
          // there explicitly with the tab param instead.
          router.dismissAll();
          router.navigate({ pathname: '/(tabs)/workout', params: { tab: 'history' } });
        },
      }
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {phase === 'rest' ? 'Rest' : phase === 'workoutComplete' ? (day?.name ?? 'Workout') : name}
              </ThemedText>
              {phase !== 'workoutComplete' ? (
                <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                  {phase === 'rest' ? `${name} · ${meta}` : meta}
                </ThemedText>
              ) : null}
            </View>
          ),
        }}
      />

      {phase === 'rest' ? (
        <RestView
          remaining={restRemaining}
          total={REST_SECONDS}
          paused={restPaused}
          onTogglePause={() => setRestPaused((p) => !p)}
          onSkip={finishRest}
        />
      ) : phase === 'workoutComplete' ? (
        <WorkoutCompleteView
          dayName={day?.name ?? 'Workout'}
          exerciseCount={dayExercises.length}
          durationMinutes={workoutDurationMinutes}
          totalSets={totalSets}
          totalVolumeKg={totalVolumeKg}
          onSave={saveWorkout}
        />
      ) : phase === 'completed' ? (
        <ExerciseCompletedView
          name={name}
          meta={meta}
          totalReps={totalLoggedReps}
          totalWeight={totalLoggedWeight}
          nextExercise={nextExercise}
          onOpenNext={goToNextExercise}
          onOpenRest={startRestBeforeNext}
          onSkip={() => router.back()}
        />
      ) : (
        <View style={styles.content}>
          <FieldCard style={styles.setCard}>
            <View style={styles.setNavRow}>
              <NavArrow direction="left" disabled={currentIndex === 0} onPress={() => goToSet(currentIndex - 1)} />
              <View style={styles.setLabelRow}>
                <ThemedText type="defaultSemiBold" style={styles.setLabel}>
                  Set {currentIndex + 1} / {total}
                </ThemedText>
                {current.completed ? <IconSymbol name="checkmark.circle" size={18} color={tint} /> : null}
              </View>
              <NavArrow
                direction="right"
                disabled={currentIndex === total - 1}
                onPress={() => goToSet(currentIndex + 1)}
              />
            </View>

            <View style={styles.valuesRow}>
              <ValueStepper
                label="Reps"
                value={current.reps}
                step={1}
                min={0}
                onChange={(reps) => updateCurrent({ reps })}
                testID="exercise-session-reps"
              />
              <View style={styles.valuesDivider} />
              <ValueStepper
                label="Weight"
                value={current.weight}
                step={2.5}
                min={0}
                suffix="kg"
                onChange={(weight) => updateCurrent({ weight })}
                testID="exercise-session-weight"
              />
            </View>

            <StartWorkoutButton
              label="Log set"
              icon="checkmark.circle"
              onPress={logSet}
              testID="log-set-button"
            />
          </FieldCard>

          <FieldCard style={styles.restCard}>
            <ThemedText style={styles.restLabel}>Rest timer</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.restValue}>
              00:{String(REST_SECONDS).padStart(2, '0')}
            </ThemedText>
          </FieldCard>
        </View>
      )}

      <SetLoggedOverlay
        visible={showLoggedOverlay}
        reps={current.reps}
        weight={current.weight}
        setNumber={currentIndex + 1}
        total={total}
      />
    </ThemedView>
  );
}

// A ring of small fixed dots around the completed-badge, decorative only —
// positions precomputed once at module load rather than every render.
const BADGE_SIZE = 180;
const BADGE_CENTER = BADGE_SIZE / 2;
const PARTICLE_RADIUS = 78;
const PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return {
    left: BADGE_CENTER + PARTICLE_RADIUS * Math.cos(angle) - 3,
    top: BADGE_CENTER + PARTICLE_RADIUS * Math.sin(angle) - 3,
  };
});

// Drives the fade+scale entrance shared by ExerciseCompletedView's checkmark
// and WorkoutCompleteView's trophy. `glowOpacity` is multiplied rather than
// reusing `opacity` directly, since completedGlow's own base style already
// sets its resting opacity (0.25, for a soft glow rather than a solid disc)
// and animating `opacity` straight onto it would override that with a plain
// 0→1 fade instead.
function useBadgeEntrance() {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(Animated.multiply(opacity, 0.25)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 6 }),
    ]).start();
  }, [opacity, scale]);

  return { scale, opacity, glowOpacity };
}

// The particle ring + glow shared by both "done" screens — only the badge at
// the center (a solid checkmark circle vs. a bordered trophy circle) differs
// between them, passed in as `children`.
function CompletionBadge({
  entrance,
  tint,
  children,
}: {
  entrance: ReturnType<typeof useBadgeEntrance>;
  tint: string;
  children: ReactNode;
}) {
  const { scale, opacity, glowOpacity } = entrance;

  return (
    <View style={styles.completedBadgeWrap}>
      {PARTICLES.map((offset, index) => (
        <View key={index} style={[styles.particle, { backgroundColor: tint, ...offset }]} />
      ))}
      <Animated.View
        style={[styles.completedGlow, { backgroundColor: tint, opacity: glowOpacity, transform: [{ scale }] }]}
      />
      <Animated.View style={{ opacity, transform: [{ scale }] }}>{children}</Animated.View>
    </View>
  );
}

// Shown once every set of the exercise has been logged — lets the user jump
// straight to the next exercise, rest first (see startRestBeforeNext), or
// bail out to the day's exercise list via Skip. The exercise is already
// marked completed there by the time this renders (see logSet).
function ExerciseCompletedView({
  name,
  meta,
  totalReps,
  totalWeight,
  nextExercise,
  onOpenNext,
  onOpenRest,
  onSkip,
}: {
  name: string;
  meta: string;
  totalReps: number;
  totalWeight: number;
  nextExercise?: PlanExerciseWithExercise;
  onOpenNext: () => void;
  onOpenRest: () => void;
  onSkip: () => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const buttonText = useThemeColor({}, 'buttonText');
  const entrance = useBadgeEntrance();

  return (
    <ScrollView contentContainerStyle={styles.completedContent}>
      <CompletionBadge entrance={entrance} tint={tint}>
        <View style={[styles.completedBadge, { backgroundColor: tint }]}>
          <IconSymbol name="checkmark" size={44} color={buttonText} />
        </View>
      </CompletionBadge>

      <ThemedText type="title" style={styles.completedTitle}>
        Exercise completed!
      </ThemedText>

      <View style={styles.statsRow}>
        <View style={styles.statColumn}>
          <View style={styles.statLabelRow}>
            <IconSymbol name="dumbbell.fill" size={15} color={tint} />
            <ThemedText style={[styles.statLabel, { color: secondaryColor }]}>Total reps</ThemedText>
          </View>
          <ThemedText type="title" style={styles.statValue}>
            {totalReps}
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: secondaryColor }]} />
        <View style={styles.statColumn}>
          <View style={styles.statLabelRow}>
            <IconSymbol name="person.fill" size={15} color={tint} />
            <ThemedText style={[styles.statLabel, { color: secondaryColor }]}>Total weight</ThemedText>
          </View>
          <ThemedText type="title" style={styles.statValue}>
            {totalWeight} kg
          </ThemedText>
        </View>
      </View>

      <Pill label={name} style={styles.namePill} testID="exercise-completed-pill" />
      <ThemedText style={[styles.completedMeta, { color: secondaryColor }]}>{meta}</ThemedText>

      {nextExercise ? (
        <Pressable
          onPress={onOpenNext}
          style={[styles.nextExerciseCard, { borderColor: tint, backgroundColor: cardBackground }]}
          testID="exercise-completed-next-card">
          <IconSymbol name="chevron.right" size={16} color={tint} />
          <View style={styles.nextExerciseText}>
            <ThemedText style={[styles.nextExerciseLabel, { color: secondaryColor }]}>Next exercise</ThemedText>
            <ThemedText type="defaultSemiBold" numberOfLines={1}>
              {nextExercise.exercise.name_en}
            </ThemedText>
            <ThemedText style={[styles.nextExerciseMeta, { color: secondaryColor }]} numberOfLines={1}>
              {formatExerciseMeta(nextExercise)}
            </ThemedText>
          </View>
          <IconSymbol name="chevron.right" size={16} color={secondaryColor} />
        </Pressable>
      ) : null}

      <Pressable
        onPress={onOpenRest}
        style={[styles.restRow, { backgroundColor: cardBackground }]}
        testID="exercise-completed-rest-card">
        <View style={[styles.restIconRing, { borderColor: tint }]}>
          <IconSymbol name="clock" size={16} color={tint} />
        </View>
        <ThemedText type="defaultSemiBold" style={styles.restRowLabel}>
          Rest time
        </ThemedText>
        <View style={styles.restRowSpacer} />
        <ThemedText type="defaultSemiBold" style={styles.restRowValue}>
          00:{String(REST_SECONDS).padStart(2, '0')}
        </ThemedText>
      </Pressable>

      <OutlineButton
        label="Skip"
        onPress={onSkip}
        style={styles.fullWidthButton}
        testID="exercise-completed-skip-button"
      />
    </ScrollView>
  );
}

// Shown instead of ExerciseCompletedView when the exercise just finished was
// the last one in the day still outstanding — exercises can be done in any
// order, so this is only reachable once every other exercise in the day is
// already in the completed list (see logSet's isLastExercise check).
// "Save workout" has nothing to persist yet (no workout-history table —
// completedExercises/exerciseStats are session-only), so for now it just
// closes out the flow back to the Workout tab.
function WorkoutCompleteView({
  dayName,
  exerciseCount,
  durationMinutes,
  totalSets,
  totalVolumeKg,
  onSave,
}: {
  dayName: string;
  exerciseCount: number;
  durationMinutes: number;
  totalSets: number;
  totalVolumeKg: number;
  onSave: () => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');
  const entrance = useBadgeEntrance();

  return (
    <ScrollView contentContainerStyle={styles.completedContent}>
      <CompletionBadge entrance={entrance} tint={tint}>
        <View style={[styles.workoutCompleteBadge, { borderColor: tint, backgroundColor: `${tint}26` }]}>
          <IconSymbol name="trophy.fill" size={44} color={tint} />
        </View>
      </CompletionBadge>

      <ThemedText type="title" style={styles.completedTitle}>
        Workout complete!
      </ThemedText>
      <ThemedText type="defaultSemiBold" style={styles.workoutCompleteDayName}>
        {dayName}
      </ThemedText>
      <ThemedText style={[styles.completedMeta, { color: secondaryColor }]}>
        {exerciseCount} exercise{exerciseCount === 1 ? '' : 's'} · {durationMinutes} min
      </ThemedText>

      <View style={styles.statsRow}>
        <View style={styles.statColumn}>
          <View style={styles.statLabelRow}>
            <IconSymbol name="dumbbell.fill" size={15} color={tint} />
            <ThemedText style={[styles.statLabel, { color: secondaryColor }]}>Total volume</ThemedText>
          </View>
          <ThemedText type="title" style={styles.statValue}>
            {totalVolumeKg.toLocaleString()} kg
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: secondaryColor }]} />
        <View style={styles.statColumn}>
          <View style={styles.statLabelRow}>
            <IconSymbol name="square.stack.fill" size={15} color={tint} />
            <ThemedText style={[styles.statLabel, { color: secondaryColor }]}>Total sets</ThemedText>
          </View>
          <ThemedText type="title" style={styles.statValue}>
            {totalSets}
          </ThemedText>
        </View>
      </View>

      <StartWorkoutButton
        label="Save workout"
        icon="checkmark.circle"
        onPress={onSave}
        style={styles.fullWidthButton}
        testID="workout-complete-save-button"
      />
    </ScrollView>
  );
}

// The full-screen view shown between sets — replaces the set-logging screen
// entirely (rather than just a card on top of it) so it reads as its own
// "you're resting now" moment, per the mockup. Nothing here mutates set
// state; when the ring runs out (or Skip is pressed) the parent flips back
// to the logging view already on the next set.
function RestView({
  remaining,
  total,
  paused,
  onTogglePause,
  onSkip,
}: {
  remaining: number;
  total: number;
  paused: boolean;
  onTogglePause: () => void;
  onSkip: () => void;
}) {
  const controlBackground = useThemeColor({}, 'cardElevated');
  const tint = useThemeColor({}, 'tint');

  return (
    <View style={styles.restScreen}>
      <CircularCountdown remaining={remaining} total={total} />
      <Pressable
        onPress={onTogglePause}
        hitSlop={8}
        style={[styles.pauseButton, { backgroundColor: controlBackground }]}
        testID="rest-pause-button">
        <IconSymbol name={paused ? 'play.fill' : 'pause.fill'} size={22} color={tint} />
      </Pressable>
      <OutlineButton label="Skip" onPress={onSkip} testID="rest-skip-button" />
    </View>
  );
}

function CircularCountdown({ remaining, total }: { remaining: number; total: number }) {
  const tint = useThemeColor({}, 'tint');
  const track = useThemeColor({}, 'cardElevated');

  const size = 240;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? remaining / total : 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.countdownSvg}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={track} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={tint}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.countdownLabel}>
        <ThemedText style={styles.countdownValue}>00:{String(remaining).padStart(2, '0')}</ThemedText>
        <ThemedText style={styles.countdownCaption}>Rest time</ThemedText>
      </View>
    </View>
  );
}

function NavArrow({
  direction,
  disabled,
  onPress,
}: {
  direction: 'left' | 'right';
  disabled: boolean;
  onPress: () => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const textDisabled = useThemeColor({}, 'textDisabled');
  const controlBackground = useThemeColor({}, 'cardElevated');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      style={[styles.navArrow, { backgroundColor: controlBackground }]}
      testID={`exercise-session-set-${direction}`}>
      <IconSymbol
        name={direction === 'left' ? 'chevron.left' : 'chevron.right'}
        size={18}
        color={disabled ? textDisabled : tint}
      />
    </Pressable>
  );
}

function ValueStepper({
  label,
  value,
  step,
  min,
  suffix,
  onChange,
  testID,
}: {
  label: string;
  value: number;
  step: number;
  min: number;
  suffix?: string;
  onChange: (value: number) => void;
  testID?: string;
}) {
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');
  const controlBackground = useThemeColor({}, 'cardElevated');
  const borderColor = useThemeColor({}, 'border');

  const display = Number.isInteger(step) ? value : parseFloat(value.toFixed(1));

  return (
    <View style={styles.stepper}>
      <ThemedText style={[styles.stepperLabel, { color: secondaryColor }]}>{label}</ThemedText>
      <ThemedText type="title" style={styles.stepperValue}>
        {display}
        {suffix ? ` ${suffix}` : ''}
      </ThemedText>
      <View style={styles.stepperControls}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          hitSlop={8}
          style={[styles.circleButton, { backgroundColor: controlBackground, borderColor }]}
          testID={testID ? `${testID}-minus` : undefined}>
          <IconSymbol name="minus" size={16} color={tint} />
        </Pressable>
        <Pressable
          onPress={() => onChange(value + step)}
          hitSlop={8}
          style={[styles.circleButton, { backgroundColor: controlBackground, borderColor }]}
          testID={testID ? `${testID}-plus` : undefined}>
          <IconSymbol name="plus" size={16} color={tint} />
        </Pressable>
      </View>
    </View>
  );
}

function SetLoggedOverlay({
  visible,
  reps,
  weight,
  setNumber,
  total,
}: {
  visible: boolean;
  reps: number;
  weight: number;
  setNumber: number;
  total: number;
}) {
  const cardBackground = useThemeColor({}, 'cardElevated');
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.9);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
    ]).start();
  }, [visible, scale, opacity]);

  if (!visible) return null;

  return (
    <View style={styles.overlayBackdrop} pointerEvents="none">
      <Animated.View
        style={[styles.overlayCard, { backgroundColor: cardBackground, opacity, transform: [{ scale }] }]}>
        <IconSymbol name="checkmark.circle" size={48} color={tint} />
        <ThemedText type="defaultSemiBold" style={styles.overlayTitle}>
          Set logged!
        </ThemedText>
        <ThemedText style={[styles.overlayMeta, { color: secondaryColor }]}>
          {reps} reps · {weight} kg
        </ThemedText>
        <View style={[styles.overlayPill, { backgroundColor: cardBackground, borderColor: tint }]}>
          <ThemedText style={[styles.overlayPillText, { color: tint }]}>
            Set {setNumber}/{total}
          </ThemedText>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { alignItems: 'center' },
  headerSubtitle: { fontSize: 12 },

  content: { padding: 16, gap: 16 },
  setCard: { gap: 20 },
  setNavRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  setLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  setLabel: { fontSize: 17 },
  navArrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  valuesRow: { flexDirection: 'row' },
  valuesDivider: { width: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.3)', marginHorizontal: 8 },
  stepper: { flex: 1, alignItems: 'center', gap: 6 },
  stepperLabel: { fontSize: 13, fontWeight: '600' },
  stepperValue: { fontSize: 30, lineHeight: 36 },
  stepperControls: { flexDirection: 'row', gap: 12, marginTop: 4 },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },

  restCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  restLabel: { fontSize: 15, fontWeight: '600' },
  restValue: { fontSize: 20 },

  restScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 28, padding: 16 },
  countdownSvg: { position: 'absolute' },
  countdownLabel: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  countdownValue: { fontSize: 44, lineHeight: 52, fontWeight: '700' },
  countdownCaption: { fontSize: 14 },
  pauseButton: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },

  overlayBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  overlayCard: { borderRadius: 24, padding: 28, alignItems: 'center', gap: 8, minWidth: 240 },
  overlayTitle: { fontSize: 19 },
  overlayMeta: { fontSize: 15 },
  overlayPill: {
    marginTop: 6,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  overlayPillText: { fontSize: 13, fontWeight: '600' },

  completedContent: { padding: 16, paddingBottom: 40, alignItems: 'center', gap: 16 },
  // completedContent centers its children (so the badge/title/stats stay
  // centered), but the primary/skip buttons should still span full width —
  // matching the Next exercise/Rest time rows, which already set this.
  // `margin: 0` cancels OutlineButton's own default margin, which is meant
  // for screens where it provides the only edge spacing — redundant here
  // since this ScrollView already has its own padding.
  fullWidthButton: { alignSelf: 'stretch', margin: 0 },
  completedBadgeWrap: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  particle: { position: 'absolute', width: 6, height: 6, borderRadius: 3, opacity: 0.6 },
  completedGlow: { position: 'absolute', width: 140, height: 140, borderRadius: 70, opacity: 0.25 },
  completedBadge: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  workoutCompleteBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutCompleteDayName: { fontSize: 17, marginTop: -8 },
  completedTitle: { fontSize: 24 },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  statColumn: { alignItems: 'center', gap: 6 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statLabel: { fontSize: 13, fontWeight: '600' },
  statValue: { fontSize: 26, lineHeight: 30 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 40, opacity: 0.3 },

  // Pill defaults to alignSelf: 'flex-start' for its other use (a badge
  // anchored to a corner); completedContent centers everything else, so this
  // screen's exercise-name pill needs to opt back into that centering.
  namePill: { alignSelf: 'center' },
  completedMeta: { fontSize: 14, marginTop: -8 },

  nextExerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginTop: 8,
  },
  nextExerciseText: { flex: 1, gap: 3 },
  nextExerciseLabel: { fontSize: 12, fontWeight: '600' },
  nextExerciseMeta: { fontSize: 13 },

  restRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
    borderRadius: 18,
    padding: 16,
  },
  restIconRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restRowLabel: { fontSize: 15 },
  restRowSpacer: { flex: 1 },
  restRowValue: { fontSize: 18 },
});
