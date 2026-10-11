import Ionicons from '@expo/vector-icons/Ionicons';
import { useMutation } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingBackButton } from '@/components/onboarding/onboarding-back-button';
import { OnboardingButton } from '@/components/onboarding/onboarding-button';
import { OnboardingTextField } from '@/components/onboarding/onboarding-text-field';
import { OnboardingColors } from '@/constants/theme';
import { isValidEmail, MIN_PASSWORD_LENGTH, signUpWithEmail } from '@/lib/auth';

export default function EmailSignUpScreen() {
  const insets = useSafeAreaInsets();
  const passwordInput = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Success needs no handling here: the new session flips `hasAccount`, which
  // swaps onboarding out of the root navigator and lands the user in the app.
  const signUp = useMutation({ mutationFn: signUpWithEmail });

  const trimmedEmail = email.trim();
  const emailValid = isValidEmail(trimmedEmail);
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH;
  const canSubmit = emailValid && passwordValid;
  const emailInvalid = emailTouched && trimmedEmail.length > 0 && !emailValid;
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
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled">
          <OnboardingBackButton style={styles.back} testID="auth.signup.backButton" />

          <Text style={styles.headline}>
            {'Create\nyour '}
            <Text style={styles.headlineAccent}>account</Text>
          </Text>
          <Text style={styles.subtitle}>Enter your email and create a password to get started.</Text>

          <View style={styles.fields}>
            <View>
              <OnboardingTextField
                label="Email address"
                icon="mail-outline"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearSubmitError();
                }}
                onBlur={() => setEmailTouched(true)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordInput.current?.focus()}
                hasError={emailInvalid}
                testID="auth.signup.emailInput"
              />
              {emailInvalid ? (
                <Text style={[styles.helper, styles.helperError]} testID="auth.signup.emailError">
                  Enter a valid email address.
                </Text>
              ) : null}
            </View>

            <View>
              <OnboardingTextField
                ref={passwordInput}
                label="Password"
                icon="lock-closed-outline"
                placeholder="Create a password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearSubmitError();
                }}
                onBlur={() => setPasswordTouched(true)}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="new-password"
                // iOS would otherwise offer "Use Strong Password?" here, a sheet that swallows typing and breaks UI tests.
                textContentType="oneTimeCode"
                returnKeyType="go"
                onSubmitEditing={submit}
                hasError={passwordTooShort}
                trailing={
                  <Pressable
                    onPress={() => setShowPassword((visible) => !visible)}
                    hitSlop={12}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    testID="auth.signup.passwordVisibilityToggle">
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={OnboardingColors.text}
                    />
                  </Pressable>
                }
                testID="auth.signup.passwordInput"
              />
              <Text style={[styles.helper, passwordTooShort && styles.helperError]}>
                Must be at least {MIN_PASSWORD_LENGTH} characters.
              </Text>
            </View>
          </View>

          {signUp.error ? (
            <Text style={styles.error} testID="auth.signup.errorMessage">
              {signUp.error.message}
            </Text>
          ) : null}

          <View style={styles.submit}>
            <OnboardingButton
              label="Create account"
              chevron
              loading={signUp.isPending}
              disabled={!canSubmit}
              onPress={submit}
              testID="auth.signup.submitButton"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22 },
  back: { alignSelf: 'flex-start', marginLeft: -6 },
  headline: { marginTop: 26, fontSize: 40, lineHeight: 46, fontWeight: '700', color: OnboardingColors.text },
  headlineAccent: { color: OnboardingColors.accent },
  subtitle: { marginTop: 10, fontSize: 16, lineHeight: 23, color: OnboardingColors.textMuted },
  fields: { marginTop: 32, gap: 24 },
  helper: { marginTop: 8, fontSize: 14, color: OnboardingColors.textFaint },
  helperError: { color: OnboardingColors.error },
  error: { marginTop: 16, fontSize: 14, lineHeight: 20, color: OnboardingColors.error },
  submit: { marginTop: 32 },
});
