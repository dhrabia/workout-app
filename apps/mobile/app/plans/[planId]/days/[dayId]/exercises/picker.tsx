import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useExerciseCatalog } from '@/hooks/queries/use-exercises';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function ExercisePickerScreen() {
  const { planId, dayId } = useLocalSearchParams<{ planId: string; dayId: string }>();
  const router = useRouter();
  const { data: exercises, isLoading } = useExerciseCatalog();
  const [query, setQuery] = useState('');
  const insets = useSafeAreaInsets();

  const borderColor = useThemeColor({}, 'icon');
  const tint = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');

  const filtered = useMemo(() => {
    if (!exercises) return [];
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((exercise) => exercise.name.toLowerCase().includes(q));
  }, [exercises, query]);

  function selectExercise(exerciseId: string, exerciseName: string) {
    router.replace({
      pathname: '/plans/[planId]/days/[dayId]/exercises/form',
      params: { planId, dayId, exerciseId, exerciseName },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Add Exercise' }} />
      <View style={[styles.searchRow, { borderColor }]}>
        <IconSymbol name="magnifyingglass" size={18} color={borderColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search exercises"
          placeholderTextColor={borderColor}
          value={query}
          onChangeText={setQuery}
        />
      </View>
      {isLoading ? (
        <ThemedText style={styles.centerText}>Loading…</ThemedText>
      ) : (
        <FlatList
          style={styles.flatList}
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => selectExercise(item.id, item.name)}
              style={[styles.row, { borderColor }]}>
              <ThemedText type="defaultSemiBold">{item.name}</ThemedText>
              <ThemedText>{item.muscle_group}</ThemedText>
            </Pressable>
          )}
        />
      )}
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/exercises/new',
            params: { returnPlanId: planId, returnDayId: dayId },
          })
        }
        style={[styles.addButton, { borderColor: tint, marginBottom: insets.bottom + 16 }]}>
        <ThemedText style={{ color: tint }}>+ Create custom exercise</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
  },
  searchInput: { flex: 1, fontSize: 16 },
  flatList: { flex: 1 },
  list: { padding: 16, gap: 12 },
  row: { padding: 16, borderWidth: 1, borderRadius: 12, gap: 4 },
  centerText: { textAlign: 'center', marginTop: 32 },
  addButton: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
});
