import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedView } from '@/components/themed-view';

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Profile' }} />
      <EmptyState title="Profile" description="Settings will live here." />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
});
