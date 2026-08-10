import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  pending?: boolean;
  onPress: () => void;
};

export function SubmitButton({
  label,
  pendingLabel = 'Saving…',
  pending,
  onPress,
}: SubmitButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const buttonText = useThemeColor({}, 'buttonText');

  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      style={[styles.button, { backgroundColor: tint }]}>
      <ThemedText style={[styles.buttonText, { color: buttonText }]}>
        {pending ? pendingLabel : label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonText: { fontWeight: '600' },
});
