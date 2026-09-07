import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatShortDate, TrendChart } from '@/components/trend-chart';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatWeight } from '@/lib/weight';
import type { Tables } from '@workout-app/shared';

// The weight-trend chart card — shared by the Body screen's "Weight
// progress" section and the dedicated Weight history screen.
export function WeightProgressCard({ history }: { history: Tables<'weight_logs'>[] | undefined }) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondary = useThemeColor({}, 'icon');

  if (!history || history.length === 0) {
    return (
      <View style={[styles.card, styles.emptyCard, { backgroundColor: cardBackground }]}>
        <ThemedText type="defaultSemiBold">No weight history yet</ThemedText>
        <ThemedText style={[styles.emptyHint, { color: secondary }]}>
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

const styles = StyleSheet.create({
  card: { borderRadius: 12 },
  emptyCard: { padding: 24, alignItems: 'center', gap: 6 },
  emptyHint: { textAlign: 'center' },
  chartCard: { padding: 16 },
});
