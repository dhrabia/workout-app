import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  pending?: boolean;
  onPress: () => void;
  size?: 'default' | 'large';
};

export function SubmitButton({
  label,
  pendingLabel = 'Saving…',
  pending,
  onPress,
  size = 'default',
}: SubmitButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const tintDark = useThemeColor({}, 'tintDark');
  const buttonText = useThemeColor({}, 'buttonText');

  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      style={({ pressed }) => [
        styles.button,
        size === 'large' && styles.buttonLarge,
        { backgroundColor: pressed ? tintDark : tint },
      ]}>
      <ThemedText style={[styles.buttonText, { color: buttonText }]}>
        {pending ? pendingLabel : label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  buttonLarge: { minHeight: 56, borderRadius: 18 },
  buttonText: { fontWeight: '600' },
});
