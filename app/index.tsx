import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LumiLogo } from '../components/lumi-logo';
import { useAuth } from '../context/auth';

export default function SplashScreen() {
  const { session, loading } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.88), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => setMinTimePassed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!minTimePassed || loading) return;
    if (session) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [minTimePassed, loading, session]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <View style={styles.center}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
          <LumiLogo size="lg" />
        </Animated.View>
        <Animated.Text style={[styles.tagline, { opacity: fadeAnim }]}>
          your travel companion
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.footer, { opacity: fadeAnim }]}>
        plan softer, roam smarter
      </Animated.Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7F4FF',
  },
  bgOrbTop: {
    position: 'absolute',
    top: 60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#DCEAFE',
    opacity: 0.7,
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: 80,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#FFE1F1',
    opacity: 0.7,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  tagline: {
    color: '#7B6FA0',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    paddingBottom: 28,
    color: '#B8AEDD',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
