import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ComponentProps,
  type PropsWithChildren,
} from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

type ContextMenuActionItem = {
  label: string;
  icon: ComponentProps<typeof IconSymbol>['name'];
  destructive?: boolean;
  onPress: () => void;
};

type ContextMenuAnchorRect = { x: number; y: number; width: number; height: number };

type ActiveMenu = { anchorRect: ContextMenuAnchorRect; actions: ContextMenuActionItem[] };

type OpenMenuAt = (anchorRect: ContextMenuAnchorRect, actions: ContextMenuActionItem[]) => void;

const ContextMenuContext = createContext<OpenMenuAt | null>(null);

// Mounted once, at the app root (see app/_layout.tsx) — not per screen. The
// overlay below measures its anchor with `measureInWindow`, which is
// relative to the whole app window, so the overlay itself has to be
// positioned relative to that same window rather than a screen's own
// content view (which starts below the native header). Rendering it as a
// sibling of the root <Stack> gets that; nesting it inside a screen shifted
// the menu down by roughly the header's height.
export function ContextMenuHostProvider({ children }: PropsWithChildren) {
  const [activeMenu, setActiveMenu] = useState<ActiveMenu | null>(null);

  const openMenuAt = useCallback<OpenMenuAt>((anchorRect, actions) => {
    setActiveMenu({ anchorRect, actions });
  }, []);

  const closeMenu = useCallback(() => setActiveMenu(null), []);

  return (
    <ContextMenuContext.Provider value={openMenuAt}>
      {children}
      <ContextMenuOverlay activeMenu={activeMenu} onClose={closeMenu} />
    </ContextMenuContext.Provider>
  );
}

// Used by a row's "…" button to open the menu anchored to itself. Must be
// used inside a ContextMenuHostProvider (the root layout provides one).
export function useOpenContextMenu() {
  const openMenuAt = useContext(ContextMenuContext);
  if (!openMenuAt) {
    throw new Error('useOpenContextMenu must be used within a ContextMenuHostProvider');
  }
  return openMenuAt;
}

const MENU_WIDTH = 220;
const MARGIN = 8;

function ContextMenuOverlay({
  activeMenu,
  onClose,
}: {
  activeMenu: ActiveMenu | null;
  onClose: () => void;
}) {
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const insets = useSafeAreaInsets();

  if (!activeMenu) return null;
  const { anchorRect, actions } = activeMenu;

  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const left = Math.min(Math.max(anchorRect.x, MARGIN), screenWidth - MENU_WIDTH - MARGIN);
  const spaceBelow = screenHeight - insets.bottom - (anchorRect.y + anchorRect.height);
  const openUpward = spaceBelow < 160 && anchorRect.y > 160;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View
        style={[
          styles.menu,
          { backgroundColor: cardBackground, width: MENU_WIDTH, left },
          openUpward
            ? { bottom: screenHeight - anchorRect.y + 6 }
            : { top: anchorRect.y + anchorRect.height + 6 },
        ]}>
        {actions.map((action, index) => (
          <Pressable
            key={action.label}
            onPress={() => {
              onClose();
              action.onPress();
            }}
            style={({ pressed }) => [
              styles.row,
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: borderColor },
              pressed && styles.rowPressed,
            ]}>
            <ThemedText style={action.destructive ? styles.destructiveText : undefined}>
              {action.label}
            </ThemedText>
            <IconSymbol
              name={action.icon}
              size={18}
              color={action.destructive ? '#e53935' : textColor}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowPressed: { opacity: 0.6 },
  destructiveText: { color: '#e53935' },
});
