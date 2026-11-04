import { RulerPickerModal } from '@/components/ruler-picker-modal';
import { useUpdateProfile } from '@/hooks/queries/use-profile';
import { WEIGHT_DEFAULT, WEIGHT_MAX, WEIGHT_MIN } from '@/lib/weight';

// The target weight picker shared by Body and Profile. It owns the save so
// both screens apply the same goal_start_weight_kg reset — see
// computeWeightProgress in lib/weight.ts.
export function TargetWeightPickerModal({
  visible,
  currentWeight,
  targetWeight,
  onClose,
}: {
  visible: boolean;
  currentWeight: number | undefined;
  targetWeight: number | null | undefined;
  onClose: () => void;
}) {
  const updateProfile = useUpdateProfile();

  return (
    <RulerPickerModal
      key={visible ? 'target-weight-open' : 'target-weight-closed'}
      visible={visible}
      title="What is your target weight?"
      min={WEIGHT_MIN}
      max={WEIGHT_MAX}
      suffix="kg"
      value={targetWeight ?? WEIGHT_DEFAULT}
      pending={updateProfile.isPending}
      onClose={onClose}
      onSave={(target_weight_kg) =>
        updateProfile.mutate(
          // A new target always starts a fresh progress cycle from the
          // current weight.
          { target_weight_kg, goal_start_weight_kg: currentWeight ?? null },
          { onSuccess: onClose }
        )
      }
      testID="target-weight-modal"
    />
  );
}
