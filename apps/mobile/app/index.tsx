import { Stack, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import { EmptyState } from '@/components/empty-state';
import { HeaderIconButton } from '@/components/header-icon-button';
import { ListCard } from '@/components/list-card';
import { LoadingState } from '@/components/loading-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDeletePlan, usePlans, useReorderPlans } from '@/hooks/queries/use-plans';
import { useDragContextMenu } from '@/hooks/use-drag-context-menu';
import { useDragPanGesture } from '@/hooks/use-drag-pan-gesture';
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
  const panGesture = useDragPanGesture();

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
        <LoadingState />
      ) : (
        <ReorderableList
          data={plans}
          keyExtractor={(item) => item.id}
          panGesture={panGesture}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              title="No plans yet"
              description="Tap + to create your first workout plan."
            />
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
});
