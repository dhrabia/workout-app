import type { Ref, ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ListCardProps = {
  title: string;
  titleStyle?: StyleProp<TextStyle>;
  meta?: ReactNode;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
  menuButtonRef?: Ref<View>;
  style?: StyleProp<ViewStyle>;
};

// The rounded, filled-background row used throughout the plan builder's list
// screens (plans, days, exercises) — a title, an optional secondary line
// below a hairline separator, and an optional "…" button pinned to the top
// right corner that opens a context menu. `style` and `titleStyle` let a
// specific screen size its cards differently (e.g. the plans list uses
// bigger cards than the day/exercise lists) without changing the shared
// default.
export function ListCard({
  title,
  titleStyle,
  meta,
  onPress,
  onLongPress,
  onMenuPress,
  menuButtonRef,
  style,
}: ListCardProps) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const separatorColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');

  return (
    <View style={[styles.card, { backgroundColor: cardBackground }, style]}>
      <Pressable
        style={[styles.content, onMenuPress && styles.contentWithMenu]}
        onPress={onPress}
        onLongPress={onLongPress}>
        <ThemedText type="defaultSemiBold" style={titleStyle}>
          {title}
        </ThemedText>
        {meta ? (
          <>
            <View style={[styles.separator, { backgroundColor: separatorColor }]} />
            {meta}
          </>
        ) : null}
      </Pressable>
      {onMenuPress ? (
        <View ref={menuButtonRef} collapsable={false} style={styles.menuButtonAnchor}>
          <Pressable onPress={onMenuPress} hitSlop={10} style={styles.menuButton}>
            <IconSymbol name="ellipsis" size={20} color={iconColor} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  content: { flex: 1, gap: 6 },
  contentWithMenu: { paddingRight: 24 },
  separator: { height: StyleSheet.hairlineWidth },
  menuButtonAnchor: { position: 'absolute', top: 6, right: 6 },
  menuButton: { padding: 6 },
});
