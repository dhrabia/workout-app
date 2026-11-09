import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { OnboardingColors } from '@/constants/theme';

export function OnboardingBackButton({
  style,
  testID,
  onPress,
}: {
  style?: StyleProp<ViewStyle>;
  testID?: string;
  onPress?: () => void;
}) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => {
        onPress?.();
        router.back();
      }}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Back"
      testID={testID}
      style={style}>
      <Ionicons name="chevron-back" size={28} color={OnboardingColors.text} />
    </Pressable>
  );
}
