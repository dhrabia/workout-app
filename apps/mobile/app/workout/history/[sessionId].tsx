import { useQueryClient } from '@tanstack/react-query';
import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState, type ComponentProps } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { NavArrow } from '@/components/nav-arrow';
import { SectionLabel } from '@/components/section-label';
import { StartWorkoutButton } from '@/components/start-workout-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FieldCard } from '@/components/ui/field-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePlanDays } from '@/hooks/queries/use-plan-days';
import { confirmStartOverOtherDay, hasSessionProgress } from '@/hooks/queries/use-workout-session';
import { useWorkoutSessionDetail, type WorkoutSessionDetail } from '@/hooks/queries/use-workout-sessions';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatMuscleGroup } from '@/lib/muscle-icons';
import {
  formatDuration,
  formatKg,
  formatWorkoutDateTime,
  setsVolumeKg,
  workoutTotals,
  type WorkoutSummaryExercise,
} from '@/lib/workout-summary';

// Matches the day session screen's fixed footer (button + its top padding),
// so the scroll content clears the Repeat workout button.
const FOOTER_HEIGHT = 90;
const SCREEN_PADDING = 16;
// How much of each neighbouring exercise card peeks in at the screen edges,
// hinting that the carousel scrolls sideways.
const CARD_PEEK = 20;
const CARD_GAP = 12;

// Workout Summary (SCRUM-9): one completed workout from Workout → Workout
// history, with its overview stats and the exercises/sets logged at the time
// — never the plan's current targets, which may have changed since.
export default function WorkoutSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { data: session, isLoading, isPlaceholderData } = useWorkoutSessionDetail(sessionId);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Workout Summary', headerBackTitle: 'Workout' }} />
      {isLoading && !session ? (
        <LoadingState />
      ) : !session ? (
        <EmptyState title="Workout not found" description="This workout is no longer in your history." />
      ) : (
        <WorkoutSummary session={session} exercisesLoading={isPlaceholderData} />
      )}
    </ThemedView>
  );
}

function WorkoutSummary({ session, exercisesLoading }: { session: WorkoutSessionDetail; exercisesLoading: boolean }) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const repeatWorkout = useRepeatWorkout(session);

  // Sessions saved before per-exercise details were recorded have no
  // exercises to add up — fall back to the totals saved on the session row.
  const hasExercises = session.exercises.length > 0;
  const totals = hasExercises
    ? workoutTotals(session.exercises)
    : { totalSets: session.total_sets, totalVolumeKg: session.total_volume_kg };

  return (
    <>
      <ScrollView
        directionalLockEnabled
        contentContainerStyle={[styles.content, { paddingBottom: FOOTER_HEIGHT + insets.bottom + SCREEN_PADDING }]}
        testID="workout-summary-scroll">
        <OverviewCard
          name={session.day_name}
          planName={session.plan_name}
          completedAt={session.completed_at}
          durationMinutes={session.duration_minutes}
          totalVolumeKg={totals.totalVolumeKg}
          totalSets={totals.totalSets}
        />

        <View style={styles.section}>
          <SectionLabel count={hasExercises ? session.exercises.length : undefined}>Exercises</SectionLabel>
          {exercisesLoading ? (
            <LoadingState />
          ) : hasExercises ? (
            <ExerciseCarousel exercises={session.exercises} />
          ) : (
            <View testID="workout-summary-empty">
              <EmptyState
                title="No exercise details"
                description="Exercises and sets weren't recorded for this workout."
              />
            </View>
          )}
        </View>
      </ScrollView>

      <BlurView
        intensity={40}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        style={[styles.footer, { paddingBottom: insets.bottom + SCREEN_PADDING }]}>
        <StartWorkoutButton
          label="Repeat workout"
          icon="arrow.2.squarepath"
          onPress={repeatWorkout}
          testID="workout-summary-repeat-button"
        />
      </BlurView>
    </>
  );
}

// Starts this workout's plan day again through the regular session flow
// (the same screen "Start workout" opens), from 0 completed exercises. The
// history entry itself is never touched. Session progress lives per plan day
// (see use-workout-session.ts), so any day of the plan with unsaved progress —
// this one included — is confirmed and cleared first, exactly like starting
// a different day from the Workout tab.
function useRepeatWorkout(session: WorkoutSessionDetail) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: daysData } = usePlanDays(session.plan_id ?? '');

  return () => {
    const { plan_id: planId, plan_day_id: dayId } = session;
    const day = daysData?.find((entry) => entry.id === dayId);
    if (!planId || !dayId || !day) {
      Alert.alert(
        "Can't repeat this workout",
        'The plan day this workout came from no longer exists.'
      );
      return;
    }

    const goToDay = () => router.push({ pathname: '/workout/[planId]/[dayId]', params: { planId, dayId } });
    const dayInProgress = (daysData ?? []).find((entry) => hasSessionProgress(queryClient, entry.id));
    if (dayInProgress) confirmStartOverOtherDay(queryClient, dayInProgress.id, goToDay);
    else goToDay();
  };
}

