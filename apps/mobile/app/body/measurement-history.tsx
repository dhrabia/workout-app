import { Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { OutlineButton } from '@/components/outline-button';
import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { formatShortDate, TrendChart } from '@/components/trend-chart';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WheelPickerModal } from '@/components/wheel-picker-modal';
import {
  useBodyMeasurementLogs,
  useLogBodyMeasurement,
  useUpdateBodyMeasurementLog,
} from '@/hooks/queries/use-body-measurement-logs';
import { useThemeColor } from '@/hooks/use-theme-color';
import {
  MEASUREMENT_DEFAULT,
  MEASUREMENT_FIELDS,
  MEASUREMENT_VALUES,
  type MeasurementFieldKey,
} from '@/lib/body-measurement-fields';
import type { Tables } from '@workout-app/shared';

type MeasurementLog = Tables<'body_measurement_logs'>;

function formatMeasurement(cm: number) {
  return `${cm} cm`;
}

function formatEntryDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Which entry the wheel picker is editing — 'add' logs a new entry for the
// selected type (prefilled with its current value, or a generic default if
// it has none yet); 'edit' edits a specific historical row in place. The
// picker's value is derived from this at render time rather than stored
// alongside it, so there's only one source of truth for "current value".
type PickerTarget = { mode: 'add' } | { mode: 'edit'; logId: string };

export default function BodyMeasurementsHistoryScreen() {
  const { data: logs } = useBodyMeasurementLogs();
  const logMeasurement = useLogBodyMeasurement();
  const updateMeasurementLog = useUpdateBodyMeasurementLog();

  const [selectedType, setSelectedType] = useState<MeasurementFieldKey>('chest');
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const typeLogs = useMemo(
    () => (logs ?? []).filter((log) => log.measurement_type === selectedType),
    [logs, selectedType]
  );
  const currentValue = typeLogs.at(-1)?.value_cm;
  const selectedLabel = MEASUREMENT_FIELDS.find((field) => field.key === selectedType)!.label;
  const secondary = useThemeColor({}, 'icon');

  const pickerValue =
    pickerTarget?.mode === 'edit'
      ? (typeLogs.find((log) => log.id === pickerTarget.logId)?.value_cm ?? MEASUREMENT_DEFAULT)
      : (currentValue ?? MEASUREMENT_DEFAULT);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Body Measurements' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <MeasurementTypePills selected={selectedType} onSelect={setSelectedType} />

        {typeLogs.length === 0 ? (
          <EmptyMeasurementState label={selectedLabel} onAdd={() => setPickerTarget({ mode: 'add' })} />
        ) : (
          <>
            <CurrentValueHeader
              label={selectedLabel}
              value={currentValue!}
              onPress={() => setPickerTarget({ mode: 'add' })}
            />
            <ChartCard logs={typeLogs} label={selectedLabel} />
            <View style={styles.section}>
              <SectionLabel>Measurements</SectionLabel>
              <HistoryList
                entries={[...typeLogs].reverse()}
                onSelect={(log) => setPickerTarget({ mode: 'edit', logId: log.id })}
              />
            </View>
          </>
        )}

        <ThemedText style={[styles.footnote, { color: secondary }]}>
          Measurements are saved automatically and can be edited in the past.
        </ThemedText>
      </ScrollView>

      <WheelPickerModal
        key={pickerTarget ? (pickerTarget.mode === 'edit' ? pickerTarget.logId : 'new') : 'closed'}
        visible={pickerTarget != null}
        title={`What's your ${selectedLabel.toLowerCase()} measurement?`}
        values={MEASUREMENT_VALUES}
        value={pickerValue}
        suffix="cm"
        pending={logMeasurement.isPending || updateMeasurementLog.isPending}
        onClose={() => setPickerTarget(null)}
        onSave={(value) => {
          if (!pickerTarget) return;
          if (pickerTarget.mode === 'edit') {
            updateMeasurementLog.mutate(
              { id: pickerTarget.logId, value_cm: value },
              { onSuccess: () => setPickerTarget(null) }
            );
          } else {
            logMeasurement.mutate(
              { measurement_type: selectedType, value_cm: value },
              { onSuccess: () => setPickerTarget(null) }
            );
          }
        }}
      />
    </ThemedView>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function MeasurementTypePills({
  selected,
  onSelect,
}: {
  selected: MeasurementFieldKey;
  onSelect: (key: MeasurementFieldKey) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
      {MEASUREMENT_FIELDS.map(({ key, label }) => (
        <MeasurementTypePill key={key} label={label} active={key === selected} onPress={() => onSelect(key)} />
      ))}
    </ScrollView>
  );
}

function MeasurementTypePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const cardElevated = useThemeColor({}, 'cardElevated');
  const secondary = useThemeColor({}, 'icon');
  const text = useThemeColor({}, 'text');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.pill,
        {
          backgroundColor: active ? hexToRgba(tint, 0.16) : cardElevated,
          borderColor: active ? tint : borderColor,
        },
      ]}>
      <ThemedText style={[styles.pillText, { color: active ? text : secondary }]}>{label}</ThemedText>
    </Pressable>
  );
}

