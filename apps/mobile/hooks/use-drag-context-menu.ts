import { useCallback, useMemo, useRef } from 'react';
import { View } from 'react-native';
import { useReorderableDrag } from 'react-native-reorderable-list';

import { useOpenContextMenu } from '@/components/context-menu';

// Wires up a row's "…" button to open a shared Edit/Delete context menu,
// anchored to the button itself, and keeps drag-to-reorder on a plain long
// press (grabbing anywhere on the row still reorders it).
// Must be used inside a ReorderableList item component.
export function useDragContextMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const openMenuAt = useOpenContextMenu();
  const menuButtonRef = useRef<View>(null);
  const drag = useReorderableDrag();

  const actions = useMemo(
    () => [
      { label: 'Edit', icon: 'pencil' as const, onPress: onEdit },
      { label: 'Delete', icon: 'trash' as const, destructive: true, onPress: onDelete },
    ],
    [onEdit, onDelete]
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
