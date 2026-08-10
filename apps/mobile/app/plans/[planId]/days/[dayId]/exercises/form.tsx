import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { FormField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
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
  const { dayId, planExerciseId, exerciseId, exerciseName } = useLocalSearchParams<{
    planId: string;
    dayId: string;
    planExerciseId?: string;
    exerciseId?: string;
    exerciseName?: string;
  }>();
  const router = useRouter();
  const isEditing = !!planExerciseId;

  const { data: existing } = usePlanExercise(planExerciseId ?? '');
  const createPlanExercise = useCreatePlanExercise(dayId);
  const updatePlanExercise = useUpdatePlanExercise(planExerciseId ?? '', dayId);
  const deletePlanExercise = useDeletePlanExercise(dayId);
  const mutation = isEditing ? updatePlanExercise : createPlanExercise;

  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [rest, setRest] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | undefined>();

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
    if (!reps.trim() || !Number.isFinite(setsNumber) || setsNumber <= 0) {
      setError('Sets (a positive number) and reps are required');
      return;
    }

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
      { onSuccess: () => router.back() }
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
      <FormField
        label="Sets"
        value={sets}
        onChangeText={setSets}
        keyboardType="number-pad"
        error={error}
      />
      <FormField label="Reps" value={reps} onChangeText={setReps} placeholder="e.g. 8-12" />
      <FormField
        label="Weight (kg)"
        value={weight}
        onChangeText={setWeight}
        keyboardType="decimal-pad"
        placeholder="Optional"
      />
      <FormField
        label="Rest (seconds)"
        value={rest}
        onChangeText={setRest}
        keyboardType="number-pad"
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
