import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../lib/app-theme';

const itineraryDays = [
  { day: 'Day 1', title: 'Arrive and settle in', note: 'Airport transfer, hotel check-in, dinner nearby', mood: 'Easy landing' },
  { day: 'Day 2', title: 'Explore local neighborhoods', note: 'Cafe list, shops, and one saved museum', mood: 'City wandering' },
  { day: 'Day 3', title: 'Food day', note: 'Street food, dessert stop, and hidden ramen pin', mood: 'Low-pressure plan' },
];

export default function TripsScreen() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.backgroundGlowTop, { backgroundColor: theme.primarySoft }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>Trip planner</Text>
        <Text style={[styles.title, { color: theme.text }]}>Turn scattered ideas into a trip that already feels organized.</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Lumi can grow this into your planning home: bookings, saved neighborhoods, transit anchors, and a calm day-by-day flow.
        </Text>

        <View style={[styles.summaryCard, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}>
          <View style={[styles.summaryGlow, { backgroundColor: theme.heroAlt }]} />
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryEyebrow}>Featured itinerary</Text>
              <Text style={styles.summaryTitle}>Tokyo Spring Escape</Text>
              <Text style={styles.summaryMeta}>April 12 - April 17</Text>
            </View>
            <View style={styles.summaryBadge}>
              <Text style={styles.summaryBadgeValue}>5</Text>
              <Text style={styles.summaryBadgeLabel}>days</Text>
            </View>
          </View>

          <View style={styles.summaryMetrics}>
            <View style={styles.summaryMetricCard}>
              <Text style={styles.summaryMetricValue}>8</Text>
              <Text style={styles.summaryMetricLabel}>Stops saved</Text>
            </View>
            <View style={styles.summaryMetricCard}>
              <Text style={styles.summaryMetricValue}>3</Text>
              <Text style={styles.summaryMetricLabel}>Transit anchors</Text>
            </View>
            <View style={styles.summaryMetricCard}>
              <Text style={styles.summaryMetricValue}>1</Text>
              <Text style={styles.summaryMetricLabel}>Hotel locked</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Timeline</Text>
          <Text style={[styles.sectionHint, { color: theme.mutedText }]}>A lighter structure</Text>
        </View>

        <View style={styles.timeline}>
          {itineraryDays.map((item, index) => (
            <View
              key={item.day}
              style={[
                styles.timelineCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <View style={styles.timelineRail}>
                <View style={[styles.timelineDot, { backgroundColor: theme.primary }]} />
                {index < itineraryDays.length - 1 ? (
                  <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
                ) : null}
              </View>

              <View style={styles.timelineBody}>
                <View style={styles.timelineHeader}>
                  <View style={[styles.timelineChip, { backgroundColor: theme.primarySoft }]}>
                    <Text style={[styles.timelineChipText, { color: theme.primary }]}>{item.day}</Text>
                  </View>
                  <Text style={[styles.timelineMood, { color: theme.mutedText }]}>{item.mood}</Text>
                </View>
                <Text style={[styles.timelineTitle, { color: theme.text }]}>{item.title}</Text>
                <Text style={[styles.timelineNote, { color: theme.mutedText }]}>{item.note}</Text>
              </View>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.insightCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.insightIcon, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="sparkles" size={18} color={theme.primary} />
          </View>
          <View style={styles.insightBody}>
            <Text style={[styles.insightTitle, { color: theme.text }]}>A stronger trip center</Text>
            <Text style={[styles.insightCopy, { color: theme.mutedText }]}>
              This tab now reads like a planning surface instead of placeholder text, which gives the rest of the product a clearer sense of direction.
            </Text>
          </View>
        </View>

        <Pressable style={[styles.button, { backgroundColor: theme.primary }]}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.buttonText}>Create a new trip</Text>
        </Pressable>
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
    top: -80,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.85,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 10,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
  },
  summaryCard: {
    marginTop: 20,
    borderRadius: 30,
    padding: 22,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 8,
  },
  summaryGlow: {
    position: 'absolute',
    top: -40,
    right: -24,
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.35,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryCopy: {
    flex: 1,
  },
  summaryEyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  summaryTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
  },
  summaryMeta: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    fontWeight: '600',
  },
  summaryBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBadgeValue: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  summaryBadgeLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryMetrics: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  summaryMetricCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 14,
  },
  summaryMetricValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  summaryMetricLabel: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeline: {
    gap: 12,
  },
  timelineCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  timelineRail: {
    alignItems: 'center',
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 3,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 8,
  },
  timelineBody: {
    flex: 1,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  timelineChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  timelineChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  timelineMood: {
    fontSize: 12,
    fontWeight: '700',
  },
  timelineTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: '900',
  },
  timelineNote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
  },
  insightCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightBody: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  insightCopy: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    marginTop: 22,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
