import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { SubmitButton } from '@/components/submit-button';
import { FieldCard, FieldCardInput, FieldCardLabel } from '@/components/ui/field-card';
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
            <HeaderIconButton
              name="xmark"
              size={22}
              color={tint}
              onPress={() => router.back()}
              testID="day-form-close-button"
            />
          ),
        }}
      />
      <FieldCard>
        <FieldCardLabel label="Name" icon="doc.text.fill" />
        <FieldCardInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Day A, Push, Legs"
          error={error}
          testID="day-form-name-input"
        />
      </FieldCard>
      <SubmitButton
        label="Save"
        pending={mutation.isPending}
        onPress={handleSubmit}
        size="large"
        muted={!name.trim()}
        testID="day-form-save-button"
      />
    </FormScreen>
  );
}
