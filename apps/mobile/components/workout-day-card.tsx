import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Ref } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';
import { DAY_CARD_PHOTOS, EMPTY_WORKOUT_DAY_PHOTO } from '@/lib/day-card-photos';
import type { PlanDayWithExerciseCount } from '@/lib/types';

// A day with no exercises yet has no muscle group to pick a photo from, so
// falls back to a dedicated "not configured yet" shot instead of a random one.
const MINUTES_PER_EXERCISE = 10;

export function WorkoutDayCard({
  dayNumber,
  workoutDay,
  onPress,
  onLongPress,
  onMenuPress,
  menuButtonRef,
  testID,
  menuTestID,
}: {
  dayNumber: number;
  workoutDay: PlanDayWithExerciseCount;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
  menuButtonRef?: Ref<View>;
  testID?: string;
  menuTestID?: string;
}) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const secondaryColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const tint = useThemeColor({}, 'tint');

  const isEmpty = workoutDay.exerciseCount === 0;
  const photo = isEmpty
    ? EMPTY_WORKOUT_DAY_PHOTO
    : (DAY_CARD_PHOTOS[workoutDay.muscleGroups[0]] ?? DAY_CARD_PHOTOS.full_body);
  const durationMinutes = workoutDay.exerciseCount * MINUTES_PER_EXERCISE;

  return (
    <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
      <Pressable onPress={onPress} onLongPress={onLongPress} testID={testID}>
        <View style={styles.header}>
          <Image source={photo} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient
            colors={[cardBackground, cardBackground, 'transparent']}
            locations={[0, 0.38, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['transparent', cardBackground]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[StyleSheet.absoluteFillObject, styles.verticalFade]}
          />
          <View style={styles.headerContent}>
            <ThemedText style={styles.dayLabel}>DAY {String(dayNumber).padStart(2, '0')}</ThemedText>
            <ThemedText style={styles.name} numberOfLines={2}>
              {workoutDay.name}
            </ThemedText>
            <View style={styles.tagsRow}>
              {isEmpty ? (
                <View style={[styles.tag, styles.addExercisesTag, { borderColor: tint }]}>
                  <ThemedText style={[styles.tagText, { color: tint }]}>ADD EXERCISES</ThemedText>
                </View>
              ) : (
                workoutDay.muscleGroups.map((group) => (
                  <View key={group} style={styles.tag}>
                    <ThemedText style={styles.tagText}>{group.replace('_', ' ')}</ThemedText>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: borderColor }]} />

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <IconSymbol name="dumbbell.fill" size={15} color={secondaryColor} />
            <ThemedText style={[styles.statText, { color: textColor }]}>
              {workoutDay.exerciseCount} exercise{workoutDay.exerciseCount === 1 ? '' : 's'}
            </ThemedText>
          </View>
          <View style={styles.stat}>
            <IconSymbol name="clock" size={15} color={secondaryColor} />
            <ThemedText style={[styles.statText, { color: textColor }]}>
              ~{durationMinutes} min
            </ThemedText>
          </View>
          <View style={styles.statSpacer} />
          <IconSymbol name="chevron.right" size={16} color={secondaryColor} />
        </View>
      </Pressable>

      {onMenuPress ? (
        <View ref={menuButtonRef} collapsable={false} style={styles.menuButtonAnchor}>
          <Pressable onPress={onMenuPress} hitSlop={10} style={styles.menuButton} testID={menuTestID}>
            <IconSymbol name="ellipsis" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  header: { position: 'relative' },
  verticalFade: { top: '55%' },
  headerContent: { maxWidth: '58%', padding: 16, gap: 6 },
  dayLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  name: { color: '#FFFFFF', fontSize: 21, lineHeight: 25, fontWeight: '700' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  tag: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addExercisesTag: { backgroundColor: 'rgba(0,0,0,0.2)' },
  tagText: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 16, paddingTop: 12 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13 },
  statSpacer: { flex: 1 },
  menuButtonAnchor: { position: 'absolute', top: 10, right: 10 },
  menuButton: { padding: 6 },
});
