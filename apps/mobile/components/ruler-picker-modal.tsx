import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RulerPicker } from '@/components/ruler-picker';
import { SubmitButton } from '@/components/submit-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

// A bottom-sheet modal for picking a decimal value off a horizontal ruler
// (e.g. Weight, Target weight) — used from Profile's Personal Information /
// Weight goal rows. Pass a `key` that changes each time it opens (see call
// site) so a dismissed, unsaved selection doesn't linger for next time —
// remounting resets `selected` to `value`.
export function RulerPickerModal({
  visible,
  title,
  min,
  max,
  step,
  majorStep,
  value,
  suffix,
  pending,
  onClose,
  onSave,
}: {
  visible: boolean;
  title: string;
  min: number;
  max: number;
  step?: number;
  majorStep?: number;
  value: number;
  suffix?: string;
  pending?: boolean;
  onClose: () => void;
  onSave: (value: number) => void;
}) {
  const [selected, setSelected] = useState(value);
  const cardBackground = useThemeColor({}, 'cardBackground');
  const secondary = useThemeColor({}, 'icon');
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: cardBackground, paddingBottom: insets.bottom + 24 },
        ]}>
        <ThemedText style={[styles.title, { color: secondary }]}>{title}</ThemedText>
        <ThemedText style={styles.value}>
          {selected.toFixed(1)}
          {suffix ? ` ${suffix}` : ''}
        </ThemedText>
        <RulerPicker min={min} max={max} step={step} majorStep={majorStep} value={selected} onChange={setSelected} />
        <SubmitButton label="Save" pending={pending} onPress={() => onSave(selected)} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    gap: 16,
  },
  title: { textAlign: 'center', fontSize: 15 },
  value: { textAlign: 'center', fontSize: 36, lineHeight: 42, fontWeight: '700' },
});
