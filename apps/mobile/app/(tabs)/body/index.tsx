import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedView } from '@/components/themed-view';

export default function BodyScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Body' }} />
      <EmptyState title="Body" description="Body tracking will live here." />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
});
