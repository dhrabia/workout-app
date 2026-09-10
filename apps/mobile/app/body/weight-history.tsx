import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { OutlineButton } from '@/components/outline-button';
import { RulerPickerModal } from '@/components/ruler-picker-modal';
import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { WeightProgressCard } from '@/components/weight-progress-card';
import { useLogWeight, useUpdateWeightLog, useWeightLogs } from '@/hooks/queries/use-weight-logs';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatWeight, getCurrentWeight, WEIGHT_DEFAULT, WEIGHT_MAX, WEIGHT_MIN } from '@/lib/weight';
import type { Tables } from '@workout-app/shared';

type WeightLog = Tables<'weight_logs'>;

function formatEntryDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Which entry the ruler picker is editing — 'add' logs a new entry
// (prefilled with the current weight, or a generic default if there's none
// yet); 'edit' edits a specific historical row in place. The picker's value
// is derived from this at render time rather than stored alongside it, so
// there's only one source of truth for "current value" (mirrors the same
// pattern in measurement-history.tsx).
type PickerTarget = { mode: 'add' } | { mode: 'edit'; logId: string };

export default function WeightHistoryScreen() {
  const { data: weightLogs } = useWeightLogs();
  const logWeight = useLogWeight();
  const updateWeightLog = useUpdateWeightLog();

  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  const currentWeight = getCurrentWeight(weightLogs);
  const secondary = useThemeColor({}, 'icon');

  const pickerValue =
    pickerTarget?.mode === 'edit'
      ? (weightLogs?.find((log) => log.id === pickerTarget.logId)?.weight_kg ?? WEIGHT_DEFAULT)
      : (currentWeight ?? WEIGHT_DEFAULT);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Weight' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {!weightLogs || weightLogs.length === 0 ? (
          <EmptyWeightState onAdd={() => setPickerTarget({ mode: 'add' })} />
        ) : (
          <>
            <CurrentValueHeader value={currentWeight!} onPress={() => setPickerTarget({ mode: 'add' })} />
            <WeightProgressCard history={weightLogs} />
            <View style={styles.section}>
              <SectionLabel>Weight log</SectionLabel>
              <HistoryList
                entries={[...weightLogs].reverse()}
                onSelect={(log) => setPickerTarget({ mode: 'edit', logId: log.id })}
              />
            </View>
          </>
        )}

        <ThemedText style={[styles.footnote, { color: secondary }]}>
          Weight entries are saved automatically and can be edited in the past.
        </ThemedText>
      </ScrollView>

      <RulerPickerModal
        key={pickerTarget ? (pickerTarget.mode === 'edit' ? pickerTarget.logId : 'new') : 'closed'}
        visible={pickerTarget != null}
        title="What's your weight?"
        min={WEIGHT_MIN}
        max={WEIGHT_MAX}
        suffix="kg"
        value={pickerValue}
        pending={logWeight.isPending || updateWeightLog.isPending}
        onClose={() => setPickerTarget(null)}
        onSave={(weightKg) => {
          if (!pickerTarget) return;
          if (pickerTarget.mode === 'edit') {
            updateWeightLog.mutate(
              { id: pickerTarget.logId, weight_kg: weightKg },
              { onSuccess: () => setPickerTarget(null) }
            );
          } else {
            logWeight.mutate(weightKg, { onSuccess: () => setPickerTarget(null) });
          }
        }}
        testID="weight-history-modal"
      />
    </ThemedView>
  );
}

function CurrentValueHeader({ value, onPress }: { value: number; onPress: () => void }) {
  const secondary = useThemeColor({}, 'icon');
  return (
    <View style={styles.section}>
      <ThemedText type="subtitle">Weight</ThemedText>
      <Pressable
        onPress={onPress}
        style={styles.currentValueRow}
        accessibilityRole="button"
        accessibilityLabel="Log a new weight entry"
        testID="weight-history-log-button">
        <ThemedText style={styles.currentValue}>{formatWeight(value)} kg</ThemedText>
        <IconSymbol name="chevron.right" size={18} color={secondary} />
      </Pressable>
    </View>
  );
}

function HistoryList({ entries, onSelect }: { entries: WeightLog[]; onSelect: (log: WeightLog) => void }) {
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
          ]}
          testID={`weight-log-row-${log.id}`}>
          <ThemedText>{formatEntryDate(log.logged_at)}</ThemedText>
          <View style={styles.historyRowValue}>
            <ThemedText type="defaultSemiBold">{formatWeight(log.weight_kg)} kg</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={secondary} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function EmptyWeightState({ onAdd }: { onAdd: () => void }) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondary = useThemeColor({}, 'icon');
  return (
    <View style={[styles.card, styles.emptyCard, { backgroundColor: cardBackground }]}>
      <ThemedText type="subtitle">Weight</ThemedText>
      <ThemedText style={[styles.emptyHint, { color: secondary }]}>No weight logged yet</ThemedText>
      <OutlineButton
        label="Log weight"
        onPress={onAdd}
        style={styles.emptyButton}
        testID="weight-history-empty-log-button"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, gap: 24 },
  section: { gap: 8 },
  card: { borderRadius: 12 },

  currentValueRow: { flexDirection: 'row', alignItems: 'center', gap: 2, alignSelf: 'flex-start' },
  currentValue: { fontSize: 34, fontWeight: '700', lineHeight: 40 },

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
