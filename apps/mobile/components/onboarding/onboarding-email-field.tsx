import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingTextField } from '@/components/onboarding/onboarding-text-field';
import { OnboardingColors } from '@/constants/theme';
import { isValidEmail } from '@/lib/auth';

export function OnboardingEmailField({
  value,
  onChangeText,
  onSubmitEditing,
  testID,
  errorTestID,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSubmitEditing: () => void;
  testID: string;
  errorTestID: string;
}) {
  const [touched, setTouched] = useState(false);
  const trimmed = value.trim();
  const invalid = touched && trimmed.length > 0 && !isValidEmail(trimmed);

  return (
    <View>
      <OnboardingTextField
        label="Email address"
        icon="mail-outline"
        placeholder="Enter your email"
        value={value}
        onChangeText={onChangeText}
        onBlur={() => setTouched(true)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={onSubmitEditing}
        hasError={invalid}
        testID={testID}
      />
      {invalid ? (
        <Text style={styles.error} testID={errorTestID}>
          Enter a valid email address.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  error: { marginTop: 8, fontSize: 14, color: OnboardingColors.error },
});
