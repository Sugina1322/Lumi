import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/auth';

const shortcuts = [
  { label: 'Settings', icon: 'settings-outline' as const, route: '/settings' },
  { label: 'Budget', icon: 'wallet-outline' as const, route: '/budget' },
  { label: 'Expenses', icon: 'receipt-outline' as const, route: '/expenses' },
];

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const name = user?.email?.split('@')[0] ?? 'Traveler';
  const email = user?.email ?? 'Guest account';
  const initials = name[0]?.toUpperCase() ?? 'L';

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.handle}>{email}</Text>

          <View style={styles.statusPill}>
            <Ionicons name="sparkles-outline" size={13} color="#7055C8" />
            <Text style={styles.statusText}>Travel-ready profile</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick access</Text>
          <View style={styles.shortcutRow}>
            {shortcuts.map((item) => (
              <Pressable
                key={item.label}
                style={({ pressed }) => [styles.shortcutCard, pressed && styles.shortcutCardPressed]}
                onPress={() => router.push(item.route as never)}
              >
                <View style={styles.shortcutIcon}>
                  <Ionicons name={item.icon} size={18} color="#7055C8" />
                </View>
                <Text style={styles.shortcutLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account summary</Text>
          <View style={styles.settingCard}>
            <Text style={styles.settingTitle}>Saved locally</Text>
            <Text style={styles.settingCopy}>
              Your budget, expenses, and commute preferences are stored on this device.
            </Text>
          </View>
          <View style={styles.settingCard}>
            <Text style={styles.settingTitle}>Personalized routes</Text>
            <Text style={styles.settingCopy}>
              Lumi learns from your route picks to rank the kind of commute you prefer most.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manage</Text>
          <Pressable style={styles.settingsBtn} onPress={() => router.push('/settings')}>
            <Text style={styles.settingsBtnText}>Open settings</Text>
          </Pressable>
          <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
  },
  profileCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#7B63D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  name: {
    marginTop: 14,
    color: '#2F2644',
    fontSize: 24,
    fontWeight: '900',
  },
  handle: {
    marginTop: 6,
    color: '#655C7C',
    fontSize: 14,
  },
  statusPill: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F4F0FF',
  },
  statusText: {
    color: '#5A44A8',
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    marginTop: 24,
    gap: 12,
  },
  sectionTitle: {
    color: '#2F2644',
    fontSize: 18,
    fontWeight: '800',
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shortcutCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  shortcutCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#F4F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutLabel: {
    color: '#3A2E58',
    fontSize: 12,
    fontWeight: '700',
  },
  settingCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  settingTitle: {
    color: '#2F2644',
    fontSize: 16,
    fontWeight: '800',
  },
  settingCopy: {
    marginTop: 8,
    color: '#655C7C',
    fontSize: 13,
    lineHeight: 19,
  },
  settingsBtn: {
    borderRadius: 999,
    backgroundColor: '#7B63D1',
    paddingVertical: 15,
    alignItems: 'center',
  },
  settingsBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  signOutBtn: {
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4DCFB',
    paddingVertical: 15,
    alignItems: 'center',
  },
  signOutText: {
    color: '#C0396A',
    fontSize: 14,
    fontWeight: '800',
  },
});
