import { Stack } from 'expo-router';

// NativeTabs renders no header of its own (unlike the JS <Tabs>), so each
// tab gets its own nested Stack purely to host the tab root's native header
// — this tab has just the one screen, its <Stack.Screen options={...}> call.
export default function PlansStackLayout() {
  return <Stack />;
}
