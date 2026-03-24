import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/auth';
import { AppThemeProvider, useAppTheme } from '../lib/app-theme';

function ThemedStack() {
  const { theme } = useAppTheme();

  return (
    <>
      <StatusBar style={theme.id === 'midnight' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
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
        <SafeAreaProvider>
          <ThemedStack />
        </SafeAreaProvider>
      </AppThemeProvider>
    </AuthProvider>
  );
}
