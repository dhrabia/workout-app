import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import { HeaderIconButton } from '@/components/header-icon-button';
import { ListCard } from '@/components/list-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDeletePlan, usePlans, useReorderPlans } from '@/hooks/queries/use-plans';
import { useDragContextMenu } from '@/hooks/use-drag-context-menu';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirmDestructive } from '@/lib/alerts';
import type { Tables } from '@workout-app/shared';

export default function PlansScreen() {
  const router = useRouter();
  const { data: plansData, isLoading } = usePlans();
  const plans = plansData ?? [];
  const reorderPlans = useReorderPlans();
  const deletePlan = useDeletePlan();
  const tint = useThemeColor({}, 'tint');
  // A near-zero activation distance so the drag reliably engages even when a
  // long press is held almost perfectly still, instead of getting stuck
  // between "armed" and released.
  const panGesture = useMemo(() => Gesture.Pan().minDistance(1), []);

  function handleDeletePlan(planId: string) {
    confirmDestructive('Delete plan?', 'This removes all its days and exercises too.', 'Delete', () =>
      deletePlan.mutate(planId)
    );
  }

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
          panGesture={panGesture}
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
              onEdit={() => router.push({ pathname: '/plans/form', params: { planId: item.id } })}
              onDelete={() => handleDeletePlan(item.id)}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

function PlanCard({
  item,
  onPress,
  onEdit,
  onDelete,
}: {
  item: Tables<'workout_plans'>;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const borderColor = useThemeColor({}, 'icon');
  const { menuButtonRef, onLongPress, onMenuPress } = useDragContextMenu({ onEdit, onDelete });

  return (
    <ListCard
      title={item.name}
      titleStyle={styles.title}
      style={styles.card}
      onPress={onPress}
      onLongPress={onLongPress}
      onMenuPress={onMenuPress}
      menuButtonRef={menuButtonRef}
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
  card: { paddingVertical: 32, paddingHorizontal: 32 },
  title: { fontSize: 32, lineHeight: 40 },
  meta: { fontSize: 15 },
  empty: { padding: 32, alignItems: 'center', gap: 8 },
  centerText: { textAlign: 'center', marginTop: 32 },
});
