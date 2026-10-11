import { StyleSheet, Text } from 'react-native';

import { OnboardingColors } from '@/constants/theme';

export function OnboardingErrorText({ message, testID }: { message?: string; testID: string }) {
  if (!message) return null;

  return (
    <Text style={styles.error} testID={testID}>
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  error: { marginTop: 16, fontSize: 14, lineHeight: 20, color: OnboardingColors.error },
});
