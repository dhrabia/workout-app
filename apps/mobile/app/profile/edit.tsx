import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { SubmitButton } from '@/components/submit-button';
import { useProfile, useUpdateProfile } from '@/hooks/queries/use-profile';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const tint = useThemeColor({}, 'tint');

  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (profile) setName(profile.username ?? '');
  }, [profile]);

  function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    updateProfile.mutate({ username: name.trim() }, { onSuccess: () => router.back() });
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
      <SubmitButton label="Save" pending={updateProfile.isPending} onPress={handleSubmit} />
    </FormScreen>
  );
}
