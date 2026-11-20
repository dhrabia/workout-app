import { ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { ContextMenuHostProvider } from '@/components/context-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { NavigationThemes } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/queries/use-profile';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/query-client';

// Screens presented as modals. `presentation: 'modal'` only takes effect when
// declared here, statically, on the navigator's own Stack.Screen entries —
// setting it from inside the screen component (after mount) silently falls
// back to a regular push.
const MODAL_ROUTES = [
  'plans/form',
  'plans/[planId]/days/form',
  'plans/[planId]/days/[dayId]/exercises/categories',
  'plans/[planId]/days/[dayId]/exercises/picker',
  'plans/[planId]/days/[dayId]/exercises/form',
  'exercises/new',
  'profile/edit',
] as const;

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={styles.flex}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={colorScheme === 'dark' ? NavigationThemes.dark : NavigationThemes.light}>
          <AuthProvider>
            <ContextMenuHostProvider>
              <AuthGate>
                <RootNavigator />
              </AuthGate>
            </ContextMenuHostProvider>
          </AuthProvider>
          <StatusBar style="auto" />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

// Routes not declared inside a Stack.Protected group stay open, so every app
// route has to be listed here to be unreachable (e.g. by deep link) before an
// account exists and its profile setup is finished. Keep in sync when adding
// routes.
const APP_ROUTES = [
  'plans/[planId]/index',
  'plans/[planId]/days/[dayId]/index',
  'workout/[planId]/index',
  'workout/[planId]/[dayId]/index',
  'workout/[planId]/[dayId]/[planExerciseId]',
  'body/weight-history',
  'body/measurement-history',
] as const;

function RootNavigator() {
  const { hasAccount } = useAuth();
  const { data: profile } = useProfile();
  // AuthGate holds rendering until the profile has loaded for signed-in users.
  const onboardingCompleted = profile?.onboarding_completed ?? false;

  return (
    <Stack>
      <Stack.Protected guard={hasAccount && onboardingCompleted}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* title backs the header of whatever gets pushed on top (e.g. plan
            detail) even though this screen's own header is hidden. */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Plans' }} />
        {MODAL_ROUTES.map((name) => (
          <Stack.Screen key={name} name={name} options={{ presentation: 'modal' }} />
        ))}
        {APP_ROUTES.map((name) => (
          <Stack.Screen key={name} name={name} />
        ))}
      </Stack.Protected>
      <Stack.Protected guard={hasAccount && !onboardingCompleted}>
        <Stack.Screen name="setup" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!hasAccount}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

// Holds the navigator back until it's known where the user belongs: signed
// out, mid profile setup, or in the app. Without waiting for the profile, a
// finished user would briefly be sent to setup on every launch.
function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, hasAccount } = useAuth();
  const profile = useProfile();

  if (isLoading || (hasAccount && profile.isPending && profile.fetchStatus !== 'idle')) {
    return (
      <ThemedView style={styles.loading} testID="app-loading">
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (hasAccount && profile.isError && !profile.data) {
    return (
      <ThemedView style={styles.loading}>
        <ThemedText style={styles.errorText}>Couldn’t load your profile.</ThemedText>
        <Pressable onPress={() => profile.refetch()} accessibilityRole="button" hitSlop={8} testID="auth-gate-retry">
          <ThemedText type="link">Try again</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  errorText: { textAlign: 'center' },
});
