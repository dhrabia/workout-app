import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { FormScreen } from '@/components/form-screen';
import { HeaderIconButton } from '@/components/header-icon-button';
import { NumberStepper } from '@/components/number-stepper';
import { SubmitButton } from '@/components/submit-button';
import {
  useBodyMeasurements,
  useUpdateBodyMeasurements,
} from '@/hooks/queries/use-body-measurements';
import { useThemeColor } from '@/hooks/use-theme-color';
import { MEASUREMENT_FIELDS as FIELDS, type MeasurementFieldKey as FieldKey } from '@/lib/body-measurement-fields';

export default function BodyMeasurementsScreen() {
  const router = useRouter();
  const { data: measurements } = useBodyMeasurements();
  const updateMeasurements = useUpdateBodyMeasurements();
  const tint = useThemeColor({}, 'tint');

  const [values, setValues] = useState<Record<FieldKey, string>>(() =>
    Object.fromEntries(FIELDS.map(({ key }) => [key, ''])) as Record<FieldKey, string>
  );

  useEffect(() => {
    if (!measurements) return;
    setValues(
      Object.fromEntries(
        FIELDS.map(({ key }) => [key, measurements[key] != null ? String(measurements[key]) : ''])
      ) as Record<FieldKey, string>
    );
  }, [measurements]);

  function handleSubmit() {
    const payload = Object.fromEntries(
      FIELDS.map(({ key }) => [key, values[key].trim() ? parseFloat(values[key]) : null])
    ) as Record<FieldKey, number | null>;
    updateMeasurements.mutate(payload, { onSuccess: () => router.back() });
  }

  return (
    <FormScreen>
      <Stack.Screen
        options={{
          title: 'Body Measurements',
          headerLeft: () => (
            <HeaderIconButton name="xmark" size={22} color={tint} onPress={() => router.back()} />
          ),
        }}
      />
      {FIELDS.map(({ key, label }) => (
        <NumberStepper
          key={key}
          label={label}
          value={values[key]}
          onChangeText={(text) => setValues((prev) => ({ ...prev, [key]: text }))}
          step={0.5}
          min={0}
          decimals={1}
          suffix="cm"
          placeholder="Optional"
        />
      ))}
      <SubmitButton label="Save" pending={updateMeasurements.isPending} onPress={handleSubmit} />
    </FormScreen>
  );
}