function CurrentValueHeader({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) {
  const secondary = useThemeColor({}, 'icon');
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">{label}</ThemedText>
      <Pressable
        onPress={onPress}
        style={styles.currentValueRow}
        accessibilityRole="button"
        accessibilityLabel={`Log a new ${label.toLowerCase()} measurement`}>
        <ThemedText style={styles.currentValue}>{formatMeasurement(value)}</ThemedText>
        <IconSymbol name="chevron.right" size={18} color={secondary} />
      </Pressable>
    </View>
  );
}

function ChartCard({ logs, label }: { logs: MeasurementLog[]; label: string }) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const points = logs.map((log) => ({ id: log.id, date: formatShortDate(log.logged_at), value: log.value_cm }));

  return (
    <View style={[styles.card, styles.chartCard, { backgroundColor: cardBackground }]}>
      <TrendChart points={points} label={label} unit="centimeters" formatValue={(cm) => String(cm)} />
    </View>
  );
}

function HistoryList({
  entries,
  onSelect,
}: {
  entries: MeasurementLog[];
  onSelect: (log: MeasurementLog) => void;
}) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const secondary = useThemeColor({}, 'icon');

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }]}>
      {entries.map((log, index) => (
        <Pressable
          key={log.id}
          onPress={() => onSelect(log)}
          style={[
            styles.historyRow,
            index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor },
          ]}>
          <ThemedText>{formatEntryDate(log.logged_at)}</ThemedText>
          <View style={styles.historyRowValue}>
            <ThemedText type="defaultSemiBold">{formatMeasurement(log.value_cm)}</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={secondary} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function EmptyMeasurementState({ label, onAdd }: { label: string; onAdd: () => void }) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondary = useThemeColor({}, 'icon');
  return (
    <View style={[styles.card, styles.emptyCard, { backgroundColor: cardBackground }]}>
      <ThemedText type="subtitle">{label}</ThemedText>
      <ThemedText style={[styles.emptyHint, { color: secondary }]}>No measurements yet</ThemedText>
      <OutlineButton label="Add measurement" onPress={onAdd} style={styles.emptyButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 24 },
  section: { gap: 8 },
  card: { borderRadius: 12 },

  pillsRow: { gap: 8, paddingRight: 16 },
  pill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, borderWidth: 1 },
  pillText: { fontSize: 14, fontWeight: '600' },

  currentValueRow: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  currentValue: { fontSize: 34, fontWeight: '700', lineHeight: 40 },

  chartCard: { padding: 16 },

  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  historyRowValue: { flexDirection: 'row', alignItems: 'center', gap: 2 },

  emptyCard: { padding: 24, alignItems: 'center', gap: 4 },
  emptyHint: { marginTop: 2 },
  emptyButton: { margin: 0, marginTop: 16 },

  footnote: { fontSize: 12, textAlign: 'center' },
});
