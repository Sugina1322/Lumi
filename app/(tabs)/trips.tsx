import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const itineraryDays = [
  { day: 'Day 1', title: 'Arrive and settle in', note: 'Airport transfer, hotel check-in, dinner nearby' },
  { day: 'Day 2', title: 'Explore local neighborhoods', note: 'Cafe list, shops, and one saved museum' },
  { day: 'Day 3', title: 'Food day', note: 'Street food, dessert stop, and hidden ramen pin' },
];

export default function TripsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Trip planner</Text>
        <Text style={styles.title}>Your itinerary skeleton is ready.</Text>
        <Text style={styles.subtitle}>
          This screen can become the heart of Lumi: timeline, bookings, saved neighborhoods, and day-by-day planning.
        </Text>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryTitle}>Tokyo Spring Escape</Text>
            <Text style={styles.summaryMeta}>April 12 - April 17</Text>
          </View>
          <Text style={styles.summaryBadge}>5 days</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip timeline</Text>
          <View style={styles.timeline}>
            {itineraryDays.map((item) => (
              <View key={item.day} style={styles.timelineCard}>
                <View style={styles.timelineBadge}>
                  <Text style={styles.timelineBadgeIcon}>○</Text>
                  <Text style={styles.timelineBadgeText}>{item.day}</Text>
                </View>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineNote}>{item.note}</Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable style={styles.button}>
          <Text style={styles.buttonText}>Create a new trip</Text>
        </Pressable>
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
    paddingTop: 10,
    paddingBottom: 28,
  },
  eyebrow: {
    color: '#8A6DE9',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginTop: 10,
    color: '#2F2644',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 10,
    color: '#655C7C',
    fontSize: 14,
    lineHeight: 21,
  },
  summaryCard: {
    marginTop: 18,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  summaryTitle: {
    color: '#2F2644',
    fontSize: 18,
    fontWeight: '800',
  },
  summaryMeta: {
    marginTop: 6,
    color: '#6D6484',
    fontSize: 13,
  },
  summaryBadge: {
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1ECFF',
    color: '#6C56B7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: '#2F2644',
    fontSize: 20,
    fontWeight: '800',
  },
  timeline: {
    gap: 12,
    marginTop: 14,
  },
  timelineCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 18,
  },
  timelineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timelineBadgeText: {
    color: '#7B63D1',
    fontSize: 12,
    fontWeight: '800',
  },
  timelineBadgeIcon: {
    color: '#7B63D1',
    fontSize: 14,
    fontWeight: '800',
  },
  timelineTitle: {
    marginTop: 10,
    color: '#2F2644',
    fontSize: 17,
    fontWeight: '800',
  },
  timelineNote: {
    marginTop: 8,
    color: '#655C7C',
    fontSize: 13,
    lineHeight: 19,
  },
  button: {
    marginTop: 24,
    borderRadius: 999,
    backgroundColor: '#7B63D1',
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
