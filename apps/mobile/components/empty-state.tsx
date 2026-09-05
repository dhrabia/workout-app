import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <ThemedView style={styles.empty}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText>{description}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  empty: { padding: 32, alignItems: 'center', gap: 8 },
});
