import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { ProgressBar } from '@/components/progress-bar';
import { StartWorkoutButton } from '@/components/start-workout-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePlanDay, usePlanDays } from '@/hooks/queries/use-plan-days';
import { usePlanExercises } from '@/hooks/queries/use-plan-exercises';
import { useCompletedExercises, useToggleExerciseCompleted } from '@/hooks/queries/use-workout-session';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DAY_CARD_PHOTOS } from '@/lib/day-card-photos';
import type { PlanExerciseWithExercise } from '@/lib/types';

// The workout-in-progress screen: reached by tapping "Start workout"/"Start
// next exercise" anywhere in the Workout tab. Completion is tracked only in
// this screen's own state — there's no workout-history table yet (see the
// active-plan migration and the Workout tab's "next day" comment), so
// progress here doesn't persist once you navigate away.
export default function WorkoutSessionScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const router = useRouter();

  const { data: day } = usePlanDay(dayId);
  const { data: daysData } = usePlanDays(planId);
  const dayNumber = (daysData ?? []).findIndex((d) => d.id === dayId) + 1;
  const secondaryColor = useThemeColor({}, 'icon');

  const { data: exercisesData, isLoading } = usePlanExercises(dayId);
  const exercises = exercisesData ?? [];

  const { data: completedList } = useCompletedExercises(dayId);
  const completedIds = new Set(completedList);
  const toggleCompleted = useToggleExerciseCompleted(dayId);
  const [activeId, setActiveId] = useState<string>();
  const effectiveActiveId = activeId ?? exercises[0]?.id;

  function openExercise(planExerciseId: string) {
    router.push({ pathname: '/workout/[planId]/[dayId]/[planExerciseId]', params: { planId, dayId, planExerciseId } });
  }

  function startNextExercise() {
    const next = exercises.find((exercise) => !completedIds.has(exercise.id));
    if (!next) return;
    setActiveId(next.id);
    openExercise(next.id);
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          // Falls back to a plain string since the custom headerTitle below
          // (used for this screen's own two-line title) leaves nothing for
          // a screen pushed on top to show as its back button label.
          headerBackTitle: day?.name ?? 'Workout',
          headerTitle: () => (
            <View style={styles.headerTitle}>
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {day?.name ?? 'Workout'}
              </ThemedText>
              <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                Day {dayNumber} · {exercises.length} exercise{exercises.length === 1 ? '' : 's'}
              </ThemedText>
            </View>
          ),
        }}
      />
      {isLoading ? (
        <LoadingState />
      ) : exercises.length === 0 ? (
        <EmptyState title="No exercises yet" description="This day has no exercises yet." />
      ) : (
        <>
          <View style={styles.progressRow}>
            <ProgressBar
              progress={exercises.length > 0 ? completedIds.size / exercises.length : 0}
              style={styles.progressTrack}
            />
            <ThemedText style={[styles.progressLabel, { color: secondaryColor }]}>
              {completedIds.size}/{exercises.length}
            </ThemedText>
          </View>
          <ScrollView contentContainerStyle={styles.list}>
            {exercises.map((exercise, index) => (
              <ExerciseSessionRow
                key={exercise.id}
                index={index}
                item={exercise}
                active={exercise.id === effectiveActiveId}
                completed={completedIds.has(exercise.id)}
                onOpen={() => openExercise(exercise.id)}
                onToggle={() => toggleCompleted(exercise.id)}
              />
            ))}
            <StartWorkoutButton
              label="Start next exercise"
              onPress={startNextExercise}
              testID="start-next-exercise-button"
            />
          </ScrollView>
        </>
      )}
    </ThemedView>
  );
}

function ExerciseSessionRow({
  index,
  item,
  active,
  completed,
  onOpen,
  onToggle,
}: {
  index: number;
  item: PlanExerciseWithExercise;
  active: boolean;
  completed: boolean;
  onOpen: () => void;
  onToggle: () => void;
}) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');

  const photo = DAY_CARD_PHOTOS[item.exercise.muscle_group] ?? DAY_CARD_PHOTOS.full_body;

  return (
    <Pressable
      onPress={onOpen}
      style={[
        styles.row,
        { backgroundColor: cardBackground, borderColor },
        active && { borderColor: tint, borderWidth: 2 },
      ]}
      testID={`session-exercise-row-${item.id}`}>
      <View style={[styles.numberCircle, { borderColor: tint }]}>
        <ThemedText style={[styles.numberText, { color: tint }]}>{index + 1}</ThemedText>
      </View>
      <Image source={photo} style={styles.thumbnail} contentFit="cover" />
      <View style={styles.rowContent}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {item.exercise.name_en}
        </ThemedText>
        <ThemedText style={[styles.meta, { color: secondaryColor }]}>
          {item.target_sets} sets × {item.target_reps} reps
        </ThemedText>
        {item.target_weight_kg ? (
          <ThemedText style={[styles.meta, { color: secondaryColor }]}>{item.target_weight_kg} kg</ThemedText>
        ) : null}
      </View>
      <Pressable onPress={onToggle} hitSlop={10} testID={`session-exercise-row-${item.id}-toggle`}>
        <IconSymbol
          name={completed ? 'checkmark.circle' : 'circle'}
          size={26}
          color={completed ? tint : secondaryColor}
        />
      </Pressable>
      <IconSymbol name="chevron.right" size={18} color={secondaryColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerTitle: { alignItems: 'center' },
  headerSubtitle: { fontSize: 12 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  progressTrack: { flex: 1 },
  progressLabel: { fontSize: 13, fontWeight: '600' },

  list: { padding: 16, gap: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
  },
  numberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: { fontSize: 14, fontWeight: '700' },
  thumbnail: { width: 64, height: 64, borderRadius: 12 },
  rowContent: { flex: 1, gap: 3 },
  meta: { fontSize: 13 },
});
