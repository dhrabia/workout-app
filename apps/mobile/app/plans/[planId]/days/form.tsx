import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { SubmitButton } from '@/components/submit-button';
import {
  usePlanDay,
  useCreatePlanDay,
  useUpdatePlanDay,
} from '@/hooks/queries/use-plan-days';

export default function DayFormScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId?: string }>();
  const router = useRouter();
  const isEditing = !!dayId;

  const { data: existingDay } = usePlanDay(dayId ?? '');
  const createDay = useCreatePlanDay(planId);
  const updateDay = useUpdatePlanDay(dayId ?? '', planId);

  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (existingDay) setName(existingDay.name);
  }, [existingDay]);

  const mutation = isEditing ? updateDay : createDay;

  function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    mutation.mutate({ name: name.trim() }, { onSuccess: () => router.back() });
  }

  return (
    <FormScreen>
      <Stack.Screen options={{ title: isEditing ? 'Edit Day' : 'New Day' }} />
      <FormField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Day A, Push, Legs"
        error={error}
      />
      <SubmitButton label="Save" pending={mutation.isPending} onPress={handleSubmit} />
    </FormScreen>
  );
}
