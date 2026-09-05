import { Stack } from 'expo-router';

// See app/(tabs)/plans/_layout.tsx — same reasoning, this tab's own Stack
// just to host its native header.
export default function ProfileStackLayout() {
  return <Stack />;
}
