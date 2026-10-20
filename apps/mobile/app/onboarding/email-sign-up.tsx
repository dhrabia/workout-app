import { useMutation } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/onboarding-button';
import { OnboardingEmailField } from '@/components/onboarding/onboarding-email-field';
import { OnboardingErrorText } from '@/components/onboarding/onboarding-error-text';
import { OnboardingFormScreen } from '@/components/onboarding/onboarding-form-screen';
import { OnboardingPasswordField } from '@/components/onboarding/onboarding-password-field';
import { OnboardingColors } from '@/constants/theme';
import { isValidEmail, MIN_PASSWORD_LENGTH, signUpWithEmail } from '@/lib/auth';

export default function EmailSignUpScreen() {
  const passwordInput = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Success needs no handling here: the new session flips `hasAccount`, which
  // swaps onboarding out of the root navigator and lands the user in the app.
  const signUp = useMutation({ mutationFn: signUpWithEmail });

  const trimmedEmail = email.trim();
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH;
  const canSubmit = isValidEmail(trimmedEmail) && passwordValid;
  const passwordTooShort = passwordTouched && !passwordValid;

  function clearSubmitError() {
    if (signUp.isError) signUp.reset();
  }

  function submit() {
    if (!canSubmit || signUp.isPending) return;
    // Hides the keyboard so a failure message below the fields isn't covered by it.
    Keyboard.dismiss();
    signUp.mutate({ email: trimmedEmail, password });
  }

  return (
    <OnboardingFormScreen
      title={'Create\nyour '}
      highlight="account"
      subtitle="Enter your email and create a password to get started."
      backTestID="signup-back-button">
      <View style={styles.fields}>
        <OnboardingEmailField
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearSubmitError();
          }}
          onSubmitEditing={() => passwordInput.current?.focus()}
          testID="signup-email-input"
          errorTestID="signup-email-error"
        />

        <View>
          <OnboardingPasswordField
            ref={passwordInput}
            placeholder="Create a password"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              clearSubmitError();
            }}
            onBlur={() => setPasswordTouched(true)}
            autoComplete="new-password"
            // iOS would otherwise offer "Use Strong Password?" here, a sheet that swallows typing and breaks UI tests.
            textContentType="oneTimeCode"
            returnKeyType="go"
            onSubmitEditing={submit}
            hasError={passwordTooShort}
            testID="signup-password-input"
            toggleTestID="signup-password-visibility-toggle"
          />
          <Text style={[styles.helper, passwordTooShort && styles.helperError]}>
            Must be at least {MIN_PASSWORD_LENGTH} characters.
          </Text>
        </View>
      </View>

      <OnboardingErrorText message={signUp.error?.message} testID="signup-error-message" />

      <View style={styles.submit}>
        <OnboardingButton
          label="Create account"
          chevron
          loading={signUp.isPending}
          disabled={!canSubmit}
          onPress={submit}
          testID="signup-submit-button"
        />
      </View>
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 24 },
  helper: { marginTop: 8, fontSize: 14, color: OnboardingColors.textFaint },
  helperError: { color: OnboardingColors.error },
  submit: { marginTop: 32 },
});
