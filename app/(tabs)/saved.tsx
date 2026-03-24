import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const savedPlaces = [
  { name: 'Blue Bottle Shibuya', note: 'Morning coffee stop', icon: 'Cafe' },
  { name: 'teamLab Borderless', note: 'Book ahead for sunset slot', icon: 'Art' },
  { name: 'Omoide Yokocho', note: 'Late-night skewers and photos', icon: 'Food' },
];

export default function SavedScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>Saved board</Text>
        <Text style={styles.title}>Places, cafes, and little finds you don’t want to lose.</Text>
        <Text style={styles.subtitle}>This tab is ready for bookmarks, maps, and travel notes once the data layer is in place.</Text>

        <View style={styles.list}>
          {savedPlaces.map((place) => (
            <View key={place.name} style={styles.placeCard}>
              <View style={styles.iconWrap}>
                <Text style={styles.iconText}>{place.icon}</Text>
              </View>
              <View style={styles.placeBody}>
                <Text style={styles.placeName}>{place.name}</Text>
                <Text style={styles.placeNote}>{place.note}</Text>
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
  list: {
    gap: 12,
    marginTop: 20,
  },
  placeCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1ECFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#7B63D1',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  placeBody: {
    flex: 1,
  },
  placeName: {
    color: '#2F2644',
    fontSize: 16,
    fontWeight: '800',
  },
  placeNote: {
    marginTop: 5,
    color: '#655C7C',
    fontSize: 13,
    lineHeight: 18,
  },
});
