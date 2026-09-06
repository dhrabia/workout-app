import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useBodyMeasurements } from '@/hooks/queries/use-body-measurements';
import { useProfile } from '@/hooks/queries/use-profile';
import { useWeightLogs } from '@/hooks/queries/use-weight-logs';
import { useThemeColor } from '@/hooks/use-theme-color';
import { calculateBmi, getBmiCategory } from '@/lib/bmi';
import { MEASUREMENT_FIELDS } from '@/lib/body-measurement-fields';
import { getCurrentWeight } from '@/lib/weight';
import type { Tables } from '@workout-app/shared';

function formatWeight(kg: number) {
  return kg.toFixed(1);
}

// How far current sits between the first-ever log and the target, 0-1.
function computeProgress(start: number, current: number, target: number) {
  if (start === target) return 1;
  return Math.min(1, Math.max(0, (start - current) / (start - target)));
}

export default function BodyScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: weightLogs } = useWeightLogs();
  const { data: measurements } = useBodyMeasurements();

  const currentWeight = getCurrentWeight(weightLogs);
  const startWeight = weightLogs?.[0]?.weight_kg;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Body' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <WeightHero
          currentWeight={currentWeight}
          startWeight={startWeight}
          targetWeight={profile?.target_weight_kg}
          onLogWeight={() => router.push('/body/log-weight')}
          onSetTarget={() => router.push('/profile/edit')}
        />

        <View style={styles.section}>
          <SectionLabel>Weight progress</SectionLabel>
          <WeightProgressCard history={weightLogs} />
        </View>

        <View style={styles.section}>
          <SectionLabel>BMI</SectionLabel>
          <BmiCard weightKg={currentWeight} heightCm={profile?.height_cm} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <SectionLabel>Body measurements</SectionLabel>
            <EditMeasurementsAction onPress={() => router.push('/body/measurements')} />
          </View>
          <MeasurementsGrid measurements={measurements} />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function WeightHero({
  currentWeight,
  startWeight,
  targetWeight,
  onLogWeight,
  onSetTarget,
}: {
  currentWeight: number | undefined;
  startWeight: number | undefined;
  targetWeight: number | null | undefined;
  onLogWeight: () => void;
  onSetTarget: () => void;
}) {
  const secondary = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');
  const track = useThemeColor({}, 'cardElevated');

  if (currentWeight == null) {
    return (
      <View style={styles.hero}>
        <ThemedText type="subtitle">No weight logged yet</ThemedText>
        <ThemedText style={[styles.heroHint, { color: secondary }]}>
          Log your weight to start tracking your progress.
        </ThemedText>
        <HeroAction label="Log weight" onPress={onLogWeight} />
      </View>
    );
  }

  const diff = targetWeight != null ? currentWeight - targetWeight : null;
  const reached = diff != null && Math.abs(diff) < 0.05;
  const progress =
    targetWeight != null && startWeight != null
      ? computeProgress(startWeight, currentWeight, targetWeight)
      : null;

  return (
    <View style={styles.hero}>
      <ThemedText style={styles.heroWeight}>{formatWeight(currentWeight)} kg</ThemedText>
      <ThemedText style={[styles.heroLabel, { color: secondary }]}>Current weight</ThemedText>

      {targetWeight != null ? (
        <>
          <ThemedText style={[styles.heroTarget, { color: secondary }]}>
            Target: {formatWeight(targetWeight)} kg
          </ThemedText>
          {progress != null && (
            <View
              style={[styles.progressTrack, { backgroundColor: track }]}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
              <View style={[styles.progressFill, { backgroundColor: tint, width: `${progress * 100}%` }]} />
            </View>
          )}
          <ThemedText style={[styles.heroRemaining, { color: secondary }]}>
            {reached ? 'Goal reached' : `${formatWeight(Math.abs(diff ?? 0))} kg to go`}
          </ThemedText>
        </>
      ) : (
        <Pressable
          onPress={onSetTarget}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Set a target weight"
          style={styles.heroAction}>
          <ThemedText style={[styles.heroActionText, { color: tint }]}>Set a target weight</ThemedText>
        </Pressable>
      )}

      <HeroAction label="Log weight" onPress={onLogWeight} />
    </View>
  );
}

function HeroAction({ label, onPress }: { label: string; onPress: () => void }) {
  const tint = useThemeColor({}, 'tint');
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={styles.heroAction}>
      <IconSymbol name="plus" size={13} color={tint} />
      <ThemedText style={[styles.heroActionText, { color: tint }]}>{label}</ThemedText>
    </Pressable>
  );
}

