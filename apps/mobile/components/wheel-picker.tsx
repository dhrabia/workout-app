import { useRef } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;
const PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ITEMS / 2);

// A scrollable, snapping number wheel (iOS UIPickerView-style) — the centered
// row is the selected value. `value`/`onChange` only drive the initial scroll
// position and the highlighted row's style; once mounted, scrolling is the
// only way values change, so there's no need to sync scroll position after
// the first render (callers remount this via `key` to reset it, same as
// SingleChoiceModal).
export function WheelPicker({
  values,
  value,
  onChange,
  suffix,
}: {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const initialOffset = useRef(Math.max(0, values.indexOf(value)) * ITEM_HEIGHT);
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const secondary = useThemeColor({}, 'icon');

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.min(values.length - 1, Math.max(0, index));
    if (values[clamped] !== value) onChange(values[clamped]);
  }

  return (
    <View style={[styles.container, { height: ITEM_HEIGHT * VISIBLE_ITEMS }]}>
      <View pointerEvents="none" style={[styles.highlight, { top: PADDING, borderColor }]} />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PADDING }}
        contentOffset={{ x: 0, y: initialOffset.current }}
        scrollEventThrottle={16}
        onScroll={handleScroll}>
        {values.map((item) => (
          <View key={item} style={styles.item}>
            <ThemedText
              style={[styles.itemText, { color: secondary }, item === value && { color: tint, fontWeight: '600' }]}>
              {item}
              {suffix ? ` ${suffix}` : ''}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 20 },
});
