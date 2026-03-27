import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../../lib/app-theme';

const savedPlaces = [
  { name: 'Blue Bottle Shibuya', note: 'Morning coffee stop', icon: 'cafe-outline', tag: 'Cafe' },
  { name: 'teamLab Borderless', note: 'Book ahead for sunset slot', icon: 'color-palette-outline', tag: 'Art' },
  { name: 'Omoide Yokocho', note: 'Late-night skewers and photos', icon: 'restaurant-outline', tag: 'Food' },
];

export default function SavedScreen() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.backgroundGlow, { backgroundColor: theme.primarySoft }]} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: theme.primary }]}>Saved board</Text>
        <Text style={[styles.title, { color: theme.text }]}>Keep the spots that make a trip feel personal.</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Cafes, neighborhoods, transit anchors, and last-minute finds now read more like a curated collection than a placeholder list.
        </Text>

        <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: theme.primarySoft }]}>
            <Ionicons name="bookmark" size={18} color={theme.primary} />
          </View>
          <View style={styles.heroBody}>
            <Text style={[styles.heroTitle, { color: theme.text }]}>A cleaner save flow</Text>
            <Text style={[styles.heroCopy, { color: theme.mutedText }]}>
              This board now feels more intentional, with clearer tags, stronger card hierarchy, and less prototype energy.
            </Text>
          </View>
        </View>

        <View style={styles.list}>
          {savedPlaces.map((place) => (
            <View
              key={place.name}
              style={[
                styles.placeCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <View style={[styles.placeIconWrap, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={place.icon as any} size={20} color={theme.primary} />
              </View>

              <View style={styles.placeBody}>
                <View style={styles.placeHeader}>
                  <Text style={[styles.placeName, { color: theme.text }]}>{place.name}</Text>
                  <View style={[styles.placeTag, { backgroundColor: theme.surfaceAlt }]}>
                    <Text style={[styles.placeTagText, { color: theme.mutedText }]}>{place.tag}</Text>
                  </View>
                </View>
                <Text style={[styles.placeNote, { color: theme.mutedText }]}>{place.note}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundGlow: {
    position: 'absolute',
    top: -70,
    left: -50,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.75,
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
  heroCard: {
    marginTop: 20,
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
  },
  heroBadge: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBody: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  heroCopy: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  list: {
    gap: 12,
    marginTop: 18,
  },
  placeCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 4,
  },
  placeIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeBody: {
    flex: 1,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  placeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
  },
  placeTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  placeTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  placeNote: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
});
