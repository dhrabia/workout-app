import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { SubmitButton } from '@/components/submit-button';
import { usePlan, useCreatePlan, useUpdatePlan } from '@/hooks/queries/use-plans';

export default function PlanFormScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const router = useRouter();
  const isEditing = !!planId;

  const { data: existingPlan } = usePlan(planId ?? '');
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan(planId ?? '');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (existingPlan) {
      setName(existingPlan.name);
      setDescription(existingPlan.description ?? '');
    }
  }, [existingPlan]);

  const mutation = isEditing ? updatePlan : createPlan;

  function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    mutation.mutate(
      { name: name.trim(), description: description.trim() || null },
      { onSuccess: () => router.back() }
    );
  }

  return (
    <FormScreen>
      <Stack.Screen options={{ title: isEditing ? 'Edit Plan' : 'New Plan' }} />
      <FormField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Push Pull Legs"
        error={error}
      />
      <FormField
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="Optional"
        multiline
      />
      <SubmitButton label="Save" pending={mutation.isPending} onPress={handleSubmit} />
    </FormScreen>
  );
}
