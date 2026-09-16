import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useOpenContextMenu } from '@/components/context-menu';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { Pill } from '@/components/pill';
import { SectionLabel } from '@/components/section-label';
import { StartWorkoutButton } from '@/components/start-workout-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { MINUTES_PER_EXERCISE } from '@/components/workout-day-card';
import { usePlanDays } from '@/hooks/queries/use-plan-days';
import { usePlans } from '@/hooks/queries/use-plans';
import { useWorkoutSessions, WORKOUT_HISTORY_FILTERS, type WorkoutHistoryFilter } from '@/hooks/queries/use-workout-sessions';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DAY_CARD_PHOTOS, EMPTY_WORKOUT_DAY_PHOTO } from '@/lib/day-card-photos';
import { planCardBackground } from '@/lib/plan-card-photos';
import type { PlanDayWithExerciseCount } from '@/lib/types';
import type { Tables } from '@workout-app/shared';

type WorkoutTab = 'plans' | 'history';

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const secondaryColor = useThemeColor({}, 'icon');
  // The "Workout complete!" screen's Save button sets `tab=history` so it
  // lands straight there instead of back on My plans — the param doubles as
  // this screen's own tab state, so switching tabs just rewrites it rather
  // than tracking a parallel piece of local state that could drift from it.
  const { tab } = useLocalSearchParams<{ tab?: WorkoutTab }>();
  const activeTab: WorkoutTab = tab === 'history' ? 'history' : 'plans';

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}>
        <View style={styles.greeting}>
          <ThemedText type="title">Workout</ThemedText>
          <ThemedText style={[styles.greetingSubtitle, { color: secondaryColor }]}>
            Your training day is ready. Let&apos;s get to work 💪
          </ThemedText>
        </View>

        <TabSwitcher active={activeTab} onChange={(next) => router.setParams({ tab: next })} />

        {activeTab === 'plans' ? <MyPlansTab /> : <WorkoutHistoryTab />}
      </ScrollView>
    </ThemedView>
  );
}

function TabSwitcher({ active, onChange }: { active: WorkoutTab; onChange: (tab: WorkoutTab) => void }) {
  return (
    <View style={styles.tabSwitcher}>
      <TabSwitcherOption
        label="My plans"
        active={active === 'plans'}
        onPress={() => onChange('plans')}
        testID="workout-tab-plans"
      />
      <TabSwitcherOption
        label="Workout history"
        active={active === 'history'}
        onPress={() => onChange('history')}
        testID="workout-tab-history"
      />
    </View>
  );
}

function TabSwitcherOption({
  label,
  active,
  onPress,
  testID,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const tint = useThemeColor({}, 'tint');
  const secondaryColor = useThemeColor({}, 'icon');

  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabSwitcherOption, active && { backgroundColor: `${tint}26` }]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      testID={testID}>
      <ThemedText style={[styles.tabSwitcherLabel, { color: active ? tint : secondaryColor }]}>{label}</ThemedText>
    </Pressable>
  );
}

function MyPlansTab() {
  const router = useRouter();
  const { data: plansData, isLoading: plansLoading } = usePlans();
  const plans = plansData ?? [];
  const activePlan = plans.find((plan) => plan.is_active);

  const { data: daysData, isLoading: daysLoading } = usePlanDays(activePlan?.id ?? '');
  // No per-exercise workout history is read here (see the Workout History
  // tab for that) — once a day can be marked complete, this should pick the
  // day after the last completed one instead, wrapping to the first.
  const nextDay = daysData?.[0];

  return (
    <>
      {plansLoading ? (
        <LoadingState />
      ) : !activePlan ? (
        <EmptyState
          title="No active plan"
          description="Set a plan as active from the Plans tab to see your next workout here."
        />
      ) : daysLoading ? (
        <LoadingState />
      ) : !nextDay ? (
        <EmptyState title="No days yet" description={`Add a day to "${activePlan.name}" to start training.`} />
      ) : (
        <NextWorkoutCard
          day={nextDay}
          onPress={() =>
            router.push({
              pathname: '/workout/[planId]/[dayId]',
              params: { planId: activePlan.id, dayId: nextDay.id },
            })
          }
        />
      )}

      <View style={styles.section}>
        <SectionLabel>My workout plans</SectionLabel>
        <View style={styles.plansList}>
          {plans.map((plan) => (
            <PlanRow
              key={plan.id}
              plan={plan}
              onPress={() => router.push({ pathname: '/workout/[planId]', params: { planId: plan.id } })}
            />
          ))}
        </View>
      </View>
    </>
  );
}

const HISTORY_FILTER_LABELS: Record<WorkoutHistoryFilter, string> = {
  all: 'All workouts',
  week: 'This week',
  month: 'This month',
};

