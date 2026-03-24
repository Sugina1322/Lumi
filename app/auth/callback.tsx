import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';

export default function AuthCallbackScreen() {
  const { session, loading } = useAuth();
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setSettled(true), 1200);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (loading || !settled) return;
    router.replace(session ? '/(tabs)' : '/login');
  }, [loading, session, settled]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#7055C8" />
        <Text style={styles.text}>Signing you in...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F4FF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  text: {
    color: '#655C7C',
    fontSize: 14,
    fontWeight: '600',
  },
});
