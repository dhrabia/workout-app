import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { SubmitButton } from '@/components/submit-button';
import { FieldCard, FieldCardInput, FieldCardLabel } from '@/components/ui/field-card';
import { usePlan, useCreatePlan, useUpdatePlan } from '@/hooks/queries/use-plans';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PlanFormScreen() {
  const { planId } = useLocalSearchParams<{ planId?: string }>();
  const router = useRouter();
  const isEditing = !!planId;

  const { data: existingPlan } = usePlan(planId ?? '');
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan(planId ?? '');
  const tint = useThemeColor({}, 'tint');

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
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Plan' : 'New Plan',
          headerLeft: () => (
            <HeaderIconButton name="xmark" size={22} color={tint} onPress={() => router.back()} />
          ),
        }}
      />
      <FieldCard>
        <FieldCardLabel label="Name" icon="doc.text.fill" />
        <FieldCardInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Push Pull Legs"
          error={error}
        />
      </FieldCard>
      <FieldCard>
        <FieldCardLabel label="Description" icon="list.bullet" />
        <FieldCardInput
          value={description}
          onChangeText={setDescription}
          placeholder="Optional"
          multiline
        />
      </FieldCard>
      <SubmitButton
        label="Save"
        pending={mutation.isPending}
        onPress={handleSubmit}
        size="large"
        muted={!name.trim()}
      />
    </FormScreen>
  );
}
