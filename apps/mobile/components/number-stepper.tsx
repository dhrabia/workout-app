import { useEffect, useId, useRef, useState } from 'react';
import { InputAccessoryView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export type NumberStepperProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  step?: number | ((current: number) => number);
  min?: number;
  decimals?: number;
  suffix?: string;
  placeholder?: string;
  keyboardType?: 'number-pad' | 'decimal-pad' | 'default';
  error?: string;
};

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 100;

function format(n: number, decimals: number) {
  if (decimals <= 0) return String(Math.round(n));
  return String(parseFloat(n.toFixed(decimals)));
}

export function NumberStepper({
  label,
  value,
  onChangeText,
  step = 1,
  min = 0,
  decimals = 0,
  suffix,
  placeholder = '—',
  keyboardType = 'number-pad',
  error,
}: NumberStepperProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<TextInput>(null);
  // A single self-rescheduling timer, guarded by `activeDirection`: every tick checks
  // it still matches before continuing, so a stale chain from an earlier press can
  // never keep running after stopRepeating() clears it (a setTimeout+setInterval pair
  // of refs couldn't guarantee that if a press started before the previous one's
  // timer was confirmed cleared).
  const activeDirection = useRef<1 | -1 | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set when +/- takes over from an in-progress manual edit, so the TextInput's own
  // onBlur (which fires right after, as part of the same touch) doesn't then commit
  // the stale unstepped draft over the value the stepper just wrote.
  const skipNextBlurCommit = useRef(false);

  const tint = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const mutedColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({}, 'background');
  const accessoryId = useId();

  useEffect(() => stopRepeating, []);

  function resolveStep(current: number, direction: 1 | -1) {
    const magnitude = typeof step === 'function' ? step(current) : step;
    return magnitude * direction;
  }

  function stepOnce(current: number, direction: 1 | -1) {
    const next = Math.max(min, current + resolveStep(current, direction));
    onChangeText(format(next, decimals));
    return next;
  }

  function tick(direction: 1 | -1, current: number, delay: number) {
    if (activeDirection.current !== direction) return;
    const next = stepOnce(current, direction);
    timer.current = setTimeout(() => tick(direction, next, REPEAT_INTERVAL_MS), delay);
  }

  function startRepeating(direction: 1 | -1) {
    stopRepeating();
    const base = parseFloat(isEditing ? draft : value) || 0;
    if (isEditing) {
      skipNextBlurCommit.current = true;
      setIsEditing(false);
    }
    activeDirection.current = direction;
    tick(direction, base, REPEAT_DELAY_MS);
  }

  function stopRepeating() {
    activeDirection.current = null;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function startEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function commitEditing() {
    setIsEditing(false);
    if (skipNextBlurCommit.current) {
      skipNextBlurCommit.current = false;
      return;
    }
    onChangeText(draft.trim());
  }

  const hasValue = !!value.trim();

  return (
    <View style={styles.container}>
      <ThemedText type="defaultSemiBold" style={styles.label}>
        {label}
      </ThemedText>
      <View style={styles.row}>
        <Pressable onPressIn={() => startRepeating(-1)} onPressOut={stopRepeating} hitSlop={8} style={styles.button}>
          <IconSymbol name="minus" size={18} color={tint} />
        </Pressable>
        {isEditing ? (
          <>
            <TextInput
              ref={inputRef}
              style={[styles.valueInput, { color: textColor }]}
              value={draft}
              onChangeText={setDraft}
              onBlur={commitEditing}
              onSubmitEditing={commitEditing}
              onFocus={() => {
                // selectTextOnFocus alone is unreliable together with autoFocus on iOS;
                // setSelection needs a tick after focus to actually stick.
                requestAnimationFrame(() => inputRef.current?.setSelection(0, draft.length));
              }}
              keyboardType={keyboardType}
              autoFocus
              selectTextOnFocus
              inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
            />
            {Platform.OS === 'ios' && (
              // number-pad/decimal-pad have no return key on iOS, so there's normally
              // no way to dismiss the keyboard other than tapping elsewhere.
              <InputAccessoryView nativeID={accessoryId}>
                <View style={[styles.accessory, { backgroundColor }]}>
                  <Pressable onPress={() => inputRef.current?.blur()} hitSlop={8}>
                    <ThemedText style={[styles.doneText, { color: tint }]}>Done</ThemedText>
                  </Pressable>
                </View>
              </InputAccessoryView>
            )}
          </>
        ) : (
          <Pressable onPress={startEditing} style={styles.valueDisplay}>
            <ThemedText style={[styles.valueText, { color: hasValue ? textColor : mutedColor }]}>
              {hasValue ? `${value}${suffix ? ` ${suffix}` : ''}` : placeholder}
            </ThemedText>
          </Pressable>
        )}
        <Pressable onPressIn={() => startRepeating(1)} onPressOut={stopRepeating} hitSlop={8} style={styles.button}>
          <IconSymbol name="plus" size={18} color={tint} />
        </Pressable>
      </View>
      {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: { paddingVertical: 10, paddingHorizontal: 16 },
  valueDisplay: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  valueText: { fontSize: 16 },
  valueInput: { flex: 1, paddingVertical: 10, fontSize: 16, textAlign: 'center' },
  error: { color: '#e53935', fontSize: 13 },
  accessory: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneText: { fontSize: 16, fontWeight: '600' },
});
