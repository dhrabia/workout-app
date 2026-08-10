import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { ThemedView } from '@/components/themed-view';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { queryClient } from '@/lib/query-client';

// Screens presented as modals. `presentation: 'modal'` only takes effect when
// declared here, statically, on the navigator's own Stack.Screen entries —
// setting it from inside the screen component (after mount) silently falls
// back to a regular push.
const MODAL_ROUTES = [
  'plans/form',
  'plans/[planId]/days/form',
  'plans/[planId]/days/[dayId]/exercises/picker',
  'plans/[planId]/days/[dayId]/exercises/form',
  'exercises/new',
] as const;

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <AuthGate>
            <Stack>
              {MODAL_ROUTES.map((name) => (
                <Stack.Screen key={name} name={name} options={{ presentation: 'modal' }} />
              ))}
            </Stack>
          </AuthGate>
        </AuthProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
