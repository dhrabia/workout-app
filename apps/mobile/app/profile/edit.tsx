import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { NumberStepper } from '@/components/number-stepper';
import { SubmitButton } from '@/components/submit-button';
import { useProfile, useUpdateProfile } from '@/hooks/queries/use-profile';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const tint = useThemeColor({}, 'tint');

  const [name, setName] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (profile) {
      setName(profile.username ?? '');
      setTargetWeight(profile.target_weight_kg != null ? String(profile.target_weight_kg) : '');
    }
  }, [profile]);

  function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    updateProfile.mutate(
      {
        username: name.trim(),
        target_weight_kg: targetWeight.trim() ? parseFloat(targetWeight) : null,
      },
      { onSuccess: () => router.back() }
    );
  }

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerLeft: () => (
            <HeaderIconButton name="xmark" size={22} color={tint} onPress={() => router.back()} />
          ),
        }}
      />
      <FormField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
        error={error}
      />
      <NumberStepper
        label="Target weight"
        value={targetWeight}
        onChangeText={setTargetWeight}
        step={0.5}
        min={0}
        decimals={1}
        suffix="kg"
        placeholder="Optional"
      />
      <SubmitButton label="Save" pending={updateProfile.isPending} onPress={handleSubmit} />
    </FormScreen>
  );
}
