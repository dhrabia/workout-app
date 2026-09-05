import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

import { useThemeColor } from '@/hooks/use-theme-color';

export default function TabsLayout() {
  const tint = useThemeColor({}, 'tint');

  return (
    <NativeTabs tintColor={tint}>
      <NativeTabs.Trigger name="plans">
        <Label>Plans</Label>
        <Icon
          sf="figure.strengthtraining.traditional"
          androidSrc={<VectorIcon family={MaterialIcons} name="fitness-center" />}
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="body">
        <Label>Body</Label>
        <Icon sf="figure.stand" androidSrc={<VectorIcon family={MaterialIcons} name="accessibility" />} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Label>Profile</Label>
        <Icon sf="person.crop.circle" androidSrc={<VectorIcon family={MaterialIcons} name="account-circle" />} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
