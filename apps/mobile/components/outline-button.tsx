import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

const PRIMARY_GRADIENT: [string, string] = ['rgba(0, 194, 184, 0.28)', 'rgba(0, 127, 122, 0.08)'];

export function OutlineButton({
  label,
  icon,
  onPress,
  style,
  variant = 'default',
  testID,
}: {
  label: string;
  icon?: ComponentProps<typeof IconSymbol>['name'];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'primary';
  testID?: string;
}) {
  const tint = useThemeColor({}, 'tint');
  const tintDark = useThemeColor({}, 'tintDark');
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.buttonPrimary,
        { borderColor: pressed ? tintDark : tint },
        style,
      ]}>
      {({ pressed }) => {
        const color = pressed ? tintDark : tint;
        return (
          <>
            {isPrimary ? (
              <LinearGradient
                colors={PRIMARY_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}
            <View style={styles.content}>
              {icon ? <IconSymbol name={icon} size={18} color={color} /> : null}
              <ThemedText style={{ color }}>{label}</ThemedText>
            </View>
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonPrimary: { minHeight: 58, borderRadius: 29, borderWidth: 1.5 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
