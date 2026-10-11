import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Pressable } from 'react-native';

import { OnboardingTextField } from '@/components/onboarding/onboarding-text-field';
import { OnboardingColors } from '@/constants/theme';

export function OnboardingPasswordField({
  toggleTestID,
  ...rest
}: Omit<ComponentProps<typeof OnboardingTextField>, 'label' | 'icon' | 'trailing' | 'secureTextEntry'> & {
  toggleTestID: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <OnboardingTextField
      label="Password"
      icon="lock-closed-outline"
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      trailing={
        <Pressable
          onPress={() => setVisible((current) => !current)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Hide password' : 'Show password'}
          testID={toggleTestID}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color={OnboardingColors.text} />
        </Pressable>
      }
      {...rest}
    />
  );
}