function OverviewCard({
  name,
  planName,
  completedAt,
  durationMinutes,
  totalVolumeKg,
  totalSets,
}: {
  name: string;
  planName: string;
  completedAt: string;
  durationMinutes: number;
  totalVolumeKg: number;
  totalSets: number;
}) {
  const secondaryColor = useThemeColor({}, 'icon');

  return (
    <FieldCard style={styles.overviewCard} testID="workout-summary-overview">
      <View style={styles.overviewHeader}>
        <ThemedText type="subtitle" numberOfLines={2} testID="workout-summary-name">
          {name}
        </ThemedText>
        <ThemedText style={[styles.overviewPlan, { color: secondaryColor }]} numberOfLines={1}>
          {planName}
        </ThemedText>
        <View style={styles.overviewDateRow}>
          <IconSymbol name="calendar" size={14} color={secondaryColor} />
          <ThemedText style={[styles.overviewDate, { color: secondaryColor }]} testID="workout-summary-date">
            {formatWorkoutDateTime(completedAt)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.statsRow}>
        <OverviewStat
          icon="clock"
          label="Duration"
          value={formatDuration(durationMinutes)}
          testID="workout-summary-duration"
        />
        <View style={[styles.statDivider, { backgroundColor: secondaryColor }]} />
        <OverviewStat
          icon="scalemass.fill"
          label="Total volume"
          value={formatKg(totalVolumeKg)}
          testID="workout-summary-total-volume"
        />
        <View style={[styles.statDivider, { backgroundColor: secondaryColor }]} />
        <OverviewStat
          icon="square.stack.fill"
          label="Total sets"
          value={String(totalSets)}
          testID="workout-summary-total-sets"
        />
      </View>
    </FieldCard>
  );
}

function OverviewStat({
  icon,
  label,
  value,
  testID,
}: {
  icon: ComponentProps<typeof IconSymbol>['name'];
  label: string;
  value: string;
  testID: string;
}) {
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');

  return (
    <View style={styles.stat}>
      <View style={styles.statLabelRow}>
        <IconSymbol name={icon} size={14} color={tint} />
        <ThemedText style={[styles.statLabel, { color: secondaryColor }]} numberOfLines={1}>
          {label}
        </ThemedText>
      </View>
      <ThemedText type="defaultSemiBold" style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit testID={testID}>
        {value}
      </ThemedText>
    </View>
  );
}

// One exercise card at a time, snapping per card, with the neighbours peeking
// in at the edges. The dots and arrows below drive (and follow) the same
// index, so swiping and tapping can't disagree about which card is active.
function ExerciseCarousel({ exercises }: { exercises: WorkoutSummaryExercise[] }) {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<WorkoutSummaryExercise>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const sideInset = SCREEN_PADDING + CARD_PEEK;
  const cardWidth = width - sideInset * 2;
  const interval = cardWidth + CARD_GAP;
  const lastIndex = exercises.length - 1;

  function indexForOffset(offsetX: number) {
    return Math.min(Math.max(Math.round(offsetX / interval), 0), lastIndex);
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = indexForOffset(event.nativeEvent.contentOffset.x);
    if (index !== activeIndex) setActiveIndex(index);
  }

  function goTo(index: number) {
    const target = Math.min(Math.max(index, 0), lastIndex);
    setActiveIndex(target);
    listRef.current?.scrollToOffset({ offset: target * interval, animated: true });
  }

  return (
    <View style={styles.carousel}>
      <FlatList
        ref={listRef}
        data={exercises}
        keyExtractor={(exercise) => exercise.id}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={interval}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: cardWidth, offset: interval * index, index })}
        style={styles.carouselList}
        contentContainerStyle={{ paddingHorizontal: sideInset }}
        ItemSeparatorComponent={CardGap}
        testID="workout-summary-exercises"
        renderItem={({ item, index }) => (
          <ExerciseCard exercise={item} position={index + 1} count={exercises.length} width={cardWidth} />
        )}
      />

      <View style={styles.pagerRow}>
        <NavArrow
          direction="left"
          disabled={activeIndex === 0}
          onPress={() => goTo(activeIndex - 1)}
          testID="workout-summary-exercise-prev"
        />
        <PaginationDots count={exercises.length} activeIndex={activeIndex} onSelect={goTo} />
        <NavArrow
          direction="right"
          disabled={activeIndex === lastIndex}
          onPress={() => goTo(activeIndex + 1)}
          testID="workout-summary-exercise-next"
        />
      </View>
    </View>
  );
}

function CardGap() {
  return <View style={{ width: CARD_GAP }} />;
}

function PaginationDots({
  count,
  activeIndex,
  onSelect,
}: {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const inactive = useThemeColor({}, 'textDisabled');

  return (
    <View style={styles.dots} testID="workout-summary-dots">
      {Array.from({ length: count }, (_, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={index}
            onPress={() => onSelect(index)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`Exercise ${index + 1} of ${count}`}
            accessibilityState={{ selected: active }}
            style={[styles.dot, active && styles.dotActive, { backgroundColor: active ? tint : inactive }]}
            testID={`workout-summary-dot-${index}`}
          />
        );
      })}
    </View>
  );
}

