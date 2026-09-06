import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { NumberStepper } from '@/components/number-stepper';
import { SubmitButton } from '@/components/submit-button';
import { useLogWeight, useWeightLogs } from '@/hooks/queries/use-weight-logs';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LogWeightScreen() {
  const router = useRouter();
  const { data: weightLogs } = useWeightLogs();
  const logWeight = useLogWeight();
  const tint = useThemeColor({}, 'tint');

  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | undefined>();

  // Prefill with the last logged weight — most people are only adjusting
  // slightly from their previous entry, not starting from zero.
  useEffect(() => {
    const currentWeight = weightLogs?.at(-1)?.weight_kg;
    if (currentWeight != null) setWeight(String(currentWeight));
  }, [weightLogs]);

  function handleSubmit() {
    const weightKg = parseFloat(weight);
    if (!Number.isFinite(weightKg) || weightKg <= 0) {
      setError('Enter a valid weight');
      return;
    }
    logWeight.mutate(weightKg, { onSuccess: () => router.back() });
  }

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          title: 'Log Weight',
          headerLeft: () => (
            <HeaderIconButton name="xmark" size={22} color={tint} onPress={() => router.back()} />
          ),
        }}
      />
      <NumberStepper
        label="Weight"
        value={weight}
        onChangeText={setWeight}
        step={0.1}
        min={0}
        decimals={1}
        suffix="kg"
        placeholder="e.g. 82"
        error={error}
      />
      <SubmitButton label="Save" pending={logWeight.isPending} onPress={handleSubmit} />
    </FormScreen>
  );
}