function WeightProgressCard({ history }: { history: Tables<'weight_logs'>[] | undefined }) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondary = useThemeColor({}, 'icon');

  if (!history || history.length === 0) {
    return (
      <View style={[styles.card, styles.emptyChartCard, { backgroundColor: cardBackground }]}>
        <ThemedText type="defaultSemiBold">No weight history yet</ThemedText>
        <ThemedText style={[styles.emptyChartHint, { color: secondary }]}>
          Start tracking your weight to see your progress here.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.chartCard, { backgroundColor: cardBackground }]}>
      <WeightChart history={history} />
    </View>
  );
}

const CHART_HEIGHT = 160;
const CHART_TOP_PADDING = 12;
const CHART_BOTTOM_PADDING = 20;
const CHART_LEFT_PADDING = 38;
const CHART_DOT_SIZE = 8;
const CHART_LABEL_WIDTH = 40;
const CHART_MAX_POINTS = 12;

function WeightChart({ history }: { history: Tables<'weight_logs'>[] }) {
  const tint = useThemeColor({}, 'tint');
  const secondary = useThemeColor({}, 'icon');
  const axisColor = useThemeColor({}, 'border');
  const [width, setWidth] = useState(0);

  const points = history.slice(-CHART_MAX_POINTS);
  const weights = points.map((point) => point.weight_kg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  const plotHeight = CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING;
  const plotWidth = Math.max(0, width - CHART_LEFT_PADDING - CHART_DOT_SIZE);

  function xAt(index: number) {
    if (points.length === 1) return CHART_LEFT_PADDING + plotWidth / 2;
    return CHART_LEFT_PADDING + (index / (points.length - 1)) * plotWidth + CHART_DOT_SIZE / 2;
  }
  function yAt(weightKg: number) {
    return CHART_TOP_PADDING + (1 - (weightKg - min) / range) * plotHeight;
  }

  const labelIndexes =
    points.length <= 1 ? [0] : [0, Math.floor((points.length - 1) / 2), points.length - 1];
  // Weight axis ticks: just the extremes, or the single reading if the line is flat.
  const weightTicks = max === min ? [max] : [max, min];

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      style={styles.chart}
      onLayout={handleLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Weight trend chart. ${points.length} entries, from ${formatWeight(weights[0])} to ${formatWeight(weights.at(-1) ?? weights[0])} kilograms.`}>
      {width > 0 && (
        <>
          <View
            style={[
              styles.chartAxisY,
              { backgroundColor: axisColor, left: CHART_LEFT_PADDING, top: CHART_TOP_PADDING, height: plotHeight },
            ]}
          />
          <View
            style={[
              styles.chartAxisX,
              {
                backgroundColor: axisColor,
                left: CHART_LEFT_PADDING,
                top: CHART_TOP_PADDING + plotHeight,
                width: width - CHART_LEFT_PADDING,
              },
            ]}
          />
          {weightTicks.map((tick) => (
            <ThemedText
              key={tick}
              style={[styles.chartYLabel, { color: secondary, top: yAt(tick) - 7, width: CHART_LEFT_PADDING - 6 }]}>
              {formatWeight(tick)}
            </ThemedText>
          ))}
          {points.slice(1).map((point, index) => {
            const prev = points[index];
            const x1 = xAt(index);
            const y1 = yAt(prev.weight_kg);
            const x2 = xAt(index + 1);
            const y2 = yAt(point.weight_kg);
            const length = Math.hypot(x2 - x1, y2 - y1);
            const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
            return (
              <View
                key={point.id}
                style={[
                  styles.chartSegment,
                  {
                    backgroundColor: tint,
                    width: length,
                    left: (x1 + x2) / 2 - length / 2,
                    top: (y1 + y2) / 2 - 1,
                    transform: [{ rotate: `${angle}deg` }],
                  },
                ]}
              />
            );
          })}
          {points.map((point, index) => (
            <View
              key={point.id}
              style={[
                styles.chartDot,
                { backgroundColor: tint, left: xAt(index) - CHART_DOT_SIZE / 2, top: yAt(point.weight_kg) - CHART_DOT_SIZE / 2 },
              ]}
            />
          ))}
          {labelIndexes.map((index) => (
            <ThemedText
              key={index}
              style={[
                styles.chartLabel,
                {
                  color: secondary,
                  left: Math.max(
                    CHART_LEFT_PADDING,
                    Math.min(width - CHART_LABEL_WIDTH, xAt(index) - CHART_LABEL_WIDTH / 2)
                  ),
                },
              ]}>
              {new Date(points[index].logged_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </ThemedText>
          ))}
        </>
      )}
    </View>
  );
}

function BmiCard({
  weightKg,
  heightCm,
}: {
  weightKg: number | undefined;
  heightCm: number | null | undefined;
}) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondary = useThemeColor({}, 'icon');

  const bmi = weightKg != null && heightCm != null ? calculateBmi(weightKg, heightCm) : null;

  return (
    <View style={[styles.card, styles.bmiCard, { backgroundColor: cardBackground }]}>
      {bmi != null ? (
        <>
          <ThemedText
            style={styles.bmiValue}
            accessibilityLabel={`Body mass index ${bmi.toFixed(1)}, ${getBmiCategory(bmi)}`}>
            {bmi.toFixed(1)}
          </ThemedText>
          <ThemedText style={{ color: secondary }}>{getBmiCategory(bmi)}</ThemedText>
        </>
      ) : (
        <ThemedText style={[styles.bmiHint, { color: secondary }]}>
          Add your weight and height to see your BMI.
        </ThemedText>
      )}
    </View>
  );
}

function EditMeasurementsAction({ onPress }: { onPress: () => void }) {
  const tint = useThemeColor({}, 'tint');
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Edit body measurements">
      <IconSymbol name="pencil" size={14} color={tint} />
    </Pressable>
  );
}

function MeasurementsGrid({
  measurements,
}: {
  measurements: Tables<'body_measurements'> | null | undefined;
}) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const secondary = useThemeColor({}, 'icon');

  return (
    <View style={[styles.card, styles.measurementsGrid, { backgroundColor: cardBackground }]}>
      {MEASUREMENT_FIELDS.map(({ key, label }, index) => {
        const value = measurements?.[key];
        const isRightColumn = index % 2 === 1;
        const isLastRow = index >= MEASUREMENT_FIELDS.length - 2;
        return (
          <View
            key={key}
            style={[
              styles.measurementCell,
              !isRightColumn && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: borderColor },
              !isLastRow && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
            ]}>
            <ThemedText style={{ color: secondary }}>{label}</ThemedText>
            <ThemedText type="defaultSemiBold">{value != null ? `${value} cm` : 'Not set'}</ThemedText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Extra bottom padding (more than Profile's) since this screen is tall
  // enough for its last section to otherwise sit under the floating tab bar.
  content: { padding: 16, paddingBottom: 100, gap: 28 },
  section: { gap: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { borderRadius: 12 },

  hero: { alignItems: 'center', gap: 4 },
  heroWeight: { fontSize: 40, fontWeight: '700', lineHeight: 46 },
  heroLabel: { fontSize: 15 },
  heroTarget: { fontSize: 15, marginTop: 8 },
  heroRemaining: { fontSize: 13 },
  heroHint: { fontSize: 15, textAlign: 'center', marginTop: 4 },
  heroAction: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, padding: 4 },
  heroActionText: { fontSize: 15, fontWeight: '600' },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 3 },

  emptyChartCard: { padding: 24, alignItems: 'center', gap: 6 },
  emptyChartHint: { textAlign: 'center' },
  chartCard: { padding: 16 },
  chart: { height: CHART_HEIGHT },
  chartAxisY: { position: 'absolute', width: StyleSheet.hairlineWidth },
  chartAxisX: { position: 'absolute', height: StyleSheet.hairlineWidth },
  chartYLabel: { position: 'absolute', left: 0, textAlign: 'right', fontSize: 11 },
  chartSegment: { position: 'absolute', height: 2 },
  chartDot: { position: 'absolute', width: CHART_DOT_SIZE, height: CHART_DOT_SIZE, borderRadius: CHART_DOT_SIZE / 2 },
  chartLabel: { position: 'absolute', bottom: 0, width: CHART_LABEL_WIDTH, textAlign: 'center', fontSize: 11 },

  bmiCard: { padding: 16, alignItems: 'center', gap: 2 },
  bmiValue: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  bmiHint: { textAlign: 'center' },

  measurementsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  measurementCell: { width: '50%', padding: 16, gap: 4 },
});
