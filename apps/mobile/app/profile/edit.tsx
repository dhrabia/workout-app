import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { SubmitButton } from '@/components/submit-button';
import { FieldCard, FieldCardInput, FieldCardLabel } from '@/components/ui/field-card';
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
      <FieldCard>
        <FieldCardLabel label="Name" icon="doc.text.fill" />
        <FieldCardInput value={name} onChangeText={setName} placeholder="Your name" error={error} />
      </FieldCard>
      <SubmitButton
        label="Save"
        pending={updateProfile.isPending}
        onPress={handleSubmit}
        size="large"
        muted={!name.trim()}
      />
    </FormScreen>
  );
}
