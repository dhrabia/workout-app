import { Stack, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatShortDate, TrendChart } from '@/components/trend-chart';
import { WheelPickerModal } from '@/components/wheel-picker-modal';
import { useBodyMeasurementLogs, useLogBodyMeasurement } from '@/hooks/queries/use-body-measurement-logs';
import { useProfile } from '@/hooks/queries/use-profile';
import { useWeightLogs } from '@/hooks/queries/use-weight-logs';
import { usePickerModal } from '@/hooks/use-picker-modal';
import { useThemeColor } from '@/hooks/use-theme-color';
import { calculateBmi, getBmiCategory } from '@/lib/bmi';
import {
  getLatestMeasurements,
  MEASUREMENT_DEFAULT,
  MEASUREMENT_FIELDS,
  MEASUREMENT_VALUES,
  type MeasurementFieldKey,
} from '@/lib/body-measurement-fields';
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
  const { data: measurementLogs } = useBodyMeasurementLogs();
  const logMeasurement = useLogBodyMeasurement();

  const currentWeight = getCurrentWeight(weightLogs);
  const startWeight = weightLogs?.[0]?.weight_kg;
  const latestMeasurements = getLatestMeasurements(measurementLogs);

  const measurementModal = usePickerModal<MeasurementFieldKey>();
  const editingFieldLabel = MEASUREMENT_FIELDS.find((field) => field.key === measurementModal.field)?.label;

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
            <HistoryAction onPress={() => router.push('/body/measurement-history')} />
          </View>
          <MeasurementsGrid measurements={latestMeasurements} onSelectField={measurementModal.open} />
        </View>
      </ScrollView>

      <WheelPickerModal
        key={measurementModal.key}
        visible={measurementModal.visible}
        title={`What's your ${editingFieldLabel?.toLowerCase()} measurement?`}
        values={MEASUREMENT_VALUES}
        value={(measurementModal.field && latestMeasurements[measurementModal.field]) ?? MEASUREMENT_DEFAULT}
        suffix="cm"
        pending={logMeasurement.isPending}
        onClose={measurementModal.close}
        onSave={(value) => {
          if (!measurementModal.field) return;
          logMeasurement.mutate(
            { measurement_type: measurementModal.field, value_cm: value },
            { onSuccess: measurementModal.close }
          );
        }}
      />
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

  const points = history.map((log) => ({
    id: log.id,
    date: formatShortDate(log.logged_at),
    value: log.weight_kg,
  }));

  return (
    <View style={[styles.card, styles.chartCard, { backgroundColor: cardBackground }]}>
      <TrendChart points={points} label="Weight" unit="kilograms" formatValue={formatWeight} />
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

function HistoryAction({ onPress }: { onPress: () => void }) {
  const tint = useThemeColor({}, 'tint');
  const cardElevated = useThemeColor({}, 'cardElevated');
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="View measurement history"
      style={[styles.historyAction, { backgroundColor: cardElevated }]}>
      <IconSymbol name="clock.arrow.circlepath" size={13} color={tint} />
      <ThemedText style={[styles.historyActionText, { color: tint }]}>History</ThemedText>
    </Pressable>
  );
}

function MeasurementsGrid({
  measurements,
  onSelectField,
}: {
  measurements: Partial<Record<MeasurementFieldKey, number>>;
  onSelectField: (key: MeasurementFieldKey) => void;
}) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const secondary = useThemeColor({}, 'icon');

  return (
    <View style={[styles.card, styles.measurementsGrid, { backgroundColor: cardBackground }]}>
      {MEASUREMENT_FIELDS.map(({ key, label }, index) => {
        const value = measurements[key];
        const isRightColumn = index % 2 === 1;
        const isLastRow = index >= MEASUREMENT_FIELDS.length - 2;
        return (
          <Pressable
            key={key}
            onPress={() => onSelectField(key)}
            style={[
              styles.measurementCell,
              !isRightColumn && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: borderColor },
              !isLastRow && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor },
            ]}>
            <ThemedText style={{ color: secondary }}>{label}</ThemedText>
            <View style={styles.measurementValueRow}>
              <ThemedText type="defaultSemiBold">
                {value != null ? `${value} cm` : 'Not set'}
              </ThemedText>
              <IconSymbol name="chevron.right" size={14} color={secondary} />
            </View>
          </Pressable>
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

  bmiCard: { padding: 16, alignItems: 'center', gap: 2 },
  bmiValue: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  bmiHint: { textAlign: 'center' },

  historyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  historyActionText: { fontSize: 13, fontWeight: '600' },

  measurementsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  measurementCell: { width: '50%', padding: 16, gap: 4 },
  measurementValueRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
});
