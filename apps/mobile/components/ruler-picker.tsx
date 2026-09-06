import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const STEP_WIDTH = 14;
const MAJOR_TICK_HEIGHT = 48;
const MINOR_TICK_HEIGHT = 24;
const LABEL_HEIGHT = 18;
const RULER_HEIGHT = MAJOR_TICK_HEIGHT + LABEL_HEIGHT;

// A horizontal scrolling ruler (tape-measure style) — the tick centered
// under the fixed pointer is the selected value. Ticks landing on a whole
// `majorStep` are taller and labeled; everything in between is a plain
// minor tick. Mirrors WheelPicker's contract: `value`/`onChange` drive the
// initial scroll position and which tick reads as selected; scrolling is
// otherwise the only way values change (callers remount via `key` to reset).
export function RulerPicker({
  min,
  max,
  step = 0.1,
  majorStep = 1,
  value,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  majorStep?: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const listRef = useRef<FlatList<number>>(null);
  const hasPositioned = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const secondary = useThemeColor({}, 'icon');

  // Ticks are tracked in tenths (integers) to avoid float drift (e.g.
  // 0.1 + 0.2 !== 0.3) accumulating over ~1700 steps of a 30-200kg range.
  // Memoized since onScroll recomputes this on every throttled scroll frame.
  const stepTenths = Math.round(step * 10);
  const majorStepTenths = Math.round(majorStep * 10);
  const minTenths = Math.round(min * 10);
  const maxTenths = Math.round(max * 10);
  const ticks = useMemo(() => {
    const tickCount = Math.round((maxTenths - minTenths) / stepTenths) + 1;
    return Array.from({ length: tickCount }, (_, i) => minTenths + i * stepTenths);
  }, [minTenths, maxTenths, stepTenths]);
  const valueTenths = Math.round(value * 10);
  // Half a tick short of centering the padding itself: a tick's own center
  // sits half a tick-width past where its cell starts, so without this the
  // pointer (fixed at the true screen center) would land between two ticks
  // instead of on the selected one.
  const padding = containerWidth / 2 - STEP_WIDTH / 2;

  function handleLayout(event: LayoutChangeEvent) {
    setContainerWidth(event.nativeEvent.layout.width);
    if (hasPositioned.current) return;
    hasPositioned.current = true;
    const index = Math.min(ticks.length - 1, Math.max(0, Math.round((valueTenths - minTenths) / stepTenths)));
    requestAnimationFrame(() =>
      listRef.current?.scrollToOffset({ offset: index * STEP_WIDTH, animated: false })
    );
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / STEP_WIDTH);
    const clamped = Math.min(ticks.length - 1, Math.max(0, index));
    const nextTenths = ticks[clamped];
    if (nextTenths !== valueTenths) onChange(nextTenths / 10);
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {containerWidth > 0 && (
        <FlatList
          ref={listRef}
          data={ticks}
          keyExtractor={(tick) => String(tick)}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={STEP_WIDTH}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: padding }}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          getItemLayout={(_, index) => ({ length: STEP_WIDTH, offset: STEP_WIDTH * index, index })}
          renderItem={({ item: tickTenths }) => {
            const isMajor = tickTenths % majorStepTenths === 0;
            return (
              <View style={styles.tick}>
                <View style={styles.tickLineArea}>
                  <View
                    style={[
                      styles.tickLine,
                      {
                        height: isMajor ? MAJOR_TICK_HEIGHT : MINOR_TICK_HEIGHT,
                        width: isMajor ? 2 : 1,
                        backgroundColor: isMajor ? secondary : borderColor,
                      },
                    ]}
                  />
                </View>
                <View style={styles.labelArea}>
                  {isMajor && (
                    <ThemedText style={[styles.tickLabel, { color: secondary }]}>{tickTenths / 10}</ThemedText>
                  )}
                </View>
              </View>
            );
          }}
        />
      )}
      <View pointerEvents="none" style={[styles.pointer, { backgroundColor: tint }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: RULER_HEIGHT },
  pointer: { position: 'absolute', left: '50%', marginLeft: -1, top: 0, width: 2, height: MAJOR_TICK_HEIGHT },
  tick: { width: STEP_WIDTH, height: RULER_HEIGHT },
  tickLineArea: { height: MAJOR_TICK_HEIGHT, alignItems: 'center', justifyContent: 'flex-end' },
  tickLine: { borderRadius: 1 },
  labelArea: { height: LABEL_HEIGHT, alignItems: 'center' },
  tickLabel: { fontSize: 12 },
});
