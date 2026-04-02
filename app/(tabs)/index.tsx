import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
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
import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import MapView from 'react-native-maps';
import { useAuth } from '../../context/auth';
import { SideMenu } from '../../components/side-menu';
import { ScalePressable } from '../../components/scale-pressable';
import { useAppTheme } from '../../lib/app-theme';
import { useAppSettings } from '../../lib/app-settings';

const quickActions = [
  {
    title: 'Commute',
    detail: 'Plan a route',
    icon: 'navigate-outline' as const,
    route: '/commute',
    accent: '#4D8CFF',
  },
  {
    title: 'Budget',
    detail: "Today's spend",
    icon: 'pie-chart-outline' as const,
    route: '/budget',
    accent: '#2F9D76',
  },
  {
    title: 'Expenses',
    detail: 'Receipts',
    icon: 'receipt-outline' as const,
    route: '/expenses',
    accent: '#E2884A',
  },
  {
    title: 'Trips',
    detail: 'Itinerary',
    icon: 'airplane-outline' as const,
    route: '/(tabs)/trips',
    accent: '#AA7BCF',
  },
];

const TRIP_SNAPSHOT_KEY = 'lumi_trip_planner_snapshot';
const LEGACY_TRIP_KEY = 'lumi_trip_planner';

type TripSnapshot = {
  tripName: string;
  itemCount: number;
  completedCount: number;
};

type BudgetSnapshot = {
  tripName: string;
  totalBudget: number;
  spent: number;
};

