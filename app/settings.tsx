import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/auth';
import { THEME_OPTIONS, ThemeId, useAppTheme } from '../lib/app-theme';
import { AppSettings, useAppSettings } from '../lib/app-settings';
import { clearWeights } from '../lib/preferences';
const BUDGET_KEY = 'lumi_travel_budget';
const EXPENSES_KEY = 'lumi_expenses';

async function clearTravelData() {
  await Promise.all([
    SecureStore.deleteItemAsync(BUDGET_KEY),
    SecureStore.deleteItemAsync(EXPENSES_KEY),
  ]);
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { theme, setThemeId } = useAppTheme();
  const { settings, loaded, setSettings } = useAppSettings();

  useEffect(() => {
    if (!loaded) return;
    setThemeId(settings.theme);
  }, [loaded, setThemeId, settings.theme]);

  function toggle(key: keyof AppSettings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setTheme(themeId: ThemeId) {
    setSettings((prev) => ({ ...prev, theme: themeId }));
    setThemeId(themeId);
  }

  function setHomeFocus(homeFocus: AppSettings['homeFocus']) {
    setSettings((prev) => ({ ...prev, homeFocus }));
  }

  function resetCommuteLearning() {
    Alert.alert(
      'Reset commute learning',
      'This will clear the route preferences Lumi has learned for this account on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearWeights(user?.id);
            Alert.alert('Done', 'Commute preferences have been reset.');
          },
        },
      ],
    );
  }

  function resetAllLocalData() {
    Alert.alert(
      'Clear local travel data',
      'This removes your saved budget, expenses, and commute learning from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Promise.all([clearTravelData(), clearWeights(user?.id)]);
            Alert.alert('Cleared', 'Local travel data has been removed.');
          },
        },
      ],
    );
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  const initials = user?.email?.[0]?.toUpperCase() ?? 'G';
  const email = user?.email ?? 'Browsing as guest';
  const destructiveColor = theme.id === 'midnight' ? '#FF8FB5' : '#C0396A';
  const destructiveSurface = theme.id === 'midnight' ? '#2A1A27' : '#FFF0F4';
  const destructiveBorder = theme.id === 'midnight' ? '#5A3147' : '#F2D9E4';

  if (!loaded) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]} />
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressedSmall]}
          onPress={() => router.back()}
          hitSlop={6}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.eyebrow, { color: theme.primary }]}>Preferences</Text>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.profileCard, { backgroundColor: theme.primary }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.profileName}>{user?.email?.split('@')[0] ?? 'Guest traveler'}</Text>
          <Text style={styles.profileMeta}>{email}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>

          <View style={styles.themeGrid}>
            {THEME_OPTIONS.map((option) => {
              const active = settings.theme === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={({ pressed }) => [
                    styles.themeCard,
                    active && styles.themeCardActive,
                    {
                      borderColor: active ? option.primary : theme.border,
                      backgroundColor: active ? option.primarySoft : theme.card,
                      shadowColor: theme.shadow,
                    },
                    pressed && styles.pressed,
                  ]}
                  onPress={() => setTheme(option.id)}
                  accessibilityLabel={`${option.label} theme`}
                  accessibilityRole="button"
                  android_ripple={{ color: theme.border }}
                >
                  <View style={[styles.themeSwatch, { backgroundColor: option.primary }]} />
                  <Text style={[styles.themeLabel, { color: active ? theme.text : theme.text }]}>{option.label}</Text>
                  <Text style={[styles.themeCopy, { color: theme.mutedText }]}>{option.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>App behavior</Text>

          <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Home focus</Text>
            <Text style={[styles.settingCopy, { color: theme.mutedText }]}>
              Choose which part of Lumi should feel most front-and-center when you browse the app.
            </Text>

            <View style={[styles.segmentedControl, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
              {[
                ['overview', 'Overview'],
                ['commute', 'Commute'],
                ['budget', 'Budget'],
              ].map(([value, label]) => {
                const active = settings.homeFocus === value;

                return (
                  <Pressable
                    key={value}
                    style={({ pressed }) => [
                      styles.segmentButton,
                      active && {
                        backgroundColor: theme.card,
                        borderColor: theme.border,
                        shadowColor: theme.shadow,
                      },
                      pressed && styles.pressedSmall,
                    ]}
                    onPress={() => setHomeFocus(value as AppSettings['homeFocus'])}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.segmentButtonText, { color: active ? theme.text : theme.mutedText }]}>
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Notifications</Text>
                <Text style={[styles.settingCopy, { color: theme.mutedText }]}>Trip reminders, budget nudges, and saved-place updates.</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={() => toggle('notifications')}
                trackColor={{ false: theme.border, true: theme.primarySoft }}
                thumbColor={settings.notifications ? theme.primary : theme.card}
              />
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Location shortcuts</Text>
                <Text style={[styles.settingCopy, { color: theme.mutedText }]}>Show location-friendly actions on the home map and commute flow.</Text>
              </View>
              <Switch
                value={settings.location}
                onValueChange={() => toggle('location')}
                trackColor={{ false: theme.border, true: theme.primarySoft }}
                thumbColor={settings.location ? theme.primary : theme.card}
              />
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Compact cards</Text>
                <Text style={[styles.settingCopy, { color: theme.mutedText }]}>Use denser spacing across travel lists and summaries.</Text>
              </View>
              <Switch
                value={settings.compactCards}
                onValueChange={() => toggle('compactCards')}
                trackColor={{ false: theme.border, true: theme.primarySoft }}
                thumbColor={settings.compactCards ? theme.primary : theme.card}
              />
            </View>
          </View>

          <View style={[styles.settingCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>Reduce motion</Text>
                <Text style={[styles.settingCopy, { color: theme.mutedText }]}>Tone down animated transitions for a calmer feel.</Text>
              </View>
              <Switch
                value={settings.reduceMotion}
                onValueChange={() => toggle('reduceMotion')}
                trackColor={{ false: theme.border, true: theme.primarySoft }}
                thumbColor={settings.reduceMotion ? theme.primary : theme.card}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Data controls</Text>

          <Pressable
            style={({ pressed }) => [styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }, pressed && styles.pressed]}
            onPress={resetCommuteLearning}
            accessibilityLabel="Reset commute learning"
            accessibilityRole="button"
            android_ripple={{ color: theme.border }}
          >
            <View style={[styles.actionIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="sparkles-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.actionBody}>
              <Text style={[styles.actionTitle, { color: theme.text }]}>Reset commute learning</Text>
              <Text style={[styles.actionCopy, { color: theme.mutedText }]}>Clear the route ranking preferences Lumi has learned.</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={theme.mutedText} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.actionCardDanger, { backgroundColor: destructiveSurface, borderColor: destructiveBorder }, pressed && styles.pressed]}
            onPress={resetAllLocalData}
            accessibilityLabel="Clear local travel data"
            accessibilityRole="button"
          >
            <View style={[styles.actionIconDanger, { backgroundColor: destructiveBorder }]}>
              <Ionicons name="trash-outline" size={18} color={destructiveColor} />
            </View>
            <View style={styles.actionBody}>
              <Text style={[styles.actionTitle, { color: destructiveColor }]}>Clear local travel data</Text>
              <Text style={[styles.actionCopy, { color: theme.mutedText }]}>Remove saved budgets, expenses, and commute memory from this device.</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={destructiveColor} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account</Text>

          <Pressable style={({ pressed }) => [styles.signOutBtn, { backgroundColor: destructiveSurface, borderColor: destructiveBorder }, pressed && styles.pressedSmall]} onPress={handleSignOut} accessibilityLabel="Sign out" accessibilityRole="button">
            <Ionicons name="log-out-outline" size={18} color={destructiveColor} />
            <Text style={[styles.signOutText, { color: destructiveColor }]}>Sign out</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 28,
  },
  profileCard: {
    borderRadius: 26,
    padding: 22,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  profileName: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  profileMeta: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  themeGrid: {
    gap: 10,
  },
  themeCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  themeCardActive: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  themeSwatch: {
    width: 40,
    height: 10,
    borderRadius: 999,
  },
  themeLabel: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '900',
  },
  themeCopy: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  settingCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 5,
    gap: 6,
    marginTop: 14,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTextWrap: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  settingCopy: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  actionCardDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionIconDanger: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionBody: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionCopy: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 15,
  },
  signOutText: {
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
