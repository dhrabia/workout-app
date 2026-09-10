import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ComponentProps, Ref, ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

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
  // A full-bleed photo behind the card, darkened with a bottom gradient so
  // the title stays readable over it — used by the Plans list's hero-sized
  // cards. Forces the title (and menu icon) to a fixed white, since it no
  // longer sits on the theme's own card background.
  backgroundImage?: ComponentProps<typeof Image>['source'];
  testID?: string;
  menuTestID?: string;
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
  backgroundImage,
  testID,
  menuTestID,
}: ListCardProps) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const separatorColor = useThemeColor({}, 'border');
  const iconColor = useThemeColor({}, 'icon');
  const menuIconColor = backgroundImage ? '#FFFFFF' : iconColor;

  return (
    <View
      style={[
        styles.card,
        backgroundImage ? styles.cardWithImage : { backgroundColor: cardBackground },
        style,
      ]}>
      {backgroundImage && (
        <>
          <Image source={backgroundImage} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} style={styles.gradient} />
        </>
      )}
      <Pressable
        style={[
          styles.content,
          !!backgroundImage && styles.contentWithImage,
          onMenuPress && styles.contentWithMenu,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        testID={testID}>
        <ThemedText type="defaultSemiBold" style={[titleStyle, !!backgroundImage && styles.titleOnImage]}>
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
          <Pressable onPress={onMenuPress} hitSlop={10} style={styles.menuButton} testID={menuTestID}>
            <IconSymbol name="ellipsis" size={20} color={menuIconColor} />
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
    overflow: 'hidden',
  },
  cardWithImage: { alignItems: 'stretch', padding: 0 },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  content: { flex: 1, gap: 6 },
  contentWithImage: { padding: 16, justifyContent: 'flex-end' },
  contentWithMenu: { paddingRight: 24 },
  titleOnImage: { color: '#FFFFFF' },
  separator: { height: StyleSheet.hairlineWidth },
  menuButtonAnchor: { position: 'absolute', top: 6, right: 6 },
  menuButton: { padding: 6 },
});
