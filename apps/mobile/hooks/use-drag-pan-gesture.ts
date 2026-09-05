import { useMemo } from 'react';
import { Gesture } from 'react-native-gesture-handler';

// A near-zero activation distance so the drag reliably engages even when a
// long press is held almost perfectly still, instead of getting stuck
// between "armed" and released.
export function useDragPanGesture() {
  return useMemo(() => Gesture.Pan().minDistance(1), []);
}
