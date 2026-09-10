import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  pending?: boolean;
  onPress: () => void;
  size?: 'default' | 'large';
  // Visually subdues the button (e.g. while a required field is still empty)
  // without disabling it — tapping still fires onPress so existing
  // validation/error behavior on tap is preserved.
  muted?: boolean;
  testID?: string;
};

export function SubmitButton({
  label,
  pendingLabel = 'Saving…',
  pending,
  onPress,
  size = 'default',
  muted,
  testID,
}: SubmitButtonProps) {
  const tint = useThemeColor({}, 'tint');
  const tintDark = useThemeColor({}, 'tintDark');
  const mutedBackground = useThemeColor({}, 'cardElevated');
  const buttonText = useThemeColor({}, 'buttonText');
  const mutedText = useThemeColor({}, 'textDisabled');
  const textColor = muted ? mutedText : buttonText;

  return (
    <Pressable
      onPress={onPress}
      disabled={pending}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        size === 'large' && styles.buttonLarge,
        { backgroundColor: muted ? mutedBackground : pressed ? tintDark : tint },
      ]}>
      <ThemedText style={[styles.buttonText, { color: textColor }]}>
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
