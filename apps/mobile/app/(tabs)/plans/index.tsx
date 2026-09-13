import { Stack, useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import ReorderableList, { reorderItems } from 'react-native-reorderable-list';

import { EmptyState } from '@/components/empty-state';
import { HeaderIconButton } from '@/components/header-icon-button';
import { ListCard } from '@/components/list-card';
import { LoadingState } from '@/components/loading-state';
import { Pill } from '@/components/pill';
import { ThemedView } from '@/components/themed-view';
import {
  activatePlanInList,
  useDeletePlan,
  usePlans,
  useReorderPlans,
  useSetActivePlan,
} from '@/hooks/queries/use-plans';
import { useDragContextMenu } from '@/hooks/use-drag-context-menu';
import { useDragPanGesture } from '@/hooks/use-drag-pan-gesture';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirmDestructive } from '@/lib/alerts';
import type { Tables } from '@workout-app/shared';

// Indexed by each plan's persisted `background_image_index` (1-based, see
// useCreatePlan) — not by list position, so a plan keeps its photo when
// other plans are added, deleted, or reordered around it.
const PLAN_CARD_BACKGROUNDS = [
  require('@/assets/images/plan-card-background-1.jpg'),
  require('@/assets/images/plan-card-background-2.jpg'),
  require('@/assets/images/plan-card-background-3.jpg'),
  require('@/assets/images/plan-card-background-4.jpg'),
  require('@/assets/images/plan-card-background-5.jpg'),
];
// Previous card height (padding 32*2 + one 40pt title line) times 2.5.
const PLAN_CARD_HEIGHT = 260;

export default function PlansScreen() {
  const router = useRouter();
  const { data: plansData, isLoading } = usePlans();
  const plans = plansData ?? [];
  const reorderPlans = useReorderPlans();
  const deletePlan = useDeletePlan();
  const setActivePlan = useSetActivePlan();
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
              testID="plans-create-button"
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
              backgroundImage={
                PLAN_CARD_BACKGROUNDS[(item.background_image_index - 1) % PLAN_CARD_BACKGROUNDS.length]
              }
              onPress={() =>
                router.push({ pathname: '/plans/[planId]', params: { planId: item.id } })
              }
              onEdit={() => router.push({ pathname: '/plans/form', params: { planId: item.id } })}
              onDelete={() => handleDeletePlan(item.id)}
              onSetActive={() => setActivePlan.mutate(activatePlanInList(plans, item.id))}
            />
          )}
        />
      )}
    </ThemedView>
  );
}

function PlanCard({
  item,
  backgroundImage,
  onPress,
  onEdit,
  onDelete,
  onSetActive,
}: {
  item: Tables<'workout_plans'>;
  backgroundImage: number;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSetActive: () => void;
}) {
  const { menuButtonRef, onLongPress, onMenuPress } = useDragContextMenu({
    onEdit,
    onDelete,
    testIDPrefix: `plan-${item.id}`,
    // Already-active plans have nothing to activate, so the action is only
    // offered for the other plans.
    extraActions: item.is_active
      ? undefined
      : [
          {
            label: 'Set as active',
            icon: 'checkmark.circle',
            onPress: onSetActive,
            testID: `plan-${item.id}-set-active`,
          },
        ],
  });

  return (
    <ListCard
      title={item.name}
      titleStyle={styles.title}
      style={styles.card}
      backgroundImage={backgroundImage}
      badge={item.is_active ? <Pill label="Active" testID={`plan-${item.id}-active-pill`} /> : undefined}
      onPress={onPress}
      onLongPress={onLongPress}
      onMenuPress={onMenuPress}
      menuButtonRef={menuButtonRef}
      testID={`plan-card-${item.id}`}
      menuTestID={`plan-menu-${item.id}`}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // Extra bottom padding so the last card can clear the floating tab bar
  // (see Body screen's contentContainerStyle for the same convention).
  list: { padding: 16, paddingBottom: 100, gap: 12 },
  card: { height: PLAN_CARD_HEIGHT },
  title: { fontSize: 32, lineHeight: 40 },
});
