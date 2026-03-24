import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/auth';
import { SideMenu } from '../../components/side-menu';

const quickActions = [
  { label: 'Find route', icon: 'navigate-outline' as const, route: '/commute', accent: '#7055C8' },
  { label: 'Travel budget', icon: 'wallet-outline' as const, route: '/budget', accent: '#4CAF50' },
  { label: 'Expenses', icon: 'receipt-outline' as const, route: '/expenses', accent: '#FF8C42' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreenWeb() {
  const { user } = useAuth();

  const firstName = user?.email?.split('@')[0] ?? 'traveler';
  const initials = firstName[0]?.toUpperCase() ?? 'L';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.iconBtn} onPress={() => router.back()} hitSlop={6}>
          <Ionicons name="menu-outline" size={24} color="#2F2257" />
        </Pressable>
        <Text style={styles.headerWordmark}>lumi</Text>
        <Pressable style={styles.iconBtn} onPress={() => router.push('/profile')} hitSlop={6}>
          <View style={styles.avatarMini}>
            <Text style={styles.avatarMiniText}>{initials}</Text>
          </View>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={styles.greetingLabel}>{getGreeting()},</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Commute guide</Text>
          <Text style={styles.heroTitle}>Plan routes, budgets, and trips from one clean dashboard.</Text>
          <Pressable style={styles.heroBtn} onPress={() => router.push('/commute')}>
            <Ionicons name="navigate" size={14} color="#7055C8" />
            <Text style={styles.heroBtnText}>Find route</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((a) => (
            <Pressable
              key={a.label}
              style={styles.actionCard}
              onPress={() => router.push(a.route as never)}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: a.accent + '18' }]}>
                <Ionicons name={a.icon} size={20} color={a.accent} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.webCard}>
          <Text style={styles.webCardTitle}>Location map</Text>
          <Text style={styles.webCardCopy}>
            The live map view runs in the mobile app. On web, Lumi keeps this space clear and fast.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Upcoming trips</Text>
        <Pressable style={styles.tripCard} onPress={() => router.push('/(tabs)/trips')}>
          <Text style={styles.tripBadgeText}>Next up</Text>
          <Text style={styles.tripTitle}>Tokyo Spring Escape</Text>
          <Text style={styles.tripDetail}>5 days · food crawl + city walk</Text>
        </Pressable>
      </ScrollView>

      <SideMenu visible={false} onClose={() => {}} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F0FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerWordmark: {
    color: '#1E1640',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'lowercase',
  },
  avatarMini: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#7055C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMiniText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  greetingRow: { marginTop: 8, marginBottom: 18 },
  greetingText: { gap: 2 },
  greetingLabel: { color: '#7B6FA0', fontWeight: '600', fontSize: 15 },
  greetingName: { color: '#1E1640', fontWeight: '900', fontSize: 28, lineHeight: 34 },
  heroCard: {
    backgroundColor: '#7055C8',
    padding: 22,
    borderRadius: 28,
    marginBottom: 24,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    lineHeight: 30,
    marginTop: 8,
    fontSize: 23,
  },
  heroBtn: {
    marginTop: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroBtnText: { color: '#7055C8', fontSize: 13, fontWeight: '800' },
  sectionTitle: { color: '#1E1640', fontWeight: '800', marginBottom: 12, fontSize: 18 },
  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: '#3A2E58', fontWeight: '700', textAlign: 'center', fontSize: 12 },
  webCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
  },
  webCardTitle: { color: '#1E1640', fontWeight: '800', fontSize: 16 },
  webCardCopy: { color: '#6B5F8A', marginTop: 6, fontSize: 13, lineHeight: 19 },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
  },
  tripBadgeText: {
    color: '#6248B0',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#EDE8FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  tripTitle: { marginTop: 12, color: '#1E1640', fontWeight: '800', fontSize: 17 },
  tripDetail: { marginTop: 4, color: '#6B5F8A', fontSize: 13 },
});
