import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
import { useThemeColor } from '@/hooks/use-theme-color';
import { DAY_CARD_PHOTOS, EMPTY_WORKOUT_DAY_PHOTO } from '@/lib/day-card-photos';
import { planCardBackground } from '@/lib/plan-card-photos';
import type { PlanDayWithExerciseCount } from '@/lib/types';
import type { Tables } from '@workout-app/shared';

export default function WorkoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const secondaryColor = useThemeColor({}, 'icon');

  const { data: plansData, isLoading: plansLoading } = usePlans();
  const plans = plansData ?? [];
  const activePlan = plans.find((plan) => plan.is_active);

  const { data: daysData, isLoading: daysLoading } = usePlanDays(activePlan?.id ?? '');
  // No workout history exists yet (see the plans-active-plan migration's
  // comment on this) — once a day can be marked complete, this should pick
  // the day after the last completed one instead, wrapping to the first.
  const nextDay = daysData?.[0];

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
          <EmptyState
            title="No days yet"
            description={`Add a day to "${activePlan.name}" to start training.`}
          />
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
      </ScrollView>
    </ThemedView>
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
});
