import { router, Stack, useRootNavigationState, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/auth';
import { AppThemeProvider, useAppTheme } from '../lib/app-theme';
import { AppSettingsProvider, useAppSettings } from '../lib/app-settings';

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key || loading) return;

    const topSegment = segments[0];
    const isPublicRoute =
      topSegment == null ||
      topSegment === 'login' ||
      topSegment === 'auth';

    if (!session && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (session && (topSegment === 'login' || topSegment === 'auth')) {
      router.replace('/(tabs)');
    }
  }, [loading, navigationState?.key, segments, session]);

  return null;
}

function ThemedStack() {
  const { theme } = useAppTheme();
  const { settings } = useAppSettings();

  return (
    <>
      <AuthGate />
      <StatusBar style={theme.id === 'midnight' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: settings.reduceMotion ? 'none' : 'fade',
          contentStyle: { backgroundColor: theme.surface },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppThemeProvider>
        <AppSettingsProvider>
          <SafeAreaProvider>
            <ThemedStack />
          </SafeAreaProvider>
        </AppSettingsProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
}
