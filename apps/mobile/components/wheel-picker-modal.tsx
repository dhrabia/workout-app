import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubmitButton } from '@/components/submit-button';
import { ThemedText } from '@/components/themed-text';
import { WheelPicker } from '@/components/wheel-picker';
import { useThemeColor } from '@/hooks/use-theme-color';

// A bottom-sheet modal for picking a number off a wheel (e.g. Age) — used
// from Profile's Personal Information rows. Pass a `key` that changes each
// time it opens (see call site) so a dismissed, unsaved selection doesn't
// linger for next time — remounting resets `selected` to `value`.
export function WheelPickerModal({
  visible,
  title,
  values,
  value,
  suffix,
  pending,
  onClose,
  onSave,
}: {
  visible: boolean;
  title: string;
  values: number[];
  value: number;
  suffix?: string;
  pending?: boolean;
  onClose: () => void;
  onSave: (value: number) => void;
}) {
  const [selected, setSelected] = useState(value);
  const cardBackground = useThemeColor({}, 'cardBackground');
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { backgroundColor: cardBackground, paddingBottom: insets.bottom + 16 },
        ]}>
        <ThemedText type="subtitle" style={styles.title}>
          {title}
        </ThemedText>
        <WheelPicker values={values} value={selected} onChange={setSelected} suffix={suffix} />
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
    padding: 16,
    gap: 16,
  },
  title: { textAlign: 'center' },
});
