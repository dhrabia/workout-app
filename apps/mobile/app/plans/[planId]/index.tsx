import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ReorderButtons } from '@/components/reorder-buttons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useDeletePlan, usePlan } from '@/hooks/queries/use-plans';
import { usePlanDays, useDeletePlanDay, useReorderPlanDay } from '@/hooks/queries/use-plan-days';
import { useThemeColor } from '@/hooks/use-theme-color';
import { confirmDestructive } from '@/lib/alerts';

export default function PlanDetailScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();

  const { data: plan } = usePlan(planId);
  const { data: daysData, isLoading } = usePlanDays(planId);
  const days = daysData ?? [];
  const deletePlan = useDeletePlan();
  const deletePlanDay = useDeletePlanDay(planId);
  const reorderPlanDay = useReorderPlanDay(planId);

  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'icon');

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
            <View style={styles.headerActions}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/plans/form', params: { planId } })
                }
                hitSlop={8}>
                <IconSymbol name="pencil" size={22} color={tint} />
              </Pressable>
              <Pressable onPress={handleDeletePlan} hitSlop={8}>
                <IconSymbol name="trash" size={22} color={tint} />
              </Pressable>
            </View>
          ),
        }}
      />
      {plan?.description ? (
        <ThemedText style={styles.description}>{plan.description}</ThemedText>
      ) : null}
      {isLoading ? (
        <ThemedText style={styles.centerText}>Loading…</ThemedText>
      ) : (
        <FlatList
          data={days}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <ThemedView style={styles.empty}>
              <ThemedText type="subtitle">No days yet</ThemedText>
              <ThemedText>Add a day to start building this plan.</ThemedText>
            </ThemedView>
          }
          renderItem={({ item, index }) => (
            <View style={[styles.row, { borderColor }]}>
              <ReorderButtons
                disableUp={index === 0}
                disableDown={index === days.length - 1}
                onMoveUp={() =>
                  reorderPlanDay.mutate({ dayIdA: item.id, dayIdB: days[index - 1].id })
                }
                onMoveDown={() =>
                  reorderPlanDay.mutate({ dayIdA: item.id, dayIdB: days[index + 1].id })
                }
              />
              <Pressable
                style={styles.rowContent}
                onPress={() =>
                  router.push({
                    pathname: '/plans/[planId]/days/[dayId]',
                    params: { planId, dayId: item.id },
                  })
                }>
                <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              </Pressable>
              <Pressable onPress={() => handleDeleteDay(item.id)} hitSlop={8}>
                <IconSymbol name="trash" size={20} color={borderColor} />
              </Pressable>
            </View>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row', gap: 16 },
  description: { paddingHorizontal: 16, paddingTop: 8 },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  rowContent: { flex: 1 },
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
