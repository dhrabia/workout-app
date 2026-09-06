import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SubmitButton } from '@/components/submit-button';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type SingleChoiceOption<T extends string> = { value: T; label: string };

// A bottom-sheet modal for picking one of a few options (e.g. Gender) —
// used from Profile's Personal Information rows. Pass a `key` that changes
// each time it opens (see call site) so a dismissed, unsaved selection
// doesn't linger for next time — remounting resets `selected` to `value`.
export function SingleChoiceModal<T extends string>({
  visible,
  title,
  options,
  value,
  pending,
  onClose,
  onSave,
}: {
  visible: boolean;
  title: string;
  options: SingleChoiceOption<T>[];
  value: T | null | undefined;
  pending?: boolean;
  onClose: () => void;
  onSave: (value: T) => void;
}) {
  const [selected, setSelected] = useState(value);
  const cardBackground = useThemeColor({}, 'cardBackground');
  const cardElevated = useThemeColor({}, 'cardElevated');
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'border');
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
        <View style={[styles.options, { backgroundColor: cardElevated }]}>
          {options.map((option, index) => {
            const isSelected = option.value === selected;
            return (
              <Pressable
                key={option.value}
                onPress={() => setSelected(option.value)}
                style={[
                  styles.option,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}>
                <ThemedText>{option.label}</ThemedText>
                <View style={[styles.radioOuter, { borderColor: isSelected ? tint : borderColor }]}>
                  {isSelected && <View style={[styles.radioInner, { backgroundColor: tint }]} />}
                </View>
              </Pressable>
            );
          })}
        </View>
        <SubmitButton
          label="Save"
          pending={pending}
          onPress={() => selected != null && onSave(selected)}
        />
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
  options: { borderRadius: 12, overflow: 'hidden' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
});