function ExerciseCard({
  exercise,
  position,
  count,
  width,
}: {
  exercise: WorkoutSummaryExercise;
  position: number;
  count: number;
  width: number;
}) {
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');
  const borderColor = useThemeColor({}, 'border');
  const setCount = exercise.sets.length;
  const testID = `workout-summary-exercise-${position - 1}`;

  return (
    <FieldCard style={[styles.exerciseCard, { width }]} testID={testID}>
      <View style={styles.exerciseHeader}>
        <ThemedText type="defaultSemiBold" style={styles.exerciseName} numberOfLines={2}>
          {exercise.name}
        </ThemedText>
        <View style={[styles.positionBadge, { backgroundColor: `${tint}26` }]}>
          <ThemedText style={[styles.positionText, { color: tint }]} testID={`${testID}-position`}>
            {position} / {count}
          </ThemedText>
        </View>
      </View>

      <ThemedText style={[styles.exerciseMeta, { color: secondaryColor }]}>
        {setCount} set{setCount === 1 ? '' : 's'} completed
      </ThemedText>

      <View style={styles.muscleRow}>
        <ThemedText style={[styles.muscleLabel, { color: secondaryColor }]}>Primary</ThemedText>
        <View style={[styles.muscleChip, { borderColor: tint }]}>
          <ThemedText style={[styles.muscleChipText, { color: tint }]}>
            {formatMuscleGroup(exercise.muscleGroup)}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.table, { borderColor }]}>
        <View style={[styles.tableRow, styles.tableHeader, { borderColor }]}>
          <ThemedText style={[styles.tableCell, styles.tableHeaderText, { color: secondaryColor }]}>Set</ThemedText>
          <ThemedText style={[styles.tableCell, styles.tableHeaderText, { color: secondaryColor }]}>
            Weight (kg)
          </ThemedText>
          <ThemedText style={[styles.tableCell, styles.tableHeaderText, { color: secondaryColor }]}>Reps</ThemedText>
        </View>
        {exercise.sets.length === 0 ? (
          <ThemedText style={[styles.noSets, { color: secondaryColor }]}>No sets logged</ThemedText>
        ) : (
          exercise.sets.map((set, index) => (
            <View
              key={index}
              style={[styles.tableRow, index > 0 && styles.tableRowDivider, { borderColor }]}
              testID={`${testID}-set-${index}`}>
              <ThemedText style={styles.tableCell}>{index + 1}</ThemedText>
              <ThemedText style={styles.tableCell}>{set.weight_kg.toLocaleString()}</ThemedText>
              <ThemedText style={styles.tableCell}>{set.reps}</ThemedText>
            </View>
          ))
        )}
      </View>

      <View style={styles.volumeRow}>
        <ThemedText style={[styles.volumeLabel, { color: secondaryColor }]}>Total volume</ThemedText>
        <ThemedText type="defaultSemiBold" style={{ color: tint }} testID={`${testID}-volume`}>
          {formatKg(setsVolumeKg(exercise.sets))}
        </ThemedText>
      </View>
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SCREEN_PADDING, gap: 24 },
  section: { gap: 12 },

  overviewCard: { gap: 16 },
  overviewHeader: { gap: 4 },
  overviewPlan: { fontSize: 14 },
  overviewDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  overviewDate: { fontSize: 14 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 18 },
  statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', opacity: 0.4 },

  carousel: { gap: 16 },
  // Bleeds to the screen edges (the scroll content is padded) so the
  // neighbouring cards can peek in from beyond the padding.
  carouselList: { marginHorizontal: -SCREEN_PADDING },

  exerciseCard: { flex: 1, gap: 12 },
  exerciseHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  exerciseName: { flex: 1, fontSize: 18, lineHeight: 24 },
  positionBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  positionText: { fontSize: 13, fontWeight: '700' },
  exerciseMeta: { fontSize: 14 },
  muscleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  muscleLabel: { fontSize: 13, fontWeight: '600' },
  muscleChip: { borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, paddingVertical: 3 },
  muscleChipText: { fontSize: 13, fontWeight: '600' },

  table: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12 },
  tableHeader: { borderBottomWidth: StyleSheet.hairlineWidth, backgroundColor: 'rgba(128,128,128,0.08)' },
  tableRowDivider: { borderTopWidth: StyleSheet.hairlineWidth },
  tableCell: { flex: 1, textAlign: 'center', fontSize: 15 },
  tableHeaderText: { fontSize: 12, fontWeight: '600' },
  noSets: { textAlign: 'center', paddingVertical: 12, fontSize: 14 },
  volumeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' },
  volumeLabel: { fontSize: 14, fontWeight: '600' },

  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { width: 20 },

  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: SCREEN_PADDING,
    overflow: 'hidden',
  },
});