type ExpenseSnapshot = {
  total: number;
  todayTotal: number;
  count: number;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
  const { settings } = useAppSettings();
  const { width } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const [menuVisible, setMenuVisible] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [tripSnapshot, setTripSnapshot] = useState<TripSnapshot | null>(null);
  const [budgetSnapshot, setBudgetSnapshot] = useState<BudgetSnapshot | null>(null);
  const [expenseSnapshot, setExpenseSnapshot] = useState<ExpenseSnapshot | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const mapRef = useRef<MapView>(null);

  const loadHomeSnapshots = useCallback(async () => {
    const getToday = () =>
      new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

    const [tripRaw, budgetRaw, expensesRaw, savedRaw] = await Promise.all([
      SecureStore.getItemAsync(TRIP_SNAPSHOT_KEY),
      SecureStore.getItemAsync('lumi_travel_budget'),
      SecureStore.getItemAsync('lumi_expenses'),
      SecureStore.getItemAsync('lumi_saved_places'),
    ]);

    if (tripRaw) {
      try {
        const data = JSON.parse(tripRaw);
        setTripSnapshot({
          tripName: data.tripName || 'My trip',
          itemCount: data.itemCount ?? 0,
          completedCount: data.completedCount ?? 0,
        });
      } catch {
        setTripSnapshot(null);
      }
    } else {
      const legacyTripRaw = await SecureStore.getItemAsync(LEGACY_TRIP_KEY);
      if (legacyTripRaw) {
        try {
          const data = JSON.parse(legacyTripRaw);
          setTripSnapshot({
            tripName: data.tripName || 'My trip',
            itemCount: data.itinerary?.length ?? 0,
            completedCount:
              data.itinerary?.filter((item: { completed?: boolean }) => item.completed).length ?? 0,
          });
        } catch {
          setTripSnapshot(null);
        }
      } else {
        setTripSnapshot(null);
      }
    }

    if (budgetRaw) {
      try {
        const data = JSON.parse(budgetRaw);
        const items = Array.isArray(data.items) ? data.items : [];
        setBudgetSnapshot({
          tripName: data.tripName || 'Travel budget',
          totalBudget: Number.parseFloat(data.totalBudget) || 0,
          spent: items.reduce(
            (sum: number, item: { amount?: number }) => sum + (item.amount ?? 0),
            0,
          ),
        });
      } catch {
        setBudgetSnapshot(null);
      }
    } else {
      setBudgetSnapshot(null);
    }

    if (expensesRaw) {
      try {
        const data = JSON.parse(expensesRaw) as Array<{ amount?: number; date?: string }>;
        const allExpenses = Array.isArray(data) ? data : [];
        const today = getToday();
        setExpenseSnapshot({
          total: allExpenses.reduce((sum, item) => sum + (item.amount ?? 0), 0),
          todayTotal: allExpenses
            .filter((item) => item.date === today)
            .reduce((sum, item) => sum + (item.amount ?? 0), 0),
          count: allExpenses.length,
        });
      } catch {
        setExpenseSnapshot(null);
      }
    } else {
      setExpenseSnapshot(null);
    }

    if (savedRaw) {
      try {
        const data = JSON.parse(savedRaw);
        setSavedCount(Array.isArray(data) ? data.length : 0);
      } catch {
        setSavedCount(0);
      }
    } else {
      setSavedCount(0);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeSnapshots();
    }, [loadHomeSnapshots]),
  );

  useEffect(() => {
    if (!settings.location) {
      setLocation(null);
      setAddress(null);
      setLocationError(null);
      setLocationLoading(false);
      return;
    }

    let active = true;
    setLocationLoading(true);

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (!active) return;
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setLocationLoading(false);
        return;
      }

      const nextLocation = await Location.getCurrentPositionAsync({});
      if (!active) return;
      setLocation(nextLocation);
      setLocationError(null);
      setLocationLoading(false);

      try {
        const [place] = await Location.reverseGeocodeAsync(nextLocation.coords);
        if (!active) return;
        if (place) {
          const parts = [place.street, place.district, place.city].filter(Boolean);
          setAddress(parts.join(', ') || 'Unknown location');
        }
      } catch {
        // Best-effort reverse geocoding.
      }
    })();

    return () => {
      active = false;
    };
  }, [settings.location]);

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

  const isCompactScreen = width < 375;
  const dense = settings.compactCards;
  const pad = isCompactScreen ? 16 : 20;
  const firstName = user?.email?.split('@')[0] ?? 'traveler';
  const initials = firstName[0]?.toUpperCase() ?? 'L';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const budgetRemaining = (budgetSnapshot?.totalBudget ?? 0) - (budgetSnapshot?.spent ?? 0);

  const featuredCard =
    settings.homeFocus === 'budget'
      ? {
          label: 'Budget snapshot',
          title: budgetSnapshot?.tripName?.trim()
            ? budgetSnapshot.tripName
            : 'Keep your travel budget in view',
          route: '/budget' as const,
          icon: 'wallet-outline' as const,
          statPrimary: `PHP ${(budgetSnapshot?.spent ?? 0).toLocaleString()}`,
          statPrimaryLabel: 'spent',
          statSecondary:
            budgetSnapshot && budgetSnapshot.totalBudget > 0
              ? `PHP ${Math.abs(budgetRemaining).toLocaleString()}`
              : 'Set a budget',
          statSecondaryLabel:
            budgetSnapshot && budgetSnapshot.totalBudget > 0
              ? budgetRemaining >= 0
                ? 'left'
                : 'over'
              : 'to begin',
          cta: 'Open budget',
        }
      : settings.homeFocus === 'commute'
        ? {
            label: 'Route planner',
            title: 'Plan your next move',
            route: '/commute' as const,
            icon: 'navigate' as const,
            statPrimary: tripSnapshot ? `${tripSnapshot.itemCount}` : 'Live',
            statPrimaryLabel: tripSnapshot ? 'stops planned' : 'routing',
            statSecondary: settings.location && address ? 'Ready' : 'Manual',
            statSecondaryLabel: settings.location && address ? 'location' : 'entry',
            cta: 'Open planner',
          }
        : {
            label: 'Travel overview',
            title: tripSnapshot?.tripName?.trim()
              ? tripSnapshot.tripName
              : 'See your travel board at a glance',
            route: tripSnapshot ? '/(tabs)/trips' : '/commute',
            icon: tripSnapshot ? 'map' : 'navigate',
            statPrimary: `${tripSnapshot?.itemCount ?? 0}`,
            statPrimaryLabel: 'planned stops',
            statSecondary: `${savedCount}`,
            statSecondaryLabel: 'saved places',
            cta: tripSnapshot ? 'Open trip board' : 'Start planning',
          };

  const homeQuickActions = [
    quickActions[0],
    {
      ...quickActions[1],
      detail: budgetSnapshot
        ? budgetSnapshot.totalBudget > 0
          ? `PHP ${budgetRemaining.toLocaleString()} left`
          : 'Set your budget'
        : "Today's spend",
    },
    {
      ...quickActions[2],
      detail: expenseSnapshot
        ? expenseSnapshot.count > 0
          ? `PHP ${expenseSnapshot.todayTotal.toLocaleString()} today`
          : 'No expenses yet'
        : 'Receipts',
    },
    {
      ...quickActions[3],
      detail: tripSnapshot ? `${tripSnapshot.itemCount} stops planned` : 'Itinerary',
    },
  ];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: theme.surface }]}>
      <View style={[styles.topBar, { paddingTop: 8, paddingHorizontal: pad }]}>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            { backgroundColor: theme.card, borderColor: theme.border },
            pressed && styles.pressedSmall,
          ]}
          onPress={() => setMenuVisible(true)}
          accessibilityLabel="Open menu"
          accessibilityRole="button"
        >
          <Ionicons name="menu-outline" size={22} color={theme.text} />
        </Pressable>

        <View style={styles.greeting}>
          <Text style={[styles.greetingLabel, { color: theme.mutedText }]}>{greeting}</Text>
          <Text style={[styles.greetingName, { color: theme.text }]}>{firstName}</Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.avatar,
            { backgroundColor: theme.primary },
            pressed && styles.pressedSmall,
          ]}
          onPress={() => router.push('/profile')}
          accessibilityLabel="View profile"
          accessibilityRole="button"
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingHorizontal: pad, paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <ScalePressable
          containerStyle={styles.heroContainer}
          style={[styles.hero, dense && styles.heroDense, { backgroundColor: theme.hero }]}
          onPress={() => router.push(featuredCard.route as never)}
          accessibilityLabel={featuredCard.cta}
          accessibilityRole="button"
          scaleValue={0.97}
        >
          <View style={[styles.heroGlow1, { backgroundColor: theme.heroAlt }]} />
          <View style={[styles.heroGlow2, { backgroundColor: theme.accent }]} />

          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>{featuredCard.label}</Text>
              <Text style={styles.heroTitle}>{featuredCard.title}</Text>
            </View>
            <View style={[styles.heroIconBox, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name={featuredCard.icon as React.ComponentProps<typeof Ionicons>['name']} size={26} color="#fff" />
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={[styles.heroStat, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Text style={styles.heroStatVal}>{featuredCard.statPrimary}</Text>
              <Text style={styles.heroStatLbl}>{featuredCard.statPrimaryLabel}</Text>
            </View>
            <View style={[styles.heroStat, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
              <Text style={styles.heroStatVal}>{featuredCard.statSecondary}</Text>
              <Text style={styles.heroStatLbl}>{featuredCard.statSecondaryLabel}</Text>
            </View>
          </View>

          <View style={styles.heroCta}>
            <Text style={[styles.heroCtaText, { color: theme.hero }]}>{featuredCard.cta}</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.hero} />
          </View>
        </ScalePressable>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick actions</Text>
        <View style={styles.grid}>
          {[homeQuickActions.slice(0, 2), homeQuickActions.slice(2, 4)].map((row, rowIdx) => (
            <View key={rowIdx} style={styles.gridRow}>
              {row.map((action) => (
                <ScalePressable
                  key={action.title}
                  containerStyle={styles.actionContainer}
                  style={[
                    styles.actionCard,
                    dense && styles.actionCardDense,
                    { backgroundColor: theme.card, borderColor: theme.border },
                  ]}
                  onPress={() => router.push(action.route as never)}
                  accessibilityLabel={action.title}
                  accessibilityRole="button"
                >
                  <View style={[styles.actionIcon, { backgroundColor: `${action.accent}18` }]}>
                    <Ionicons name={action.icon} size={20} color={action.accent} />
                  </View>
                  <Text style={[styles.actionTitle, { color: theme.text }]}>{action.title}</Text>
                  <Text style={[styles.actionDetail, { color: theme.mutedText }]}>{action.detail}</Text>
                </ScalePressable>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.sectionRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My trip</Text>
          <Pressable
            onPress={() => router.push('/(tabs)/trips')}
            accessibilityLabel="See all trips"
            accessibilityRole="button"
          >
            <Text style={[styles.sectionLink, { color: theme.primary }]}>See all</Text>
          </Pressable>
        </View>

        {tripSnapshot ? (
          <ScalePressable
            containerStyle={styles.tripContainer}
            style={[
              styles.tripCard,
              dense && styles.tripCardDense,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => router.push('/(tabs)/trips')}
            accessibilityLabel={`Trip: ${tripSnapshot.tripName}`}
            accessibilityRole="button"
          >
            <View style={styles.tripRow}>
              <View style={[styles.tripIconBox, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="map" size={20} color={theme.primary} />
              </View>
              <View style={styles.tripInfo}>
                <Text style={[styles.tripName, { color: theme.text }]} numberOfLines={1}>
                  {tripSnapshot.tripName}
                </Text>
                <Text style={[styles.tripMeta, { color: theme.mutedText }]}>
                  {tripSnapshot.itemCount} items · {tripSnapshot.completedCount} done
                </Text>
              </View>
              <View style={[styles.tripBadge, { backgroundColor: theme.primarySoft }]}>
                <Text style={[styles.tripBadgeText, { color: theme.primary }]}>
                  {tripSnapshot.completedCount > 0 ? 'Active' : 'Planning'}
                </Text>
              </View>
            </View>

            {tripSnapshot.itemCount > 0 && (
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: theme.primary,
                      width: `${Math.round(
                        (tripSnapshot.completedCount / tripSnapshot.itemCount) * 100,
                      )}%`,
                    },
                  ]}
                />
              </View>
            )}
          </ScalePressable>
        ) : (
          <ScalePressable
            containerStyle={styles.tripContainer}
            style={[
              styles.emptyTrip,
              dense && styles.emptyTripDense,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
            onPress={() => router.push('/(tabs)/trips')}
            accessibilityLabel="Start planning a trip"
            accessibilityRole="button"
          >
            <View style={[styles.emptyTripIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="map-outline" size={22} color={theme.primary} />
            </View>
            <View style={styles.emptyTripText}>
              <Text style={[styles.emptyTripTitle, { color: theme.text }]}>No trip yet</Text>
              <Text style={[styles.emptyTripSub, { color: theme.mutedText }]}>Tap to start planning</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.mutedText} />
          </ScalePressable>
        )}

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>Location</Text>
        <View style={[styles.mapCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {!settings.location ? (
            <View style={styles.mapEmpty}>
              <Ionicons name="location-outline" size={24} color={theme.mutedText} />
              <Text style={[styles.mapEmptyText, { color: theme.mutedText }]}>
                Location shortcuts are turned off in Settings.
              </Text>
            </View>
          ) : locationLoading ? (
            <View style={styles.mapEmpty}>
              <ActivityIndicator color={theme.primary} />
              <Text style={[styles.mapEmptyText, { color: theme.mutedText }]}>
                Finding your location...
              </Text>
            </View>
          ) : locationError ? (
            <View style={styles.mapEmpty}>
              <Ionicons name="location-outline" size={24} color={theme.mutedText} />
              <Text style={[styles.mapEmptyText, { color: theme.mutedText }]}>Location unavailable</Text>
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
                  style={({ pressed }) => [
                    styles.recenter,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    pressed && styles.pressedSmall,
                  ]}
                  onPress={handleRecenter}
                  accessibilityLabel="Recenter map"
                  accessibilityRole="button"
                >
                  <Ionicons name="locate" size={18} color={theme.primary} />
                </Pressable>
              </View>

              <View style={[styles.locationBar, { backgroundColor: theme.surfaceAlt }]}>
                <View style={[styles.locationDot, { backgroundColor: '#38A169' }]} />
                <View style={styles.locationText}>
                  <Text style={[styles.locationLabel, { color: theme.text }]}>You are here</Text>
                  <Text style={[styles.locationAddress, { color: theme.mutedText }]} numberOfLines={1}>
                    {address ?? 'Fetching address...'}
                  </Text>
                </View>
                <Pressable
                  style={({ pressed }) => [
                    styles.locationArrow,
                    { backgroundColor: theme.primary },
                    pressed && styles.pressedSmall,
                  ]}
                  onPress={() => router.push('/commute')}
                  accessibilityLabel="Open route planner"
                  accessibilityRole="button"
                >
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </Pressable>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <SideMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
    alignItems: 'center',
  },
  greetingLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  greetingName: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 1,
    textTransform: 'capitalize',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  scroll: {
    paddingTop: 4,
  },
  heroContainer: {
    marginBottom: 24,
  },
  hero: {
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  heroDense: {
    padding: 16,
  },
  heroGlow1: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.35,
  },
  heroGlow2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.25,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginTop: 6,
  },
  heroIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  heroStat: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroStatVal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  heroStatLbl: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  heroCta: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  heroCtaText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 4,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  grid: {
    gap: 12,
    marginBottom: 24,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionContainer: {
    flex: 1,
  },
  actionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 112,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  actionCardDense: {
    minHeight: 96,
    padding: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
  },
  actionDetail: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '500',
  },
  tripContainer: {
    marginBottom: 0,
  },
  tripCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  tripCardDense: {
    padding: 14,
  },
  tripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tripIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 16,
    fontWeight: '800',
  },
  tripMeta: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  tripBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tripBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  emptyTrip: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emptyTripDense: {
    padding: 14,
  },
  emptyTripIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTripText: {
    flex: 1,
  },
  emptyTripTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyTripSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  mapCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  mapEmpty: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  mapEmptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  mapShell: {
    height: 200,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  recenter: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  locationText: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  locationArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressedSmall: {
    opacity: 0.7,
  },
});
