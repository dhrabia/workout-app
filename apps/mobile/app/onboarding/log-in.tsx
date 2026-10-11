import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/onboarding-button';
import { OnboardingDivider } from '@/components/onboarding/onboarding-divider';
import { OnboardingEmailField } from '@/components/onboarding/onboarding-email-field';
import { OnboardingErrorText } from '@/components/onboarding/onboarding-error-text';
import { OnboardingFormScreen } from '@/components/onboarding/onboarding-form-screen';
import { OnboardingPasswordField } from '@/components/onboarding/onboarding-password-field';
import { OnboardingColors } from '@/constants/theme';
import { isValidEmail, signInWithEmail } from '@/lib/auth';

export default function LogInScreen() {
  const router = useRouter();
  const passwordInput = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Success needs no handling here: the new session flips `hasAccount`, which
  // swaps onboarding out of the root navigator and lands the user in the app.
  const signIn = useMutation({ mutationFn: signInWithEmail });

  const trimmedEmail = email.trim();
  const canSubmit = isValidEmail(trimmedEmail) && password.length > 0;

  function clearSubmitError() {
    if (signIn.isError) signIn.reset();
  }

  function submit() {
    if (!canSubmit || signIn.isPending) return;
    // Hides the keyboard so a failure message below the fields isn't covered by it.
    Keyboard.dismiss();
    signIn.mutate({ email: trimmedEmail, password });
  }

  return (
    <OnboardingFormScreen
      title="Log "
      highlight="in"
      subtitle="Enter your email and password to access your account."
      backTestID="auth.login.backButton">
      <View style={styles.fields}>
        <OnboardingEmailField
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            clearSubmitError();
          }}
          onSubmitEditing={() => passwordInput.current?.focus()}
          testID="auth.login.emailInput"
          errorTestID="auth.login.emailError"
        />

        <OnboardingPasswordField
          ref={passwordInput}
          placeholder="Enter your password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            clearSubmitError();
          }}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          testID="auth.login.passwordInput"
          toggleTestID="auth.login.passwordVisibilityToggle"
        />
      </View>

      <OnboardingErrorText message={signIn.error?.message} testID="auth.login.errorMessage" />

      <View style={styles.submit}>
        <OnboardingButton
          label="Log in"
          chevron
          loading={signIn.isPending}
          disabled={!canSubmit}
          onPress={submit}
          testID="auth.login.submitButton"
        />
      </View>

      <View style={styles.signUp}>
        <OnboardingDivider label="Don't have an account?" />
        <Pressable
          onPress={() => router.dismissTo('/onboarding/create-account')}
          hitSlop={8}
          accessibilityRole="button"
          style={styles.signUpLink}
          testID="auth.login.createAccountLink">
          <Text style={styles.signUpLabel}>Create account</Text>
        </Pressable>
      </View>
    </OnboardingFormScreen>
  );
}

const styles = StyleSheet.create({
  fields: { gap: 24 },
  submit: { marginTop: 32 },
  signUp: { marginTop: 'auto', paddingTop: 32, paddingBottom: 16, gap: 14 },
  signUpLink: { alignSelf: 'center' },
  signUpLabel: { fontSize: 16, fontWeight: '600', color: OnboardingColors.accent },
});
