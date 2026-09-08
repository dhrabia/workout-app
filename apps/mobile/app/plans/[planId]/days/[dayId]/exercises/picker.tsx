import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { HeaderIconButton } from '@/components/header-icon-button';
import { LoadingState } from '@/components/loading-state';
import { OutlineButton } from '@/components/outline-button';
import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FieldCard, FieldCardInput } from '@/components/ui/field-card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useExerciseCatalog } from '@/hooks/queries/use-exercises';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatMuscleGroup } from '@/lib/muscle-icons';

export default function ExercisePickerScreen() {
  const { planId, dayId, muscleGroup } = useLocalSearchParams<{
    planId: string;
    dayId: string;
    muscleGroup: string;
  }>();
  const router = useRouter();
  const { data: exercises, isLoading } = useExerciseCatalog();
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const tint = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const byGroup = useMemo(
    () => (exercises ?? []).filter((exercise) => exercise.muscle_group === muscleGroup),
    [exercises, muscleGroup]
  );
  const q = query.trim().toLowerCase();
  const filtered = q
    ? byGroup.filter((exercise) => exercise.name_en.toLowerCase().includes(q))
    : byGroup;

  function selectExercise(exerciseId: string, exerciseName: string) {
    router.push({
      pathname: '/plans/[planId]/days/[dayId]/exercises/form',
      params: { planId, dayId, exerciseId, exerciseName },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: formatMuscleGroup(muscleGroup),
          headerLeft: () => (
            <HeaderIconButton name="xmark" size={22} color={tint} onPress={() => router.back()} />
          ),
        }}
      />
      <View style={styles.searchWrap}>
        <FieldCardInput icon="magnifyingglass" value={query} onChangeText={setQuery} placeholder="Search exercises" />
      </View>
      <View style={styles.sectionHeader}>
        <SectionLabel count={byGroup.length}>{`${formatMuscleGroup(muscleGroup)} exercises`}</SectionLabel>
      </View>
      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          style={styles.flatList}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <EmptyState
              title="No exercises found"
              description={q ? 'Try a different search term.' : 'No exercises in this muscle group yet.'}
            />
          }
          renderItem={({ item }) => (
            <ExercisePickerRow name={item.name_en} onPress={() => selectExercise(item.id, item.name_en)} />
          )}
        />
      )}
      <OutlineButton
        icon="plus"
        label="Create custom exercise"
        onPress={() =>
          router.push({
            pathname: '/exercises/new',
            params: { returnPlanId: planId, returnDayId: dayId, muscleGroup },
          })
        }
        variant="primary"
        style={{ marginBottom: insets.bottom + 16 }}
      />
    </ThemedView>
  );
}

function ExercisePickerRow({ name, onPress }: { name: string; onPress: () => void }) {
  const controlBackground = useThemeColor({}, 'cardElevated');
  const borderColor = useThemeColor({}, 'border');
  const tint = useThemeColor({}, 'tint');

  return (
    <FieldCard onPress={onPress} style={styles.row}>
      <ThemedText type="defaultSemiBold" style={styles.rowName}>
        {name}
      </ThemedText>
      <View style={[styles.addButton, { backgroundColor: controlBackground, borderColor }]}>
        <IconSymbol name="plus" size={18} color={tint} />
      </View>
    </FieldCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 4 },
  flatList: { flex: 1 },
  list: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  rowName: { flex: 1, fontSize: 18, lineHeight: 24 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
