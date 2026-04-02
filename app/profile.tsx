import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/auth';
import { useAppTheme } from '../lib/app-theme';
import {
  DEFAULT_TRAVEL_MODE,
  loadTravelMode,
  saveTravelMode,
  TravelModePreference,
} from '../lib/preferences';

const travelModes = [
  {
    id: 'balanced',
    label: 'Balanced',
    icon: 'sparkles-outline' as const,
    summary: 'Blend time, walking comfort, and cost.',
    prompt: 'Best when you want one reliable default for day-to-day movement.',
  },
  {
    id: 'fast',
    label: 'Fast',
    icon: 'flash-outline' as const,
    summary: 'Prioritize speed and tighter transfers.',
    prompt: 'Best when you are rushing and want the quickest route available.',
  },
  {
    id: 'calm',
    label: 'Calm',
    icon: 'leaf-outline' as const,
    summary: 'Prefer smoother routes with less friction.',
    prompt: 'Best when you want fewer stressful route changes and less walking pressure.',
  },
];

const profileSignals = [
  {
    title: 'Local-first',
    value: 'On device',
    copy: 'Travel budgets, expenses, and learned preferences stay close to the phone unless you clear them.',
  },
  {
    title: 'Route style',
    value: 'Adaptive',
    copy: 'Commute suggestions get smarter from the choices you make over time.',
  },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme, themeId } = useAppTheme();
  const [activeMode, setActiveMode] = useState<TravelModePreference>(DEFAULT_TRAVEL_MODE);

  const name = user?.email?.split('@')[0] ?? 'Traveler';
  const email = user?.email ?? 'Guest account';
  const initials = name[0]?.toUpperCase() ?? 'L';
  const accountState = user?.email ? 'Signed in' : 'Guest';
  const currentMode = travelModes.find((mode) => mode.id === activeMode) ?? travelModes[0];

  useEffect(() => {
    loadTravelMode().then(setActiveMode);
  }, []);

  function handleModeSelect(mode: TravelModePreference) {
    setActiveMode(mode);
    saveTravelMode(mode);
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.backgroundGlowTop, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.backgroundGlowBottom, { backgroundColor: theme.surfaceAlt }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.headerButton, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressedSmall]}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}>
          <View style={[styles.heroGlowLarge, { backgroundColor: theme.heroAlt }]} />
          <View style={[styles.heroGlowSmall, { backgroundColor: theme.accent }]} />

          <View style={styles.heroTop}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Traveler identity</Text>
              <Text style={styles.heroTitle}>{name}</Text>
              <Text style={styles.heroSubtitle}>{email}</Text>
            </View>
            <View style={styles.avatarShell}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{accountState}</Text>
              <Text style={styles.heroStatLabel}>Account</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{themeId}</Text>
              <Text style={styles.heroStatLabel}>Theme</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Travel mode</Text>
          <View style={[styles.interactiveCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={styles.modeRow}>
              {travelModes.map((mode) => {
                const active = currentMode.id === mode.id;

                return (
                  <Pressable
                    key={mode.id}
                    style={({ pressed }) => [
                      styles.modeButton,
                      {
                        backgroundColor: active ? theme.primarySoft : theme.surfaceAlt,
                        borderColor: active ? theme.primary : 'transparent',
                      },
                      pressed && styles.pressedSmall,
                    ]}
                    onPress={() => handleModeSelect(mode.id as TravelModePreference)}
                    accessibilityLabel={mode.label}
                    accessibilityRole="button"
                  >
                    <Ionicons name={mode.icon} size={16} color={active ? theme.primary : theme.mutedText} />
                    <Text style={[styles.modeButtonText, { color: active ? theme.primary : theme.mutedText }]}>{mode.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.modeInsight, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={[styles.modeInsightTitle, { color: theme.text }]}>{currentMode.summary}</Text>
              <Text style={[styles.modeInsightCopy, { color: theme.mutedText }]}>{currentMode.prompt}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [styles.modeAction, { backgroundColor: theme.surface, borderColor: theme.border }, pressed && styles.pressed]}
              onPress={() => router.push('/commute')}
              accessibilityLabel="Use this mode in Commute"
              accessibilityRole="button"
              android_ripple={{ color: theme.border }}
            >
              <Ionicons name="navigate-outline" size={18} color={theme.primary} />
              <Text style={[styles.modeActionText, { color: theme.text }]}>Use this mode in Commute</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.mutedText} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick links</Text>
          <View style={styles.utilityGrid}>
            {[
              { label: 'Trips', icon: 'map-outline' as const, route: '/(tabs)/trips' },
              { label: 'Saved', icon: 'bookmark-outline' as const, route: '/(tabs)/saved' },
              { label: 'Settings', icon: 'settings-outline' as const, route: '/settings' },
            ].map((action) => (
              <Pressable
                key={action.label}
                style={({ pressed }) => [styles.utilityCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressed]}
                onPress={() => router.push(action.route as never)}
                accessibilityLabel={action.label}
                accessibilityRole="button"
                android_ripple={{ color: theme.border }}
              >
                <View style={[styles.utilityIcon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name={action.icon} size={18} color={theme.primary} />
                </View>
                <Text style={[styles.utilityLabel, { color: theme.text }]}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile signals</Text>
          {profileSignals.map((signal) => (
            <View
              key={signal.title}
              style={[styles.signalCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
            >
              <View style={styles.signalTop}>
                <Text style={[styles.signalTitle, { color: theme.text }]}>{signal.title}</Text>
                <Text style={[styles.signalValue, { color: theme.primary }]}>{signal.value}</Text>
              </View>
              <Text style={[styles.signalCopy, { color: theme.mutedText }]}>{signal.copy}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account actions</Text>

          <Pressable
            style={({ pressed }) => [styles.primaryButton, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressed]}
            onPress={() => router.push('/settings')}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
            android_ripple={{ color: theme.border }}
          >
            <Ionicons name="settings-outline" size={18} color={theme.primary} />
            <Text style={[styles.primaryButtonText, { color: theme.text }]}>Open settings</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.mutedText} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.signOutButton, { backgroundColor: theme.card, borderColor: theme.border }, pressed && styles.pressedSmall]}
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={18} color="#C0396A" />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -90,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.78,
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  headerSpacer: {
    width: 40,
  },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 8,
  },
  heroGlowLarge: {
    position: 'absolute',
    top: -34,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.34,
  },
  heroGlowSmall: {
    position: 'absolute',
    bottom: -24,
    left: -12,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.22,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 20,
  },
  avatarShell: {
    width: 74,
    height: 74,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  heroStats: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 10,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    padding: 14,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  heroStatLabel: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  utilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interactiveCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 6,
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modeInsight: {
    marginTop: 14,
    borderRadius: 18,
    padding: 14,
  },
  modeInsightTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  modeInsightCopy: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  modeAction: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  modeActionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  utilityCard: {
    width: '48%',
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  utilityIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  utilityLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  signalCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  signalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  signalTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  signalValue: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  signalCopy: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  primaryButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  signOutButton: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 15,
  },
  signOutText: {
    color: '#C0396A',
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  pressedSmall: {
    opacity: 0.7,
  },
});
