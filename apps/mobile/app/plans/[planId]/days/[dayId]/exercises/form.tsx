import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { FormField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { NumberStepper } from '@/components/number-stepper';
import { SubmitButton } from '@/components/submit-button';
import { ThemedText } from '@/components/themed-text';
import {
  usePlanExercise,
  useCreatePlanExercise,
  useUpdatePlanExercise,
  useDeletePlanExercise,
} from '@/hooks/queries/use-plan-exercises';
import { confirmDestructive } from '@/lib/alerts';

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

  const displayName = existing?.exercise.name ?? exerciseName;

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
      <Stack.Screen options={{ title: isEditing ? 'Edit Exercise' : 'Add to Day' }} />
      <ThemedText type="subtitle">{displayName}</ThemedText>
      <NumberStepper
        label="Sets"
        value={sets}
        onChangeText={setSets}
        step={1}
        min={1}
        placeholder="e.g. 4"
        error={setsError}
      />
      <NumberStepper
        label="Reps"
        value={reps}
        onChangeText={setReps}
        step={1}
        min={1}
        keyboardType="default"
        placeholder="e.g. 8-12"
        error={repsError}
      />
      <NumberStepper
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        step={(current) => (current >= 40 ? 2.5 : 0.5)}
        min={0}
        decimals={1}
        suffix="kg"
        placeholder="Optional"
      />
      <NumberStepper
        label="Rest"
        value={rest}
        onChangeText={setRest}
        step={15}
        min={0}
        suffix="s"
        placeholder="Optional"
      />
      <FormField
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional"
        multiline
      />
      <SubmitButton label="Save" pending={mutation.isPending} onPress={handleSubmit} />
      {isEditing ? (
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <ThemedText style={styles.deleteText}>Remove exercise</ThemedText>
        </Pressable>
      ) : null}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  deleteButton: { padding: 14, alignItems: 'center' },
  deleteText: { color: '#e53935' },
});
