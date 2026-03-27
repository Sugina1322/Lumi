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
import { useAppTheme } from '../../lib/app-theme';

const quickActions = [
  { label: 'Find route', icon: 'navigate-outline' as const, route: '/commute', accent: '#4D8CFF' },
  { label: 'Travel budget', icon: 'wallet-outline' as const, route: '/budget', accent: '#2F9D76' },
  { label: 'Expenses', icon: 'receipt-outline' as const, route: '/expenses', accent: '#E2884A' },
];

const tripCards = [
  {
    title: 'Tokyo Spring Escape',
    detail: '5 days · food crawl + city walk',
    status: 'Next up',
    emoji: 'JP',
  },
  {
    title: 'Seoul Cafe Weekend',
    detail: '12 places saved · 4 notes',
    status: 'Planning',
    emoji: 'KR',
  },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
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

      const nextLocation = await Location.getCurrentPositionAsync({});
      setLocation(nextLocation);
      setLocationLoading(false);

      try {
        const [place] = await Location.reverseGeocodeAsync(nextLocation.coords);
        if (place) {
          const parts = [place.street, place.district, place.city].filter(Boolean);
          setAddress(parts.join(', ') || 'Unknown location');
        }
      } catch {
        // Reverse geocoding is best-effort only.
      }
    })();
  }, []);

  const handleRecenter = () => {
    if (!location || !mapRef.current) return;

    mapRef.current.animateToRegion(
      {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500,
    );
  };

  const isNarrow = width < 375;
  const horizontalPadding = isNarrow ? 16 : 20;
  const firstName = user?.email?.split('@')[0] ?? 'traveler';
  const initials = firstName[0]?.toUpperCase() ?? 'L';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.backgroundGlowTop, { backgroundColor: theme.primarySoft }]} />
      <View style={[styles.backgroundGlowBottom, { backgroundColor: theme.surfaceAlt }]} />

      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Pressable
          style={[
            styles.iconButton,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}
          onPress={() => setMenuVisible(true)}
          hitSlop={6}
        >
          <Ionicons name="menu-outline" size={22} color={theme.text} />
        </Pressable>

        <View style={[styles.wordmarkChip, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.wordmark, { color: theme.text }]}>lumi</Text>
        </View>

        <Pressable
          style={[
            styles.iconButton,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}
          onPress={() => router.push('/profile')}
          hitSlop={6}
        >
          <Text style={[styles.iconButtonText, { color: theme.primary }]}>{initials}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingRow}>
          <View style={styles.greetingCopy}>
            <Text style={[styles.greetingLabel, { color: theme.mutedText }]}>{getGreeting()}</Text>
            <Text style={[styles.greetingTitle, { color: theme.text }]}>
              Move through the city with less friction.
            </Text>
            <Text style={[styles.greetingSubcopy, { color: theme.mutedText }]}>
              {firstName}, your routes, saved spots, and trip plans are all lined up here.
            </Text>
          </View>
          <View style={[styles.avatarShell, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.heroCard, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}
          onPress={() => router.push('/commute')}
        >
          <View style={[styles.heroGlowLarge, { backgroundColor: theme.heroAlt }]} />
          <View style={[styles.heroGlowSmall, { backgroundColor: theme.accent }]} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Today&apos;s focus</Text>
              <Text style={styles.heroTitle}>Find the fastest commute without giving up comfort.</Text>
              <Text style={styles.heroSubtitle}>
                Lumi blends route quality, transfers, walking distance, and cost into one clean recommendation.
              </Text>
            </View>
            <View style={styles.heroStatRail}>
              <View style={styles.heroStatCard}>
                <Text style={styles.heroStatValue}>3</Text>
                <Text style={styles.heroStatLabel}>Saved trips</Text>
              </View>
              <View style={styles.heroStatCardMuted}>
                <Text style={styles.heroStatValue}>12m</Text>
                <Text style={styles.heroStatLabel}>To next train</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroActionRow}>
            <View style={styles.heroPrimaryAction}>
              <Ionicons name="navigate" size={14} color={theme.hero} />
              <Text style={[styles.heroPrimaryActionText, { color: theme.hero }]}>Plan a route</Text>
            </View>
            <View style={styles.heroSecondaryMeta}>
              <Ionicons name="sparkles" size={13} color="#FFFFFF" />
              <Text style={styles.heroSecondaryMetaText}>Adaptive ranking</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick actions</Text>
          <Text style={[styles.sectionHint, { color: theme.mutedText }]}>Jump back in</Text>
        </View>

        <View style={styles.actionsRow}>
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              style={[
                styles.actionCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                  shadowColor: theme.shadow,
                },
              ]}
              onPress={() => router.push(action.route as never)}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: `${action.accent}15` }]}>
                <Ionicons name={action.icon} size={20} color={action.accent} />
              </View>
              <Text style={[styles.actionLabel, { color: theme.text }]}>{action.label}</Text>
              <Text style={[styles.actionMeta, { color: theme.mutedText }]}>Open</Text>
            </Pressable>
          ))}
        </View>

        <View
          style={[
            styles.mapCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <View style={styles.mapHeader}>
            <View>
              <Text style={[styles.cardEyebrow, { color: theme.primary }]}>Live location</Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>Your city snapshot</Text>
            </View>
            <Pressable
              style={[styles.inlineButton, { backgroundColor: theme.primarySoft }]}
              onPress={() => router.push('/commute')}
            >
              <Text style={[styles.inlineButtonText, { color: theme.primary }]}>Route</Text>
            </Pressable>
          </View>

          {locationLoading ? (
            <View style={styles.mapPlaceholder}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.mapPlaceholderTitle, { color: theme.text }]}>Finding your location</Text>
              <Text style={[styles.mapPlaceholderCopy, { color: theme.mutedText }]}>
                We&apos;re pulling in your current position for route suggestions.
              </Text>
            </View>
          ) : locationError ? (
            <View style={styles.mapPlaceholder}>
              <View style={[styles.placeholderIcon, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="location-outline" size={24} color={theme.primary} />
              </View>
              <Text style={[styles.mapPlaceholderTitle, { color: theme.text }]}>{locationError}</Text>
              <Text style={[styles.mapPlaceholderCopy, { color: theme.mutedText }]}>
                Turn location on to unlock a live map and faster commute suggestions.
              </Text>
            </View>
          ) : location ? (
            <>
              <View style={styles.mapShell}>
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
                <Pressable
                  style={[styles.recenterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={handleRecenter}
                >
                  <Ionicons name="locate" size={18} color={theme.primary} />
                </Pressable>
              </View>

              <View style={[styles.locationBar, { backgroundColor: theme.surfaceAlt }]}>
                <View style={styles.locationDotWrap}>
                  <View style={styles.locationDot} />
                </View>
                <View style={styles.locationCopy}>
                  <Text style={[styles.locationTitle, { color: theme.text }]}>You are here</Text>
                  <Text style={[styles.locationAddress, { color: theme.mutedText }]} numberOfLines={1}>
                    {address ?? 'Fetching address...'}
                  </Text>
                </View>
                <Pressable style={[styles.locationAction, { backgroundColor: theme.primary }]} onPress={() => router.push('/commute')}>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </Pressable>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming trips</Text>
          <Pressable onPress={() => router.push('/(tabs)/trips')}>
            <Text style={[styles.linkText, { color: theme.primary }]}>See all</Text>
          </Pressable>
        </View>

        {tripCards.map((trip, index) => (
          <Pressable
            key={trip.title}
            style={[
              styles.tripCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                shadowColor: theme.shadow,
                marginTop: index === 0 ? 0 : 12,
              },
            ]}
            onPress={() => router.push('/(tabs)/trips')}
          >
            <View style={styles.tripTopRow}>
              <View style={[styles.tripBadge, { backgroundColor: theme.primarySoft }]}>
                <Text style={[styles.tripBadgeText, { color: theme.primary }]}>{trip.status}</Text>
              </View>
              <View style={[styles.tripStamp, { backgroundColor: theme.surfaceAlt }]}>
                <Text style={[styles.tripStampText, { color: theme.text }]}>{trip.emoji}</Text>
              </View>
            </View>
            <Text style={[styles.tripTitle, { color: theme.text }]}>{trip.title}</Text>
            <Text style={[styles.tripDetail, { color: theme.mutedText }]}>{trip.detail}</Text>
            <View style={styles.tripFooter}>
              <Text style={[styles.tripFooterText, { color: theme.primary }]}>Open itinerary</Text>
              <Ionicons name="arrow-forward" size={14} color={theme.primary} />
            </View>
          </Pressable>
        ))}
      </ScrollView>

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
    top: -90,
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.8,
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 140,
    left: -90,
    width: 240,
    height: 240,
    borderRadius: 120,
    opacity: 0.45,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    paddingBottom: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  iconButtonText: {
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
    paddingBottom: 34,
  },
  greetingRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 6,
    marginBottom: 20,
  },
  greetingCopy: {
    flex: 1,
  },
  greetingLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  greetingTitle: {
    marginTop: 8,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  greetingSubcopy: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  avatarShell: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 6,
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  heroCard: {
    borderRadius: 30,
    padding: 22,
    overflow: 'hidden',
    marginBottom: 24,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
    elevation: 10,
  },
  heroGlowLarge: {
    position: 'absolute',
    top: -45,
    right: -30,
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.35,
  },
  heroGlowSmall: {
    position: 'absolute',
    bottom: -20,
    left: -10,
    width: 130,
    height: 130,
    borderRadius: 65,
    opacity: 0.24,
  },
  heroTopRow: {
    flexDirection: 'row',
    gap: 16,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 24,
    lineHeight: 29,
    fontWeight: '900',
  },
  heroSubtitle: {
    marginTop: 10,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 13,
    lineHeight: 19,
  },
  heroStatRail: {
    width: 88,
    gap: 10,
  },
  heroStatCard: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  heroStatCardMuted: {
    backgroundColor: 'rgba(12,12,12,0.12)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  heroStatLabel: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  heroActionRow: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroPrimaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  heroPrimaryActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  heroSecondaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroSecondaryMetaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
  },
  actionMeta: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mapCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  cardEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTitle: {
    marginTop: 5,
    fontSize: 18,
    fontWeight: '900',
  },
  inlineButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  mapPlaceholder: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  placeholderIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mapPlaceholderTitle: {
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  mapPlaceholderCopy: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  mapShell: {
    overflow: 'hidden',
    borderRadius: 22,
    height: 220,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  recenterButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationDotWrap: {
    width: 28,
    alignItems: 'center',
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38A169',
  },
  locationCopy: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  locationAddress: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
  },
  locationAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tripCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  tripTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tripBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  tripStamp: {
    minWidth: 44,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tripStampText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  tripTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '900',
  },
  tripDetail: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
  },
  tripFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  tripFooterText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
