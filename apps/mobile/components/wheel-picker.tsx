import { useRef } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

const DEFAULT_ITEM_HEIGHT = 40;
const DEFAULT_VISIBLE_ITEMS = 5;

// Optional look overrides, for screens outside the regular themed UI (e.g. the
// always-dark onboarding). Omitted fields fall back to the theme colors.
export type WheelPickerAppearance = {
  itemHeight?: number;
  // Odd, so the selected row sits exactly in the middle.
  visibleItems?: number;
  textStyle?: StyleProp<TextStyle>;
  selectedTextStyle?: StyleProp<TextStyle>;
  highlightStyle?: StyleProp<ViewStyle>;
  unitStyle?: StyleProp<TextStyle>;
};

// A scrollable, snapping number wheel (iOS UIPickerView-style) — the centered
// row is the selected value. `value`/`onChange` only drive the initial scroll
// position and the highlighted row's style; once mounted, scrolling is the
// only way values change, so there's no need to sync scroll position after
// the first render (callers remount this via `key` to reset it, same as
// SingleChoiceModal).
//
// `suffix` is appended to every row ("170 cm"); `unit` is instead shown once,
// pinned to the right edge of the highlighted row.
export function WheelPicker({
  values,
  value,
  onChange,
  suffix,
  unit,
  formatValue = String,
  appearance,
  testID,
}: {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  unit?: string;
  formatValue?: (value: number) => string;
  appearance?: WheelPickerAppearance;
  testID?: string;
}) {
  const itemHeight = appearance?.itemHeight ?? DEFAULT_ITEM_HEIGHT;
  const visibleItems = appearance?.visibleItems ?? DEFAULT_VISIBLE_ITEMS;
  const padding = itemHeight * Math.floor(visibleItems / 2);

  const scrollRef = useRef<ScrollView>(null);
  const initialOffset = useRef(Math.max(0, values.indexOf(value)) * itemHeight);
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
  const secondary = useThemeColor({}, 'icon');

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.y / itemHeight);
    const clamped = Math.min(values.length - 1, Math.max(0, index));
    if (values[clamped] !== value) onChange(values[clamped]);
  }

  return (
    <View style={[styles.container, { height: itemHeight * visibleItems }]} testID={testID}>
      <View
        pointerEvents="none"
        style={[styles.highlight, { top: padding, height: itemHeight, borderColor }, appearance?.highlightStyle]}>
        {unit ? <ThemedText style={[styles.unit, { color: secondary }, appearance?.unitStyle]}>{unit}</ThemedText> : null}
      </View>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: padding }}
        contentOffset={{ x: 0, y: initialOffset.current }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        testID={testID ? `${testID}-scroll` : undefined}>
        {values.map((item) => {
          const isSelected = item === value;
          return (
            <View key={item} style={[styles.item, { height: itemHeight }]}>
              <ThemedText
                style={[
                  styles.itemText,
                  { color: secondary },
                  appearance?.textStyle,
                  isSelected && [{ color: tint, fontWeight: '600' }, appearance?.selectedTextStyle],
                ]}>
                {formatValue(item)}
                {suffix ? ` ${suffix}` : ''}
              </ThemedText>
            </View>
          );
        })}
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
    justifyContent: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  unit: { position: 'absolute', right: 16, fontSize: 15 },
  item: { alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 20 },
});
