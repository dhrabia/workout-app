import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { SubmitButton } from '@/components/submit-button';
import { ThemedText } from '@/components/themed-text';
import { FieldCard, FieldCardInput, FieldCardLabel } from '@/components/ui/field-card';
import { useCreateExercise } from '@/hooks/queries/use-exercises';
import { useThemeColor } from '@/hooks/use-theme-color';
import { hexToRgba } from '@/lib/color';
import { MUSCLE_GROUPS, type MuscleGroup } from '@/lib/types';

export default function NewExerciseScreen() {
  const { returnPlanId, returnDayId, muscleGroup: initialMuscleGroup } = useLocalSearchParams<{
    returnPlanId?: string;
    returnDayId?: string;
    muscleGroup?: MuscleGroup;
  }>();
  const router = useRouter();
  const createExercise = useCreateExercise();

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>(initialMuscleGroup ?? 'full_body');
  const [equipment, setEquipment] = useState('');
  const [error, setError] = useState<string | undefined>();

  const tint = useThemeColor({}, 'tint');
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({}, 'border');
  const cardElevated = useThemeColor({}, 'cardElevated');
  const secondaryColor = useThemeColor({}, 'icon');

  const selectedChip = { backgroundColor: hexToRgba(tint, 0.16), borderColor: tint, textColor };
  const unselectedChip = { backgroundColor: cardElevated, borderColor, textColor: secondaryColor };

  function handleSubmit() {
    if (!name.trim()) {
      setError('Name is required');
      return;
    }
    createExercise.mutate(
      { name_en: name.trim(), muscle_group: muscleGroup, equipment: equipment.trim() || null },
      {
        onSuccess: (created) => {
          if (returnPlanId && returnDayId) {
            router.replace({
              pathname: '/plans/[planId]/days/[dayId]/exercises/form',
              params: {
                planId: returnPlanId,
                dayId: returnDayId,
                exerciseId: created.id,
                exerciseName: created.name_en,
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
      <Stack.Screen
        options={{
          title: 'New Exercise',
          headerLeft: () => (
            <HeaderIconButton name="xmark" size={22} color={tint} onPress={() => router.back()} />
          ),
        }}
      />
      <FieldCard>
        <FieldCardLabel label="Name" icon="doc.text.fill" />
        <FieldCardInput value={name} onChangeText={setName} placeholder="e.g. Cable Fly" error={error} />
      </FieldCard>
      <FieldCard>
        <FieldCardLabel label="Muscle group" icon="square.stack.fill" />
        <View style={styles.chips}>
          {MUSCLE_GROUPS.map((group) => {
            const chip = group === muscleGroup ? selectedChip : unselectedChip;
            return (
              <Pressable
                key={group}
                onPress={() => setMuscleGroup(group)}
                style={[styles.chip, { backgroundColor: chip.backgroundColor, borderColor: chip.borderColor }]}>
                <ThemedText style={[styles.chipText, { color: chip.textColor }]}>
                  {group.replace('_', ' ')}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </FieldCard>
      <FieldCard>
        <FieldCardLabel label="Equipment" icon="dumbbell.fill" />
        <FieldCardInput value={equipment} onChangeText={setEquipment} placeholder="Optional, e.g. barbell" />
      </FieldCard>
      <SubmitButton
        label="Save"
        pending={createExercise.isPending}
        onPress={handleSubmit}
        size="large"
        muted={!name.trim()}
      />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: '600' },
});
