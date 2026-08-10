import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormField } from '@/components/form-field';
import { FormScreen } from '@/components/form-screen';
import { SubmitButton } from '@/components/submit-button';
import { ThemedText } from '@/components/themed-text';
import { useCreateExercise } from '@/hooks/queries/use-exercises';
import { useThemeColor } from '@/hooks/use-theme-color';

const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'full_body',
  'cardio',
] as const;

export default function NewExerciseScreen() {
  const { returnPlanId, returnDayId } = useLocalSearchParams<{
    returnPlanId?: string;
    returnDayId?: string;
  }>();
  const router = useRouter();
  const createExercise = useCreateExercise();

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<(typeof MUSCLE_GROUPS)[number]>('full_body');
  const [equipment, setEquipment] = useState('');
  const [error, setError] = useState<string | undefined>();

  const tint = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({}, 'icon');
  const chipTextSelectedColor = useThemeColor({}, 'buttonText');

  function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    createExercise.mutate(
      { name: name.trim(), muscle_group: muscleGroup, equipment: equipment.trim() || null },
      {
        onSuccess: (created) => {
          if (returnPlanId && returnDayId) {
            router.replace({
              pathname: '/plans/[planId]/days/[dayId]/exercises/form',
              params: {
                planId: returnPlanId,
                dayId: returnDayId,
                exerciseId: created.id,
                exerciseName: created.name,
              },
            });
          } else {
            router.back();
          }
        },
      }
    );
  }

  return (
    <FormScreen>
      <Stack.Screen options={{ title: 'New Exercise' }} />
      <FormField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Cable Fly"
        error={error}
      />
      <View style={styles.chipsSection}>
        <ThemedText type="defaultSemiBold">Muscle group</ThemedText>
        <View style={styles.chips}>
          {MUSCLE_GROUPS.map((group) => {
            const selected = group === muscleGroup;
            return (
              <Pressable
                key={group}
                onPress={() => setMuscleGroup(group)}
                style={[
                  styles.chip,
                  { borderColor: selected ? tint : borderColor },
                  selected && { backgroundColor: tint },
                ]}>
                <ThemedText
                  style={selected ? [styles.chipTextSelected, { color: chipTextSelectedColor }] : undefined}>
                  {group.replace('_', ' ')}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
      <FormField
        label="Equipment"
        value={equipment}
        onChangeText={setEquipment}
        placeholder="Optional, e.g. barbell"
      />
      <SubmitButton label="Save" pending={createExercise.isPending} onPress={handleSubmit} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  chipsSection: { gap: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipTextSelected: { fontWeight: '600' },
});
