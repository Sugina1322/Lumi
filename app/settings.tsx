import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { clearWeights } from '../lib/preferences';

type AppSettings = {
  notifications: boolean;
  location: boolean;
  reduceMotion: boolean;
  compactCards: boolean;
  theme: ThemeId;
};

const STORAGE_KEY = 'lumi_app_settings';
const BUDGET_KEY = 'lumi_travel_budget';
const EXPENSES_KEY = 'lumi_expenses';

const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  location: true,
  reduceMotion: false,
  compactCards: false,
  theme: 'lilac',
};

async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
  } catch {}
  return DEFAULT_SETTINGS;
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(settings));
}

async function clearTravelData() {
  await Promise.all([
    SecureStore.deleteItemAsync(BUDGET_KEY),
    SecureStore.deleteItemAsync(EXPENSES_KEY),
  ]);
}

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { theme, setThemeId } = useAppTheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((data) => {
      setSettings(data);
      setThemeId(data.theme);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveSettings(settings);
  }, [settings, loaded]);

  function toggle(key: keyof AppSettings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setTheme(themeId: ThemeId) {
    setSettings((prev) => ({ ...prev, theme: themeId }));
    setThemeId(themeId);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={6}>
          <Ionicons name="arrow-back" size={22} color="#2F2257" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.eyebrow}>Preferences</Text>
          <Text style={styles.headerTitle}>Settings</Text>
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
                  style={[
                    styles.themeCard,
                    active && styles.themeCardActive,
                    {
                      borderColor: active ? option.primary : theme.border,
                      backgroundColor: active ? option.primarySoft : '#FFFFFF',
                    },
                  ]}
                  onPress={() => setTheme(option.id)}
                >
                  <View style={[styles.themeSwatch, { backgroundColor: option.primary }]} />
                  <Text style={[styles.themeLabel, active && styles.themeLabelActive]}>{option.label}</Text>
                  <Text style={styles.themeCopy}>{option.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel preferences</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingCopy}>Trip reminders, budget nudges, and saved-place updates.</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={() => toggle('notifications')}
                trackColor={{ false: '#DDD6F4', true: '#B8A7EE' }}
                thumbColor={settings.notifications ? '#7055C8' : '#FFFFFF'}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Location shortcuts</Text>
                <Text style={styles.settingCopy}>Show location-friendly actions on the home map and commute flow.</Text>
              </View>
              <Switch
                value={settings.location}
                onValueChange={() => toggle('location')}
                trackColor={{ false: '#DDD6F4', true: '#B8A7EE' }}
                thumbColor={settings.location ? '#7055C8' : '#FFFFFF'}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Compact cards</Text>
                <Text style={styles.settingCopy}>Use denser spacing across travel lists and summaries.</Text>
              </View>
              <Switch
                value={settings.compactCards}
                onValueChange={() => toggle('compactCards')}
                trackColor={{ false: '#DDD6F4', true: '#B8A7EE' }}
                thumbColor={settings.compactCards ? '#7055C8' : '#FFFFFF'}
              />
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>Reduce motion</Text>
                <Text style={styles.settingCopy}>Tone down animated transitions for a calmer feel.</Text>
              </View>
              <Switch
                value={settings.reduceMotion}
                onValueChange={() => toggle('reduceMotion')}
                trackColor={{ false: '#DDD6F4', true: '#B8A7EE' }}
                thumbColor={settings.reduceMotion ? '#7055C8' : '#FFFFFF'}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data controls</Text>

          <Pressable style={styles.actionCard} onPress={resetCommuteLearning}>
            <View style={styles.actionIcon}>
              <Ionicons name="sparkles-outline" size={18} color="#7055C8" />
            </View>
            <View style={styles.actionBody}>
              <Text style={styles.actionTitle}>Reset commute learning</Text>
              <Text style={styles.actionCopy}>Clear the route ranking preferences Lumi has learned.</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#C7BBEA" />
          </Pressable>

          <Pressable style={styles.actionCardDanger} onPress={resetAllLocalData}>
            <View style={styles.actionIconDanger}>
              <Ionicons name="trash-outline" size={18} color="#C0396A" />
            </View>
            <View style={styles.actionBody}>
              <Text style={[styles.actionTitle, styles.actionTitleDanger]}>Clear local travel data</Text>
              <Text style={styles.actionCopy}>Remove saved budgets, expenses, and commute memory from this device.</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color="#E5B3C4" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
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
    backgroundColor: '#F7F4FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4C3D81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  eyebrow: {
    color: '#8A6DE9',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: '#1E1640',
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
    backgroundColor: '#7055C8',
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
    backgroundColor: '#FFFFFF',
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
    color: '#2F2644',
    fontSize: 15,
    fontWeight: '900',
  },
  themeLabelActive: {
    color: '#1E1640',
  },
  themeCopy: {
    marginTop: 4,
    color: '#655C7C',
    fontSize: 13,
    lineHeight: 18,
  },
  settingCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 10,
    shadowColor: '#4C3D81',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
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
    color: '#2F2644',
    fontSize: 15,
    fontWeight: '800',
  },
  settingCopy: {
    marginTop: 4,
    color: '#655C7C',
    fontSize: 13,
    lineHeight: 18,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 10,
    shadowColor: '#4C3D81',
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
    backgroundColor: '#FFF7FA',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2D9E4',
  },
  actionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionIconDanger: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFF0F4',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  actionBody: {
    flex: 1,
  },
  actionTitle: {
    color: '#2F2644',
    fontSize: 15,
    fontWeight: '800',
  },
  actionTitleDanger: {
    color: '#C0396A',
  },
  actionCopy: {
    marginTop: 3,
    color: '#655C7C',
    fontSize: 13,
    lineHeight: 18,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    backgroundColor: '#FFF0F4',
    paddingVertical: 15,
  },
  signOutText: {
    color: '#C0396A',
    fontSize: 14,
    fontWeight: '800',
  },
});
