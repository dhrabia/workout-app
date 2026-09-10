import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';

import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { NumberStepper } from '@/components/number-stepper';
import { SubmitButton } from '@/components/submit-button';
import { ThemedText } from '@/components/themed-text';
import { FieldCard, FieldCardLabel } from '@/components/ui/field-card';
import {
  usePlanExercise,
  useCreatePlanExercise,
  useUpdatePlanExercise,
  useDeletePlanExercise,
} from '@/hooks/queries/use-plan-exercises';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirmDestructive } from '@/lib/alerts';
import { formatMuscleGroup, MUSCLE_ICONS } from '@/lib/muscle-icons';

export default function PlanExerciseFormScreen() {
  const { planId, dayId, planExerciseId, exerciseId, exerciseName } = useLocalSearchParams<{
    planId: string;
    dayId: string;
    planExerciseId?: string;
    exerciseId?: string;
    exerciseName?: string;
  }>();
  const router = useRouter();
  const isEditing = !!planExerciseId;

  const { data: existing } = usePlanExercise(planExerciseId ?? '');
  const createPlanExercise = useCreatePlanExercise(dayId, planId);
  const updatePlanExercise = useUpdatePlanExercise(planExerciseId ?? '', dayId);
  const deletePlanExercise = useDeletePlanExercise(dayId, planId);
  const mutation = isEditing ? updatePlanExercise : createPlanExercise;
  const tint = useThemeColor({}, 'tint');
  const errorColor = useThemeColor({}, 'error');

  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rest, setRest] = useState('');
  const [notes, setNotes] = useState('');
  const [setsError, setSetsError] = useState<string | undefined>();
  const [repsError, setRepsError] = useState<string | undefined>();

  useEffect(() => {
    if (existing) {
      setSets(String(existing.target_sets));
      setReps(existing.target_reps);
      setWeight(existing.target_weight_kg != null ? String(existing.target_weight_kg) : '');
      setRest(existing.rest_seconds != null ? String(existing.rest_seconds) : '');
      setNotes(existing.notes ?? '');
    }
  }, [existing]);

  const displayName = existing?.exercise.name_en ?? exerciseName;

  function handleSubmit() {
    const setsNumber = parseInt(sets, 10);
    const isSetsInvalid = !Number.isFinite(setsNumber) || setsNumber <= 0;
    const isRepsInvalid = !reps.trim();

    setSetsError(isSetsInvalid ? 'Sets (a positive number) are required' : undefined);
    setRepsError(isRepsInvalid ? 'Reps (a positive number) are required' : undefined);
    if (isSetsInvalid || isRepsInvalid) return;

    const resolvedExerciseId = existing?.exercise_id ?? exerciseId;
    if (!resolvedExerciseId) return;

    mutation.mutate(
      {
        exercise_id: resolvedExerciseId,
        target_sets: setsNumber,
        target_reps: reps.trim(),
        target_weight_kg: weight.trim() ? parseFloat(weight) : null,
        rest_seconds: rest.trim() ? parseInt(rest, 10) : null,
        notes: notes.trim() || null,
      },
      {
        onSuccess: () =>
          // Reaching this screen may have gone through the category picker and/or the
          // custom-exercise form, both stacked on top of the day screen — dismissTo
          // collapses however many of those are present, rather than just popping one.
          router.dismissTo({ pathname: '/plans/[planId]/days/[dayId]', params: { planId, dayId } }),
      }
    );
  }

  function handleDelete() {
    if (!planExerciseId) return;
    confirmDestructive('Remove exercise?', undefined, 'Remove', () =>
      deletePlanExercise.mutate(planExerciseId, { onSuccess: () => router.back() })
    );
  }

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Exercise' : 'Add to Day',
          headerLeft: () => (
            <HeaderIconButton
              name="xmark"
              size={22}
              color={tint}
              onPress={() => router.back()}
              testID="exercise-form-close-button"
            />
          ),
          headerRight: () =>
            isEditing ? (
              <HeaderIconButton
                name="trash"
                size={22}
                color={errorColor}
                onPress={handleDelete}
                testID="exercise-form-delete-button"
              />
            ) : undefined,
        }}
      />
      <View style={styles.header}>
        <ThemedText style={styles.exerciseName}>{displayName}</ThemedText>
        {existing?.exercise ? (
          <View style={styles.typeRow}>
            <Image
              source={MUSCLE_ICONS[existing.exercise.muscle_group]}
              style={styles.typeIcon}
              resizeMode="contain"
            />
            <View>
              <ThemedText style={styles.typeLabel}>Muscle group</ThemedText>
              <ThemedText type="defaultSemiBold">
                {formatMuscleGroup(existing.exercise.muscle_group)}
              </ThemedText>
            </View>
          </View>
        ) : null}
      </View>

      <NumberStepper
        label="Sets"
        icon="square.stack.fill"
        value={sets}
        onChangeText={setSets}
        step={1}
        min={1}
        placeholder="e.g. 4"
        error={setsError}
        testID="exercise-form-sets"
      />
      <NumberStepper
        label="Reps"
        icon="arrow.2.squarepath"
        value={reps}
        onChangeText={setReps}
        step={1}
        min={1}
        keyboardType="default"
        placeholder="e.g. 8-12"
        error={repsError}
        testID="exercise-form-reps"
      />
      <NumberStepper
        label="Weight"
        icon="dumbbell.fill"
        value={weight}
        onChangeText={setWeight}
        step={(current) => (current >= 40 ? 2.5 : 0.5)}
        min={0}
        decimals={1}
        suffix="kg"
        placeholder="Optional"
        testID="exercise-form-weight"
      />
      <NumberStepper
        label="Rest"
        icon="clock"
        value={rest}
        onChangeText={setRest}
        step={15}
        min={0}
        suffix="s"
        placeholder="Optional"
        testID="exercise-form-rest"
      />
      <NotesCard value={notes} onChangeText={setNotes} />

      <SubmitButton
        label="Save"
        pending={mutation.isPending}
        onPress={handleSubmit}
        size="large"
        testID="exercise-form-save-button"
      />
    </FormScreen>
  );
}

function NotesCard({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  const textColor = useThemeColor({}, 'text');
  const placeholderColor = useThemeColor({}, 'textDisabled');

  return (
    <FieldCard style={styles.notesCard}>
      <FieldCardLabel label="Notes" icon="doc.text.fill" />
      <TextInput
        testID="exercise-form-notes-input"
        style={[styles.notesInput, { color: textColor }]}
        value={value}
        onChangeText={onChangeText}
        placeholder="Add notes (optional)"
        placeholderTextColor={placeholderColor}
        multiline
      />
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  header: { gap: 12 },
  exerciseName: { fontSize: 26, fontWeight: '700', lineHeight: 32 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: { width: 32, height: 32 },
  typeLabel: { fontSize: 12, opacity: 0.6, marginBottom: 1 },

  notesCard: { gap: 10 },
  notesInput: { fontSize: 16, minHeight: 72, textAlignVertical: 'top', padding: 0 },
});
