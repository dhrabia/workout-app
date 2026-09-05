import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { SubmitButton } from '@/components/submit-button';
import {
  usePlanDay,
  useCreatePlanDay,
  useUpdatePlanDay,
} from '@/hooks/queries/use-plan-days';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function DayFormScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId?: string }>();
  const router = useRouter();
  const isEditing = !!dayId;

  const { data: existingDay } = usePlanDay(dayId ?? '');
  const createDay = useCreatePlanDay(planId);
  const updateDay = useUpdatePlanDay(dayId ?? '', planId);
  const tint = useThemeColor({}, 'tint');

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
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Day' : 'New Day',
          headerLeft: () => (
            <HeaderIconButton name="xmark" size={22} color={tint} onPress={() => router.back()} />
          ),
        }}
      />
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