function WorkoutHistoryTab() {
  const secondaryColor = useThemeColor({}, 'icon');
  const [filter, setFilter] = useState<WorkoutHistoryFilter>('all');
  const { data: sessionsData, isLoading } = useWorkoutSessions(filter);
  const sessions = sessionsData ?? [];
  const groups = groupSessionsByDate(sessions);

  return (
    <View style={styles.section}>
      <HistoryFilterButton value={filter} onChange={setFilter} />

      {isLoading ? (
        <LoadingState />
      ) : sessions.length === 0 ? (
        <EmptyState title="No workouts yet" description="Finish a workout to see it here." />
      ) : (
        <View style={styles.historyGroups}>
          {groups.map((group) => (
            <View key={group.dateLabel} style={styles.historyGroup}>
              <ThemedText type="defaultSemiBold" style={[styles.historyDateLabel, { color: secondaryColor }]}>
                {group.dateLabel}
              </ThemedText>
              <View style={styles.plansList}>
                {group.sessions.map((session) => (
                  <WorkoutHistoryRow key={session.id} session={session} />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function HistoryFilterButton({
  value,
  onChange,
}: {
  value: WorkoutHistoryFilter;
  onChange: (filter: WorkoutHistoryFilter) => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const openMenu = useOpenContextMenu();
  const anchorRef = useRef<View>(null);

  function openFilterMenu() {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      openMenu(
        { x, y, width, height },
        WORKOUT_HISTORY_FILTERS.map((option) => ({
          label: HISTORY_FILTER_LABELS[option],
          icon: 'calendar',
          onPress: () => onChange(option),
          testID: `workout-history-filter-${option}`,
        }))
      );
    });
  }

  return (
    <View ref={anchorRef} collapsable={false} style={styles.historyFilterAnchor}>
      <Pressable
        onPress={openFilterMenu}
        style={[styles.historyFilterButton, { backgroundColor: cardBackground }]}
        testID="workout-history-filter-button">
        <IconSymbol name="slider.horizontal.3" size={16} color={tint} />
        <ThemedText style={[styles.historyFilterLabel, { color: tint }]}>{HISTORY_FILTER_LABELS[value]}</ThemedText>
        <IconSymbol name="chevron.down" size={16} color={tint} />
      </Pressable>
    </View>
  );
}

const HISTORY_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function formatHistoryDate(iso: string) {
  const date = new Date(iso);
  return `${date.getDate()} ${HISTORY_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

// Sessions already arrive newest-first; this just clusters consecutive ones
// that landed on the same calendar day under one date header, per the
// mockup, without re-sorting anything.
function groupSessionsByDate(sessions: Tables<'workout_sessions'>[]) {
  const groups: { dateLabel: string; sessions: Tables<'workout_sessions'>[] }[] = [];
  for (const session of sessions) {
    const dateLabel = formatHistoryDate(session.completed_at);
    const currentGroup = groups.at(-1);
    if (currentGroup?.dateLabel === dateLabel) currentGroup.sessions.push(session);
    else groups.push({ dateLabel, sessions: [session] });
  }
  return groups;
}

// There's no per-session photo/muscle-group data to key off of (workout_sessions
// only stores the summary, not which exercises were done) — a stable hash of
// the session id at least keeps the same workout showing the same thumbnail
// across reloads, rather than reshuffling every render.
function pseudoRandomBackgroundIndex(seed: string) {
  return (parseInt(seed.slice(-2), 16) % 5) + 1;
}

function WorkoutHistoryRow({ session }: { session: Tables<'workout_sessions'> }) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondaryColor = useThemeColor({}, 'icon');
  const photo = planCardBackground(pseudoRandomBackgroundIndex(session.id));

  return (
    <View style={[styles.historyRow, { backgroundColor: cardBackground }]} testID={`workout-history-row-${session.id}`}>
      <Image source={photo} style={styles.historyRowImage} contentFit="cover" />
      <View style={styles.historyRowText}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {session.day_name}
        </ThemedText>
        <View style={styles.historyStatsRow}>
          <HistoryStat icon="dumbbell.fill" label={`${session.exercise_count} exercises`} />
          <ThemedText style={[styles.historyStatDivider, { color: secondaryColor }]}>|</ThemedText>
          <HistoryStat icon="clock" label={`${session.duration_minutes} min`} />
        </View>
        <View style={styles.historyStatsRow}>
          <HistoryStat icon="scalemass.fill" label={`${session.total_volume_kg.toLocaleString()} kg`} />
          <HistoryStat icon="flame.fill" label={`${session.calories_estimate} kcal`} />
        </View>
      </View>
      <IconSymbol name="chevron.right" size={16} color={secondaryColor} />
    </View>
  );
}

function HistoryStat({ icon, label }: { icon: ComponentProps<typeof IconSymbol>['name']; label: string }) {
  const secondaryColor = useThemeColor({}, 'icon');

  return (
    <View style={styles.historyStat}>
      <IconSymbol name={icon} size={13} color={secondaryColor} />
      <ThemedText style={[styles.historyStatText, { color: secondaryColor }]}>{label}</ThemedText>
    </View>
  );
}

function NextWorkoutCard({ day, onPress }: { day: PlanDayWithExerciseCount; onPress: () => void }) {
  const cardBackground = useThemeColor({}, 'cardBackground');

  const isEmpty = day.exerciseCount === 0;
  const photo = isEmpty
    ? EMPTY_WORKOUT_DAY_PHOTO
    : (DAY_CARD_PHOTOS[day.muscleGroups[0]] ?? DAY_CARD_PHOTOS.full_body);
  const durationMinutes = day.exerciseCount * MINUTES_PER_EXERCISE;

  return (
    <View style={[styles.hero, { backgroundColor: cardBackground }]}>
      <Pressable onPress={onPress} testID="workout-next-day-card">
        <View style={styles.heroPhoto}>
          <Image source={photo} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.heroGradient} />
          <View style={styles.heroBadgeAnchor}>
            <Pill label="Today" />
          </View>
          <View style={styles.heroChevronButton}>
            <IconSymbol name="chevron.right" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.heroContent}>
            <ThemedText style={styles.heroTitle} numberOfLines={2}>
              {day.name}
            </ThemedText>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStat}>
                <IconSymbol name="dumbbell.fill" size={14} color="rgba(255,255,255,0.85)" />
                <ThemedText style={styles.heroStatText}>
                  {day.exerciseCount} exercise{day.exerciseCount === 1 ? '' : 's'}
                </ThemedText>
              </View>
              <ThemedText style={styles.heroStatDivider}>|</ThemedText>
              <View style={styles.heroStat}>
                <IconSymbol name="clock" size={14} color="rgba(255,255,255,0.85)" />
                <ThemedText style={styles.heroStatText}>{durationMinutes} min</ThemedText>
              </View>
            </View>
          </View>
        </View>
      </Pressable>

      <View style={styles.heroButtonWrapper}>
        <StartWorkoutButton onPress={onPress} testID="workout-start-button" />
      </View>
    </View>
  );
}

function PlanRow({ plan, onPress }: { plan: Tables<'workout_plans'>; onPress: () => void }) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondaryColor = useThemeColor({}, 'icon');
  const { data: daysData } = usePlanDays(plan.id);
  const dayCount = daysData?.length ?? 0;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.planRow, { backgroundColor: cardBackground }]}
      testID={`workout-plan-row-${plan.id}`}>
      <Image source={planCardBackground(plan.background_image_index)} style={styles.planRowImage} contentFit="cover" />
      <View style={styles.planRowText}>
        <ThemedText type="defaultSemiBold" numberOfLines={1}>
          {plan.name}
        </ThemedText>
        <ThemedText style={[styles.planRowSubtitle, { color: secondaryColor }]}>
          {dayCount} day{dayCount === 1 ? '' : 's'}/week
        </ThemedText>
      </View>
      <IconSymbol name="chevron.right" size={16} color={secondaryColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100, gap: 28 },
  greeting: { gap: 6 },
  greetingSubtitle: { fontSize: 16, lineHeight: 22 },

  hero: { borderRadius: 20, overflow: 'hidden' },
  heroPhoto: { height: 320, justifyContent: 'flex-end' },
  heroGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  heroBadgeAnchor: { position: 'absolute', top: 16, left: 16 },
  heroChevronButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: { padding: 16, gap: 8 },
  heroTitle: { color: '#FFFFFF', fontSize: 26, lineHeight: 30, fontWeight: '700' },
  heroStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroStatText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  heroStatDivider: { color: 'rgba(255,255,255,0.4)' },
  heroButtonWrapper: { margin: 16 },

  section: { gap: 12 },
  plansList: { gap: 12 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14 },
  planRowImage: { width: 52, height: 52, borderRadius: 10 },
  planRowText: { flex: 1, gap: 2 },
  planRowSubtitle: { fontSize: 13 },

  tabSwitcher: {
    flexDirection: 'row',
    gap: 4,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(128,128,128,0.14)',
  },
  tabSwitcherOption: { flex: 1, paddingVertical: 10, borderRadius: 999, alignItems: 'center' },
  tabSwitcherLabel: { fontSize: 14, fontWeight: '600' },

  historyFilterAnchor: { alignSelf: 'flex-start' },
  historyFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  historyFilterLabel: { fontSize: 14, fontWeight: '600' },

  historyGroups: { gap: 20 },
  historyGroup: { gap: 12 },
  historyDateLabel: { fontSize: 13 },

  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 14 },
  historyRowImage: { width: 56, height: 56, borderRadius: 10 },
  historyRowText: { flex: 1, gap: 4 },
  historyStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  historyStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyStatText: { fontSize: 12 },
  historyStatDivider: { fontSize: 12 },
});
