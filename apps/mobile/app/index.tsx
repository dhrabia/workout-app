import { Stack, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { usePlans } from '@/hooks/queries/use-plans';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PlansScreen() {
  const router = useRouter();
  const { data: plans, isLoading } = usePlans();
  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Plans',
          headerRight: () => (
            <Pressable onPress={() => router.push('/plans/form')} hitSlop={8}>
              <IconSymbol name="plus" size={24} color={tint} />
            </Pressable>
          ),
        }}
      />
      {isLoading ? (
        <ThemedText style={styles.centerText}>Loading…</ThemedText>
      ) : (
        <FlatList
          data={plans ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText type="subtitle">No plans yet</ThemedText>
              <ThemedText>Tap + to create your first workout plan.</ThemedText>
            </ThemedView>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/plans/[planId]', params: { planId: item.id } })
              }
              style={[styles.row, { borderColor }]}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              {item.description ? (
                <ThemedText numberOfLines={1}>{item.description}</ThemedText>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  row: { padding: 16, borderWidth: 1, borderRadius: 12, gap: 4 },
  empty: { padding: 32, alignItems: 'center', gap: 8 },
  centerText: { textAlign: 'center', marginTop: 32 },
});
