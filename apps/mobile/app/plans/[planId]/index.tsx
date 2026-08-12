import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import ReorderableList, { reorderItems, useReorderableDrag } from 'react-native-reorderable-list';

import { HeaderActions, HeaderIconButton } from '@/components/header-icon-button';
import { ListCard } from '@/components/list-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useDeletePlan, usePlan } from '@/hooks/queries/use-plans';
import { usePlanDays, useDeletePlanDay, useReorderPlanDays } from '@/hooks/queries/use-plan-days';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirmDestructive } from '@/lib/alerts';
import type { PlanDayWithExerciseCount } from '@/lib/types';

export default function PlanDetailScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();

  const { data: plan } = usePlan(planId);
  const { data: daysData, isLoading } = usePlanDays(planId);
  const days = daysData ?? [];
  const deletePlan = useDeletePlan();
  const deletePlanDay = useDeletePlanDay(planId);
  const reorderPlanDays = useReorderPlanDays(planId);

  const tint = useThemeColor({}, 'tint');

  function handleDeletePlan() {
    confirmDestructive('Delete plan?', 'This removes all its days and exercises too.', 'Delete', () =>
      deletePlan.mutate(planId, { onSuccess: () => router.back() })
    );
  }

  function handleDeleteDay(dayId: string) {
    confirmDestructive('Delete day?', 'This removes all its exercises too.', 'Delete', () =>
      deletePlanDay.mutate(dayId)
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: plan?.name ?? 'Plan',
          headerRight: () => (
            <HeaderActions>
              <HeaderIconButton
                name="pencil"
                size={22}
                color={tint}
                onPress={() => router.push({ pathname: '/plans/form', params: { planId } })}
              />
              <HeaderIconButton name="trash" size={22} color={tint} onPress={handleDeletePlan} />
            </HeaderActions>
          ),
        }}
      />
      {plan?.description ? (
        <ThemedText style={styles.description}>{plan.description}</ThemedText>
      ) : null}
      {isLoading ? (
        <ThemedText style={styles.centerText}>Loading…</ThemedText>
      ) : (
        <ReorderableList
          data={days}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText type="subtitle">No days yet</ThemedText>
              <ThemedText>Add a day to start building this plan.</ThemedText>
            </View>
          }
          onReorder={({ from, to }) => reorderPlanDays.mutate(reorderItems(days, from, to))}
          renderItem={({ item }) => (
            <DayCard
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/plans/[planId]/days/[dayId]',
                  params: { planId, dayId: item.id },
                })
              }
              onDelete={() => handleDeleteDay(item.id)}
            />
          )}
        />
      )}
      <Pressable
        onPress={() => router.push({ pathname: '/plans/[planId]/days/form', params: { planId } })}
        style={[styles.addButton, { borderColor: tint }]}>
        <ThemedText style={{ color: tint }}>+ Add Day</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function DayCard({
  item,
  onPress,
  onDelete,
}: {
  item: PlanDayWithExerciseCount;
  onPress: () => void;
  onDelete: () => void;
}) {
  const drag = useReorderableDrag();
  const borderColor = useThemeColor({}, 'icon');

  return (
    <ListCard
      title={item.name}
      onPress={onPress}
      onLongPress={drag}
      meta={
        <View style={styles.metaRow}>
          <ThemedText style={[styles.meta, { color: borderColor }]}>
            {item.exerciseCount} exercise{item.exerciseCount === 1 ? '' : 's'} ·
          </ThemedText>
          <IconSymbol name="clock" size={13} color={borderColor} />
          <ThemedText style={[styles.meta, { color: borderColor }]}>
            {item.exerciseCount * 10} min
          </ThemedText>
        </View>
      }
      trailing={
        <Pressable onPress={onDelete} hitSlop={8}>
          <IconSymbol name="trash" size={20} color={borderColor} />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  description: { paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16, gap: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 13 },
  empty: { padding: 32, alignItems: 'center', gap: 8 },
  centerText: { textAlign: 'center', marginTop: 32 },
  addButton: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
});
