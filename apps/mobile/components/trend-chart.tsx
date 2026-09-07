import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const CHART_HEIGHT = 160;
const CHART_TOP_PADDING = 12;
const CHART_BOTTOM_PADDING = 20;
const CHART_LEFT_PADDING = 38;
const CHART_DOT_SIZE = 8;
const CHART_LABEL_WIDTH = 40;
const CHART_MAX_POINTS = 12;

export type TrendPoint = { id: string; date: string; value: number };

export function formatShortDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// A hand-rolled line chart (no charting library, no SVG) — shared by the
// Body screen's weight-progress chart and the Body Measurements history
// screen. Line segments are 2px-tall Views rotated to the angle between
// consecutive points; dots and axis lines are plain Views too.
export function TrendChart({
  points: allPoints,
  label,
  unit,
  formatValue,
}: {
  points: TrendPoint[];
  label: string;
  unit: string;
  formatValue: (value: number) => string;
}) {
  const tint = useThemeColor({}, 'tint');
  const secondary = useThemeColor({}, 'icon');
  const axisColor = useThemeColor({}, 'border');
  const [width, setWidth] = useState(0);

  const points = allPoints.slice(-CHART_MAX_POINTS);
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const plotHeight = CHART_HEIGHT - CHART_TOP_PADDING - CHART_BOTTOM_PADDING;
  const plotWidth = Math.max(0, width - CHART_LEFT_PADDING - CHART_DOT_SIZE);

  function xAt(index: number) {
    if (points.length === 1) return CHART_LEFT_PADDING + plotWidth / 2;
    return CHART_LEFT_PADDING + (index / (points.length - 1)) * plotWidth + CHART_DOT_SIZE / 2;
  }
  function yAt(value: number) {
    return CHART_TOP_PADDING + (1 - (value - min) / range) * plotHeight;
  }

  // Deduped since a 2-point line makes the middle index the same as the
  // first (Math.floor((2-1)/2) === 0), which would otherwise render two
  // labels sharing the same React key.
  const labelIndexes =
    points.length <= 1
      ? [0]
      : Array.from(new Set([0, Math.floor((points.length - 1) / 2), points.length - 1]));
  // Value axis ticks: just the extremes, or the single reading if the line is flat.
  const valueTicks = max === min ? [max] : [max, min];

  function handleLayout(event: LayoutChangeEvent) {
    setWidth(event.nativeEvent.layout.width);
  }

  return (
    <View
      style={styles.chart}
      onLayout={handleLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label} trend chart. ${points.length} entries, from ${formatValue(values[0])} to ${formatValue(values.at(-1) ?? values[0])} ${unit}.`}>
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
          {valueTicks.map((tick) => (
            <ThemedText
              key={tick}
              style={[styles.chartYLabel, { color: secondary, top: yAt(tick) - 7, width: CHART_LEFT_PADDING - 6 }]}>
              {formatValue(tick)}
            </ThemedText>
          ))}
          {points.slice(1).map((point, index) => {
            const prev = points[index];
            const x1 = xAt(index);
            const y1 = yAt(prev.value);
            const x2 = xAt(index + 1);
            const y2 = yAt(point.value);
            const length = Math.hypot(x2 - x1, y2 - y1);
            const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
            return (
              <View
                key={`segment-${point.id}`}
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
              key={`dot-${point.id}`}
              style={[
                styles.chartDot,
                { backgroundColor: tint, left: xAt(index) - CHART_DOT_SIZE / 2, top: yAt(point.value) - CHART_DOT_SIZE / 2 },
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
              {points[index].date}
            </ThemedText>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { height: CHART_HEIGHT },
  chartAxisY: { position: 'absolute', width: StyleSheet.hairlineWidth },
  chartAxisX: { position: 'absolute', height: StyleSheet.hairlineWidth },
  chartYLabel: { position: 'absolute', left: 0, textAlign: 'right', fontSize: 11 },
  chartSegment: { position: 'absolute', height: 2 },
  chartDot: { position: 'absolute', width: CHART_DOT_SIZE, height: CHART_DOT_SIZE, borderRadius: CHART_DOT_SIZE / 2 },
  chartLabel: { position: 'absolute', bottom: 0, width: CHART_LABEL_WIDTH, textAlign: 'center', fontSize: 11 },
});
