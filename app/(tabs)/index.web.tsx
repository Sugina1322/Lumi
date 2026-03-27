import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useAuth } from '../../context/auth';
import { SideMenu } from '../../components/side-menu';
import { useAppTheme } from '../../lib/app-theme';

const quickActions = [
  { label: 'Find route', icon: 'navigate-outline' as const, route: '/commute', accent: '#4D8CFF' },
  { label: 'Travel budget', icon: 'wallet-outline' as const, route: '/budget', accent: '#2F9D76' },
  { label: 'Expenses', icon: 'receipt-outline' as const, route: '/expenses', accent: '#E2884A' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreenWeb() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const firstName = user?.email?.split('@')[0] ?? 'traveler';
  const initials = firstName[0]?.toUpperCase() ?? 'L';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.backgroundGlowTop, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.backgroundGlowBottom, { backgroundColor: theme.surfaceAlt }]} />

      <View style={styles.webShell}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Pressable
            style={[styles.headerButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => setMenuVisible(true)}
          >
            <Ionicons name="menu-outline" size={22} color={theme.text} />
          </Pressable>

          <View style={[styles.wordmarkChip, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.wordmark, { color: theme.text }]}>lumi</Text>
          </View>

          <Pressable
            style={[styles.headerButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => router.push('/profile')}
          >
            <Text style={[styles.headerButtonText, { color: theme.primary }]}>{initials}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroGrid}>
            <View style={styles.heroIntro}>
              <Text style={[styles.eyebrow, { color: theme.mutedText }]}>{getGreeting()}</Text>
              <Text style={[styles.title, { color: theme.text }]}>Plan routes, trips, and saved stops from one calmer dashboard.</Text>
              <Text style={[styles.subtitle, { color: theme.mutedText }]}>
                {firstName}, the mobile app carries the live map, while web stays streamlined for planning and review.
              </Text>

              <View style={styles.heroActions}>
                <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary }]} onPress={() => router.push('/commute')}>
                  <Ionicons name="navigate" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryButtonText}>Open commute guide</Text>
                </Pressable>
                <Pressable style={[styles.secondaryButton, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => router.push('/(tabs)/trips')}>
                  <Text style={[styles.secondaryButtonText, { color: theme.text }]}>View trips</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.heroPanel, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}>
              <View style={[styles.heroPanelGlow, { backgroundColor: theme.heroAlt }]} />
              <Text style={styles.heroPanelEyebrow}>At a glance</Text>
              <Text style={styles.heroPanelTitle}>Everything you need for the next move is one click away.</Text>

              <View style={styles.metricRow}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>3</Text>
                  <Text style={styles.metricLabel}>Trips in motion</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricValue}>12</Text>
                  <Text style={styles.metricLabel}>Saved spots</Text>
                </View>
              </View>

              <View style={styles.webMapCard}>
                <Ionicons name="laptop-outline" size={20} color="#FFFFFF" />
                <Text style={styles.webMapCopy}>
                  Live map navigation is reserved for mobile so web can stay crisp and fast.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick actions</Text>
          </View>

          <View style={styles.actionsRow}>
            {quickActions.map((action) => (
              <Pressable
                key={action.label}
                style={[styles.actionCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push(action.route as never)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: `${action.accent}15` }]}>
                  <Ionicons name={action.icon} size={20} color={action.accent} />
                </View>
                <Text style={[styles.actionLabel, { color: theme.text }]}>{action.label}</Text>
                <Text style={[styles.actionMeta, { color: theme.mutedText }]}>Open module</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming trips</Text>
          </View>

          <View style={styles.tripGrid}>
            {[
              ['Tokyo Spring Escape', '5 days · food crawl + city walk', 'Next up'],
              ['Seoul Cafe Weekend', '12 places saved · 4 notes', 'Planning'],
            ].map(([title, detail, status]) => (
              <Pressable
                key={title}
                style={[styles.tripCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => router.push('/(tabs)/trips')}
              >
                <View style={[styles.tripBadge, { backgroundColor: theme.primarySoft }]}>
                  <Text style={[styles.tripBadgeText, { color: theme.primary }]}>{status}</Text>
                </View>
                <Text style={[styles.tripTitle, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.tripDetail, { color: theme.mutedText }]}>{detail}</Text>
                <View style={styles.tripFooter}>
                  <Text style={[styles.tripFooterText, { color: theme.primary }]}>Open itinerary</Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.primary} />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -120,
    right: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.75,
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: -90,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    opacity: 0.35,
  },
  webShell: {
    flex: 1,
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  wordmarkChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  wordmark: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2.4,
    textTransform: 'lowercase',
  },
  content: {
    paddingTop: 28,
    paddingBottom: 36,
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 18,
    flexWrap: 'wrap',
  },
  heroIntro: {
    flex: 1,
    minWidth: 320,
    paddingRight: 12,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 10,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900',
    maxWidth: 640,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 640,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    flexWrap: 'wrap',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  heroPanel: {
    flex: 1,
    minWidth: 320,
    borderRadius: 32,
    padding: 22,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 8,
  },
  heroPanelGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.35,
  },
  heroPanelEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroPanelTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  metricLabel: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '600',
  },
  webMapCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(16,16,16,0.12)',
    padding: 16,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  webMapCopy: {
    flex: 1,
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 19,
  },
  sectionHeader: {
    marginTop: 30,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  actionCard: {
    flexGrow: 1,
    flexBasis: 220,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  actionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  actionMeta: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  tripGrid: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
  },
  tripCard: {
    flexGrow: 1,
    flexBasis: 320,
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
  },
  tripBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tripBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tripTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '900',
  },
  tripDetail: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  tripFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  tripFooterText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
