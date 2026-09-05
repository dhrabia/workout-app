import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

export function LoadingState() {
  return <ThemedText style={styles.text}>Loading…</ThemedText>;
}

const styles = StyleSheet.create({
  text: { textAlign: 'center', marginTop: 32 },
});
