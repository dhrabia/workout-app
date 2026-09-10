import { useEffect, useId, useRef, useState, type ComponentProps } from 'react';
import { InputAccessoryView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FieldCard, FieldCardLabel } from '@/components/ui/field-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeColor } from '@/hooks/use-theme-color';

export type NumberStepperProps = {
  label: string;
  icon?: ComponentProps<typeof IconSymbol>['name'];
  value: string;
  onChangeText: (value: string) => void;
  step?: number | ((current: number) => number);
  min?: number;
  decimals?: number;
  suffix?: string;
  placeholder?: string;
  keyboardType?: 'number-pad' | 'decimal-pad' | 'default';
  error?: string;
  // Prefix for this instance's controls, since a screen can render several
  // steppers side by side (e.g. Sets/Reps/Weight/Rest) with identical
  // internal structure — appended with `-value`/`-minus`/`-plus`.
  testID?: string;
};

const REPEAT_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 100;

function format(n: number, decimals: number) {
  if (decimals <= 0) return String(Math.round(n));
  return String(parseFloat(n.toFixed(decimals)));
}

// A card-style +/- stepper: a leading icon/label row, a large tap-to-edit
// value below it, and a pair of circular repeat-on-hold buttons. Used by the
// exercise form (Sets/Reps/Weight/Rest) — see that screen for the visual
// language this matches (Body screen's cards, etc).
export function NumberStepper({
  label,
  icon,
  value,
  onChangeText,
  step = 1,
  min = 0,
  decimals = 0,
  suffix,
  placeholder = '—',
  keyboardType = 'number-pad',
  error,
  testID,
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
  const placeholderColor = useThemeColor({}, 'textDisabled');
  const errorColor = useThemeColor({}, 'error');
  const cardBackground = useThemeColor({}, 'cardBackground');
  const borderColor = useThemeColor({}, 'border');
  const controlBackground = useThemeColor({}, 'cardElevated');
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
    <FieldCard>
      <View style={styles.row}>
        <View style={styles.main}>
          <FieldCardLabel label={label} icon={icon} />
          {isEditing ? (
            <>
              <TextInput
                ref={inputRef}
                testID={testID ? `${testID}-value` : undefined}
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
                  <View style={[styles.accessory, { backgroundColor: cardBackground }]}>
                    <Pressable onPress={() => inputRef.current?.blur()} hitSlop={8}>
                      <ThemedText style={[styles.doneText, { color: tint }]}>Done</ThemedText>
                    </Pressable>
                  </View>
                </InputAccessoryView>
              )}
            </>
          ) : (
            <Pressable
              onPress={startEditing}
              hitSlop={8}
              style={styles.valueDisplay}
              testID={testID ? `${testID}-value` : undefined}>
              <ThemedText style={[styles.valueText, { color: hasValue ? textColor : placeholderColor }]}>
                {hasValue ? `${value}${suffix ? ` ${suffix}` : ''}` : placeholder}
              </ThemedText>
            </Pressable>
          )}
        </View>
        <View style={styles.controls}>
          <Pressable
            onPressIn={() => startRepeating(-1)}
            onPressOut={stopRepeating}
            hitSlop={8}
            style={[styles.circleButton, { backgroundColor: controlBackground, borderColor }]}
            testID={testID ? `${testID}-minus` : undefined}>
            <IconSymbol name="minus" size={16} color={tint} />
          </Pressable>
          <Pressable
            onPressIn={() => startRepeating(1)}
            onPressOut={stopRepeating}
            hitSlop={8}
            style={[styles.circleButton, { backgroundColor: controlBackground, borderColor }]}
            testID={testID ? `${testID}-plus` : undefined}>
            <IconSymbol name="plus" size={16} color={tint} />
          </Pressable>
        </View>
      </View>
      {error ? <ThemedText style={[styles.error, { color: errorColor }]}>{error}</ThemedText> : null}
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  main: { flex: 1, gap: 4 },
  valueDisplay: { alignSelf: 'flex-start' },
  valueText: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  valueInput: { fontSize: 28, fontWeight: '700', lineHeight: 34, padding: 0 },
  controls: { flexDirection: 'row', gap: 10 },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { fontSize: 13 },
  accessory: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  doneText: { fontSize: 16, fontWeight: '600' },
});
