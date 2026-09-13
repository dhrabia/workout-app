import { useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';

import type { ContextMenuActionItem } from '@/components/context-menu';
import { useOpenContextMenu } from '@/components/context-menu';

// Wires up a row's "…" button to open a shared Edit/Delete context menu,
// anchored to the button itself, and keeps drag-to-reorder on a plain long
// press (grabbing anywhere on the row still reorders it).
// Must be used inside a ReorderableList item component.
export function useDragContextMenu({
  onEdit,
  onDelete,
  testIDPrefix,
  extraActions,
}: {
  onEdit: () => void;
  onDelete: () => void;
  // Lets each row's Edit/Delete actions carry a stable, per-item testID
  // (e.g. `${testIDPrefix}-edit`), since the menu itself is a single shared
  // overlay with no other way to tell which row opened it.
  testIDPrefix?: string;
  // Extra actions specific to one screen's rows (e.g. the plans list's "Set
  // as active"), inserted between Edit and Delete. Days/exercises rows omit
  // this and just get the plain Edit/Delete menu.
  extraActions?: ContextMenuActionItem[];
}) {
  const openMenuAt = useOpenContextMenu();
  const menuButtonRef = useRef<View>(null);
  const drag = useReorderableDrag();

  const actions = useMemo(
    () => [
      {
        label: 'Edit',
        icon: 'pencil' as const,
        onPress: onEdit,
        testID: testIDPrefix ? `${testIDPrefix}-edit` : undefined,
      },
      ...(extraActions ?? []),
      {
        label: 'Delete',
        icon: 'trash' as const,
        destructive: true,
        onPress: onDelete,
        testID: testIDPrefix ? `${testIDPrefix}-delete` : undefined,
      },
    ],
    [onEdit, onDelete, testIDPrefix, extraActions]
  );

  const handleMenuPress = useCallback(() => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      openMenuAt({ x, y, width, height }, actions);
    });
  }, [openMenuAt, actions]);

  return {
    menuButtonRef,
    onLongPress: drag,
    onMenuPress: handleMenuPress,
  };
}
