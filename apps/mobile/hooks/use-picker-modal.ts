import { useState } from 'react';

// Tracks which field (if any) is open in a "tap a row → open a picker modal
// → mutate on save" flow (Profile's info rows, Body's measurement grid).
// `key` changes on every open so a dismissed, unsaved selection doesn't
// linger next time — remounting the modal resets its internal selection
// back to `value` (see WheelPickerModal / RulerPickerModal / SingleChoiceModal).
export function usePickerModal<T>() {
  const [field, setField] = useState<T | null>(null);

  return {
    field,
    visible: field !== null,
    key: field === null ? 'closed' : String(field),
    open: setField,
    close: () => setField(null),
  };
}
