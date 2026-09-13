import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';

export default function WorkoutScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Workout' }} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
