import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../lib/app-theme';

const aboutTabs = [
  {
    id: 'mission',
    label: 'Mission',
    title: 'Lumi is built to make urban travel feel calmer.',
    copy:
      'The app brings routes, saved places, budgets, and trip planning into one small-footprint mobile experience so decisions feel easier on the go.',
    points: ['Route ranking that respects comfort and cost', 'Saved places that stay easy to revisit', 'A travel dashboard that works well on a phone'],
  },
  {
    id: 'privacy',
    label: 'Privacy',
    title: 'Your planning tools should feel trustworthy.',
    copy:
      'Lumi keeps a local-first mindset wherever possible, and settings give users direct control over what stays on device and what gets reset.',
    points: ['Local data controls in settings', 'Guest mode for lightweight browsing', 'Resettable commute learning and preferences'],
  },
  {
    id: 'credits',
    label: 'Credits',
    title: 'Built with modern tools for travel planning.',
    copy:
      'Lumi combines Expo, React Native, Supabase, transit data, and thoughtful mobile UI patterns to turn complex planning into simpler actions. Designed and developed by Jean Mangaser.',
    points: ['Designed and developed by Jean Mangaser', 'Transit-aware planning experience', 'Expandable foundation for trips, budgets, and saved boards'],
  },
];

export default function AboutScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'mission' | 'privacy' | 'credits'>('mission');

  const current = aboutTabs.find((tab) => tab.id === activeTab) ?? aboutTabs[0];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.backgroundGlowTop, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.backgroundGlowBottom, { backgroundColor: theme.surfaceAlt }]} />

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(28, insets.bottom + 24) }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            style={[styles.headerButton, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: theme.text }]}>About Lumi</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}>
          <View style={[styles.heroGlowLarge, { backgroundColor: theme.heroAlt }]} />
          <View style={[styles.heroGlowSmall, { backgroundColor: theme.accent }]} />
          <Text style={styles.heroEyebrow}>Interactive overview</Text>
          <Text style={styles.heroTitle}>A travel companion designed for clearer mobile decisions.</Text>
          <Text style={styles.heroCopy}>Explore what Lumi is for, how it treats user data, and the foundations behind the product.</Text>
        </View>

        <View style={[styles.tabRail, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          {aboutTabs.map((tab) => {
            const active = current.id === tab.id;

            return (
              <Pressable
                key={tab.id}
                style={[styles.tabButton, active && { backgroundColor: theme.primarySoft }]}
                onPress={() => setActiveTab(tab.id as 'mission' | 'privacy' | 'credits')}
              >
                <Text style={[styles.tabButtonText, { color: active ? theme.primary : theme.mutedText }]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.storyCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <Text style={[styles.storyTitle, { color: theme.text }]}>{current.title}</Text>
          <Text style={[styles.storyCopy, { color: theme.mutedText }]}>{current.copy}</Text>

          <View style={styles.pointList}>
            {current.points.map((point) => (
              <View key={point} style={styles.pointRow}>
                <View style={[styles.pointDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.pointText, { color: theme.text }]}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.creditCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <Text style={[styles.creditTitle, { color: theme.text }]}>Credits</Text>
          <Text style={[styles.creditCopy, { color: theme.mutedText }]}>
            Lumi was designed and developed by Jean Mangaser, using Expo, React Native, Supabase, and transit planning data sources to create a more thoughtful travel experience.
          </Text>
          <Text style={[styles.creditFooter, { color: theme.mutedText }]}>Lumi. All rights reserved.</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  heroCopy: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    lineHeight: 20,
  },
  tabRail: {
    marginTop: 20,
    borderRadius: 22,
    borderWidth: 1,
    padding: 6,
    flexDirection: 'row',
    gap: 6,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  storyCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  storyTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  storyCopy: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
  },
  pointList: {
    marginTop: 16,
    gap: 12,
  },
  pointRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  pointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  pointText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  creditCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 4,
  },
  creditTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  creditCopy: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    flexShrink: 1,
  },
  creditFooter: {
    marginTop: 18,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
