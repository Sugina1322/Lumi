import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import { useAuth } from '../../context/auth';
import { SideMenu } from '../../components/side-menu';

const quickActions = [
  { label: 'Find route',      icon: 'navigate-outline'  as const, route: '/commute',  accent: '#7055C8' },
  { label: 'Travel budget',   icon: 'wallet-outline'    as const, route: '/budget',   accent: '#4CAF50' },
  { label: 'Expenses',        icon: 'receipt-outline'   as const, route: '/expenses', accent: '#FF8C42' },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [menuVisible, setMenuVisible] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setLocationLoading(false);

      try {
        const [place] = await Location.reverseGeocodeAsync(loc.coords);
        if (place) {
          const parts = [place.street, place.district, place.city].filter(Boolean);
          setAddress(parts.join(', ') || 'Unknown location');
        }
      } catch {
        // reverse geocode is best-effort
      }
    })();
  }, []);

  const handleRecenter = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 500);
    }
  };

  const isNarrow   = width < 375;
  const hPad       = isNarrow ? 16 : 20;
  const cardRadius = isNarrow ? 22 : 26;

  const firstName  = user?.email?.split('@')[0] ?? 'traveler';
  const initials   = firstName[0]?.toUpperCase() ?? 'L';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <Pressable style={styles.iconBtn} onPress={() => setMenuVisible(true)} hitSlop={6}>
          <Ionicons name="menu-outline" size={24} color="#2F2257" />
        </Pressable>
        <Text style={styles.headerWordmark}>lumi</Text>
        <Pressable style={styles.iconBtn} hitSlop={6}>
          <Ionicons name="notifications-outline" size={22} color="#2F2257" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: hPad }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={[styles.greetingLabel, { fontSize: isNarrow ? 13 : 15 }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.greetingName, { fontSize: isNarrow ? 24 : 28 }]}>
              {firstName} ✦
            </Text>
          </View>
          <Pressable onPress={() => router.push('/profile')}>
            <View style={[styles.avatar, { width: isNarrow ? 44 : 50, height: isNarrow ? 44 : 50, borderRadius: isNarrow ? 22 : 25 }]}>
              <Text style={[styles.avatarText, { fontSize: isNarrow ? 17 : 20 }]}>{initials}</Text>
            </View>
          </Pressable>
        </View>

        {/* Commute hero card */}
        <Pressable style={[styles.heroCard, { borderRadius: cardRadius }]} onPress={() => router.push('/commute')}>
          <View style={styles.heroOrbTR} />
          <View style={styles.heroOrbBL} />
          <Text style={styles.heroLabel}>Commute guide</Text>
          <Text style={[styles.heroTitle, { fontSize: isNarrow ? 20 : 23 }]}>
            Where are you headed?{'\n'}Let Lumi find your best route.
          </Text>
          <View style={styles.heroBtn}>
            <Ionicons name="navigate" size={14} color="#7055C8" />
            <Text style={styles.heroBtnText}>Find route</Text>
            <Ionicons name="arrow-forward" size={14} color="#7055C8" />
          </View>
        </Pressable>

        {/* Quick actions */}
        <Text style={[styles.sectionTitle, { fontSize: isNarrow ? 16 : 18 }]}>Quick actions</Text>
        <View style={styles.actionsRow}>
          {quickActions.map((a) => (
            <Pressable
              key={a.label}
              style={[styles.actionCard, { borderRadius: cardRadius - 4 }]}
              onPress={() => router.push(a.route as never)}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: a.accent + '18' }]}>
                <Ionicons name={a.icon} size={20} color={a.accent} />
              </View>
              <Text style={[styles.actionLabel, { fontSize: isNarrow ? 11 : 12 }]}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Map card */}
        <View style={[styles.mapCard, { borderRadius: cardRadius }]}>
          {locationLoading ? (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator size="large" color="#7055C8" />
              <Text style={styles.mapPlaceholderText}>Finding your location...</Text>
            </View>
          ) : locationError ? (
            <View style={styles.mapPlaceholder}>
              <View style={styles.mapErrorIcon}>
                <Ionicons name="location-outline" size={28} color="#7055C8" />
              </View>
              <Text style={styles.mapPlaceholderText}>{locationError}</Text>
              <Text style={styles.mapPlaceholderSub}>Enable location to see the map</Text>
            </View>
          ) : location ? (
            <>
              <View style={[styles.mapContainer, { borderRadius: cardRadius }]}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  showsUserLocation
                  showsMyLocationButton={false}
                  showsCompass={false}
                />
                <Pressable style={styles.recenterBtn} onPress={handleRecenter}>
                  <Ionicons name="locate" size={18} color="#7055C8" />
                </Pressable>
              </View>
              <View style={styles.locationBar}>
                <View style={styles.locationDot} />
                <View style={styles.locationInfo}>
                  <Text style={styles.locationTitle}>You are here</Text>
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {address ?? 'Fetching address...'}
                  </Text>
                </View>
                <Pressable style={styles.locationGoBtn} onPress={() => router.push('/commute')}>
                  <Ionicons name="navigate" size={14} color="#FFF" />
                </Pressable>
              </View>
            </>
          ) : null}
        </View>

        {/* Upcoming trips */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { fontSize: isNarrow ? 16 : 18 }]}>Upcoming trips</Text>
        </View>

        <Pressable
          style={[styles.tripCard, { borderRadius: cardRadius }]}
          onPress={() => router.push('/(tabs)/trips')}
        >
          <View style={styles.tripCardTop}>
            <View style={styles.tripEmoji}>
              <Text style={styles.tripEmojiText}>🇯🇵</Text>
            </View>
            <View style={styles.tripBadgeWrap}>
              <Text style={styles.tripBadgeText}>Next up</Text>
            </View>
          </View>
          <Text style={[styles.tripTitle, { fontSize: isNarrow ? 15 : 17 }]}>Tokyo Spring Escape</Text>
          <Text style={styles.tripDetail}>5 days · food crawl + city walk</Text>
          <View style={styles.tripFooter}>
            <Text style={styles.tripCta}>Open itinerary</Text>
            <Ionicons name="chevron-forward" size={13} color="#7055C8" />
          </View>
        </Pressable>

        <Pressable
          style={[styles.tripCard, { borderRadius: cardRadius, marginTop: 12 }]}
          onPress={() => router.push('/(tabs)/trips')}
        >
          <View style={styles.tripCardTop}>
            <View style={styles.tripEmoji}>
              <Text style={styles.tripEmojiText}>🇰🇷</Text>
            </View>
            <View style={styles.tripBadgeWrap}>
              <Text style={styles.tripBadgeText}>Planning</Text>
            </View>
          </View>
          <Text style={[styles.tripTitle, { fontSize: isNarrow ? 15 : 17 }]}>Seoul Cafe Weekend</Text>
          <Text style={styles.tripDetail}>12 places saved · 4 notes</Text>
          <View style={styles.tripFooter}>
            <Text style={styles.tripCta}>Open itinerary</Text>
            <Ionicons name="chevron-forward" size={13} color="#7055C8" />
          </View>
        </Pressable>
      </ScrollView>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F0FF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    backgroundColor: '#F5F0FF',
  },
  iconBtn: {
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
  headerWordmark: {
    color: '#1E1640',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'lowercase',
  },

  content: { paddingBottom: 28 },

  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 18,
  },
  greetingText: { gap: 2 },
  greetingLabel: { color: '#7B6FA0', fontWeight: '600' },
  greetingName:  { color: '#1E1640', fontWeight: '900', lineHeight: 34 },
  avatar: {
    backgroundColor: '#7055C8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800' },

  // ── Map card ──────────────────────────────────────────
  mapCard: {
    backgroundColor: '#FFFFFF',
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#4C3D81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  mapPlaceholder: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  mapErrorIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mapPlaceholderText: {
    color: '#5A4E78',
    fontSize: 14,
    fontWeight: '700',
  },
  mapPlaceholderSub: {
    color: '#A89CC8',
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    overflow: 'hidden',
    height: 220,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  recenterBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2.5,
    borderColor: '#C8E6C9',
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    color: '#1E1640',
    fontSize: 13,
    fontWeight: '800',
  },
  locationAddress: {
    color: '#7B6FA0',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  locationGoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#7055C8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero card ─────────────────────────────────────────
  heroCard: {
    backgroundColor: '#7055C8',
    padding: 22,
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroOrbTR: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#9078E0',
    opacity: 0.4,
  },
  heroOrbBL: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#5A44A8',
    opacity: 0.4,
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

  // ── Quick actions ─────────────────────────────────────
  sectionTitle:  { color: '#1E1640', fontWeight: '800', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 14,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#4C3D81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { color: '#3A2E58', fontWeight: '700', textAlign: 'center' },

  // ── Trip cards ────────────────────────────────────────
  tripCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#4C3D81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tripCardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tripEmoji:     { width: 40, height: 40, borderRadius: 14, backgroundColor: '#F5F0FF', alignItems: 'center', justifyContent: 'center' },
  tripEmojiText: { fontSize: 20 },
  tripBadgeWrap: { backgroundColor: '#EDE8FF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tripBadgeText: { color: '#6248B0', fontSize: 11, fontWeight: '800' },
  tripTitle:     { color: '#1E1640', fontWeight: '800', lineHeight: 22 },
  tripDetail:    { marginTop: 4, color: '#6B5F8A', fontSize: 13, lineHeight: 19 },
  tripFooter:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14 },
  tripCta:       { color: '#7055C8', fontSize: 13, fontWeight: '700' },
});
