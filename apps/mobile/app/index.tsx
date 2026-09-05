import { Redirect } from 'expo-router';

// The Plans tab root lives at /plans (app/(tabs)/plans/index.tsx) so its own
// folder name doesn't collide with its own index.tsx (React Navigation warns
// about a screen nested inside another screen of the same name otherwise).
// This bare "/" entry just forwards there, since it's still the app's actual
// launch route.
export default function Index() {
  return <Redirect href="/plans" />;
}
