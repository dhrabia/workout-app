import { Stack, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import ReorderableList, { reorderItems, useReorderableDrag } from 'react-native-reorderable-list';

import { HeaderIconButton } from '@/components/header-icon-button';
import { ListCard } from '@/components/list-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { usePlans, useReorderPlans } from '@/hooks/queries/use-plans';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Tables } from '@workout-app/shared';

export default function PlansScreen() {
  const router = useRouter();
  const { data: plansData, isLoading } = usePlans();
  const plans = plansData ?? [];
  const reorderPlans = useReorderPlans();
  const tint = useThemeColor({}, 'tint');

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Plans',
          headerRight: () => (
            <HeaderIconButton
              name="plus"
              size={24}
              color={tint}
              onPress={() => router.push('/plans/form')}
            />
          ),
        }}
      />
      {isLoading ? (
        <ThemedText style={styles.centerText}>Loading…</ThemedText>
      ) : (
        <ReorderableList
          data={plans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="subtitle">No plans yet</ThemedText>
              <ThemedText>Tap + to create your first workout plan.</ThemedText>
            </View>
          }
          onReorder={({ from, to }) => reorderPlans.mutate(reorderItems(plans, from, to))}
          renderItem={({ item }) => (
            <PlanCard
              item={item}
              onPress={() =>
                router.push({ pathname: '/plans/[planId]', params: { planId: item.id } })
              }
            />
          )}
        />
      )}
    </ThemedView>
  );
}

function PlanCard({ item, onPress }: { item: Tables<'workout_plans'>; onPress: () => void }) {
  const drag = useReorderableDrag();
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ListCard
      title={item.name}
      onPress={onPress}
      onLongPress={drag}
      meta={
        item.description ? (
          <ThemedText style={[styles.meta, { color: borderColor }]} numberOfLines={1}>
            {item.description}
          </ThemedText>
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16, gap: 12 },
  meta: { fontSize: 13 },
  empty: { padding: 32, alignItems: 'center', gap: 8 },
  centerText: { textAlign: 'center', marginTop: 32 },
});
