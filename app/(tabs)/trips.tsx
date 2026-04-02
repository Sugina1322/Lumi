import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TRAVEL_SUGGESTION_SEEDS, type TravelSuggestionSeed } from '../../data/travel-suggestions';
import { useAppTheme } from '../../lib/app-theme';
import { useAppSettings } from '../../lib/app-settings';
import { useAuth } from '../../context/auth';

type PlannerBucket = 'place' | 'tour' | 'food';

type ItineraryItem = {
  id: string;
  day: string;
  title: string;
  note: string;
  bucket: PlannerBucket;
  time: string;
  source: 'manual' | 'recommendation';
  completed: boolean;
};

type TripPlannerData = {
  tripName: string;
  tripDates: string;
  itinerary: ItineraryItem[];
};

type Recommendation = {
  id: string;
  place: string;
  title: string;
  area: string;
  note: string;
  bucket: PlannerBucket;
  icon: keyof typeof Ionicons.glyphMap;
};

const STORAGE_KEY = 'lumi_trip_planner';
const SNAPSHOT_KEY = 'lumi_trip_planner_snapshot';
const TRIP_PLANNER_FILE = `${FileSystem.documentDirectory ?? ''}lumi-trip-planner.json`;

type TripPlannerSnapshot = {
  tripName: string;
  itemCount: number;
  completedCount: number;
};

const DEFAULT_ITINERARY: ItineraryItem[] = [
  {
    id: 'seed-1',
    day: 'Day 1',
    title: 'Check in and settle nearby',
    note: 'Leave room for a slow walk, an easy dinner, and your first neighborhood scan.',
    bucket: 'place',
    time: '3:00 PM',
    source: 'manual',
    completed: false,
  },
  {
    id: 'seed-2',
    day: 'Day 2',
    title: 'Half-day city highlights',
    note: 'Mix one major stop with one quiet corner so the day still feels flexible.',
    bucket: 'tour',
    time: '10:00 AM',
    source: 'manual',
    completed: false,
  },
];

const BUCKET_META: Record<PlannerBucket, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  place: { label: 'Place', icon: 'location-outline' },
  tour: { label: 'Tour', icon: 'trail-sign-outline' },
  food: { label: 'Food', icon: 'fast-food-outline' },
};

const DAY_OPTIONS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
const TIME_OPTIONS = [
  '1:00 AM',
  '3:00 AM',
  '5:00 AM',
  '7:00 AM',
  '9:00 AM',
  '11:00 AM',
  '1:00 PM',
  '3:00 PM',
  '5:00 PM',
  '7:00 PM',
  '9:00 PM',
];

function buildGenericRecommendations(place: string): Recommendation[] {
  const trimmedPlace = place.trim() || 'This place';
  const lowerPlace = trimmedPlace.toLowerCase();
  const vibe =
    lowerPlace.includes('beach') || lowerPlace.includes('bay') || lowerPlace.includes('shore')
      ? {
          area: 'Coastal guide',
          spotlight: 'Scenic waterfront stop',
          food: 'Seafood and sunset meal',
          tour: 'Sunset walk route',
        }
      : lowerPlace.includes('mountain') || lowerPlace.includes('baguio') || lowerPlace.includes('ridge')
        ? {
            area: 'Highland guide',
            spotlight: 'Viewpoint or park stop',
            food: 'Warm cafe or local meal',
            tour: 'Cool-weather walking route',
          }
        : lowerPlace.includes('market') || lowerPlace.includes('mercato')
          ? {
              area: 'Market guide',
              spotlight: 'Main market lane',
              food: 'Street food picks',
              tour: 'Food crawl route',
            }
          : lowerPlace.includes('church') || lowerPlace.includes('museum') || lowerPlace.includes('heritage')
            ? {
                area: 'Heritage guide',
                spotlight: 'Historic landmark stop',
                food: 'Cafe break nearby',
                tour: 'Culture walk route',
              }
            : {
                area: 'Local guide',
                spotlight: 'Must-see area',
                food: 'Local food stop',
                tour: 'Easy explorer route',
              };

  return [
    {
      id: `${trimmedPlace}-place`,
      place: trimmedPlace,
      title: `${vibe.spotlight} in ${trimmedPlace}`,
      area: vibe.area,
      note: `Start with one recognizable highlight in ${trimmedPlace} so a traveler who is new to the area has an easy first stop.`,
      bucket: 'place',
      icon: 'location-outline',
    },
    {
      id: `${trimmedPlace}-food`,
      place: trimmedPlace,
      title: `${vibe.food} near ${trimmedPlace}`,
      area: vibe.area,
      note: `Add a food stop around ${trimmedPlace} so the itinerary includes something practical and enjoyable, not just sightseeing.`,
      bucket: 'food',
      icon: 'restaurant-outline',
    },
    {
      id: `${trimmedPlace}-tour`,
      place: trimmedPlace,
      title: `${vibe.tour} around ${trimmedPlace}`,
      area: vibe.area,
      note: `Keep one flexible route near ${trimmedPlace} for photos, short walks, or a backup activity if plans shift.`,
      bucket: 'tour',
      icon: 'trail-sign-outline',
    },
    {
      id: `${trimmedPlace}-backup`,
      place: trimmedPlace,
      title: `Ask locals for a hidden pick in ${trimmedPlace}`,
      area: vibe.area,
      note: `If you are unfamiliar with ${trimmedPlace}, leave room for one extra recommendation from hotel staff, drivers, or nearby vendors.`,
      bucket: 'place',
      icon: 'sparkles-outline',
    },
  ];
}

function normalizePlace(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildRecommendationsFromSeed(seed: TravelSuggestionSeed): Recommendation[] {
  return seed.items.map((item) => ({
    id: item.id,
    place: seed.place,
    area: seed.area,
    title: item.title,
    note: item.note,
    bucket: item.bucket,
    icon: item.icon,
  }));
}

async function loadPlanner(): Promise<TripPlannerData | null> {
  try {
    const info = await FileSystem.getInfoAsync(TRIP_PLANNER_FILE);
    if (info.exists) {
      const raw = await FileSystem.readAsStringAsync(TRIP_PLANNER_FILE);
      if (raw) return JSON.parse(raw);
    }

    const legacyRaw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (legacyRaw) {
      const parsed = JSON.parse(legacyRaw);
      await FileSystem.writeAsStringAsync(TRIP_PLANNER_FILE, legacyRaw);
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      return parsed;
    }
  } catch {}
  return null;
}

async function savePlannerSnapshot(data: TripPlannerSnapshot) {
  await SecureStore.setItemAsync(SNAPSHOT_KEY, JSON.stringify(data));
}

async function savePlanner(data: TripPlannerData) {
  await FileSystem.writeAsStringAsync(TRIP_PLANNER_FILE, JSON.stringify(data));
  await savePlannerSnapshot({
    tripName: data.tripName,
    itemCount: data.itinerary.length,
    completedCount: data.itinerary.filter((item) => item.completed).length,
  });
}

async function clearPlanner() {
  try {
    const info = await FileSystem.getInfoAsync(TRIP_PLANNER_FILE);
    if (info.exists) {
      await FileSystem.deleteAsync(TRIP_PLANNER_FILE, { idempotent: true });
    }
  } catch {}
  await SecureStore.deleteItemAsync(SNAPSHOT_KEY);
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

export default function TripsScreen() {
  const { theme } = useAppTheme();
  const { settings } = useAppSettings();
  const { user, signOut } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const dense = settings.compactCards;
  const [tripName, setTripName] = useState('Weekend City Reset');
  const [tripDates, setTripDates] = useState('May 12 - May 15');
  const [itinerary, setItinerary] = useState<ItineraryItem[]>(DEFAULT_ITINERARY);
  const [composerDay, setComposerDay] = useState('Day 1');
  const [composerTime, setComposerTime] = useState('9:00 AM');
  const [composerTitle, setComposerTitle] = useState('');
  const [composerNote, setComposerNote] = useState('');
  const [activePicker, setActivePicker] = useState<'day' | 'time' | null>(null);
  const [expandedSuggestions, setExpandedSuggestions] = useState<Record<string, boolean>>({});
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    day: string;
    items: ItineraryItem[];
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isGuest = !user?.email;

  useEffect(() => {
    loadPlanner().then((data) => {
      if (data) {
        setTripName(data.tripName || 'Weekend City Reset');
        setTripDates(data.tripDates || 'May 12 - May 15');
        setItinerary(data.itinerary?.length ? data.itinerary : DEFAULT_ITINERARY);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const hasContent = tripName.trim() || tripDates.trim() || itinerary.length > 0;
    if (!hasContent) {
      clearPlanner();
      return;
    }
    savePlanner({ tripName, tripDates, itinerary });
  }, [tripName, tripDates, itinerary, loaded]);

  const promptGuestUpgrade = useCallback(() => {
    Alert.alert(
      'Login required',
      'Guests can browse trips and suggestions, but saving or editing travel plans requires an account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go to login',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ],
    );
  }, [signOut]);

  const itineraryByDay = useMemo(() => {
    const groups = new Map<string, ItineraryItem[]>();
    for (const item of itinerary) {
      const current = groups.get(item.day) ?? [];
      current.push(item);
      groups.set(item.day, current);
    }

    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
      .map(([day, items]) => ({
        day,
        items: [...items].sort((a, b) => a.time.localeCompare(b.time)),
      }));
  }, [itinerary]);

  const recommendationGroups = useMemo(() => {
    const detectedPlaces = new Set<string>();
    if (tripName.trim()) detectedPlaces.add(tripName.trim());
    itinerary.forEach((item) => {
      if (item.title.trim()) detectedPlaces.add(item.title.trim());
    });

    return Array.from(detectedPlaces).map((place) => {
      const normalizedPlace = normalizePlace(place);
      const matchedSeed = TRAVEL_SUGGESTION_SEEDS.find((seed) => {
        const candidates = [seed.place, ...(seed.aliases ?? [])].map(normalizePlace);
        return candidates.some(
          (candidate) =>
            normalizedPlace === candidate ||
            normalizedPlace.includes(candidate) ||
            candidate.includes(normalizedPlace),
        );
      });
      const items = matchedSeed ? buildRecommendationsFromSeed(matchedSeed) : buildGenericRecommendations(place);
      return {
        place,
        area: matchedSeed?.area ?? 'Custom place',
        items,
      };
    });
  }, [itinerary, tripName]);

  const toggleSuggestionGroup = useCallback((place: string) => {
    setExpandedSuggestions((prev) => ({ ...prev, [place]: !prev[place] }));
  }, []);

  const completedCount = itinerary.filter((item) => item.completed).length;
  const uniqueDays = itineraryByDay.length;
  const recommendationCount = itinerary.filter((item) => item.source === 'recommendation').length;
  const destinationLabel = tripName.trim() || 'Your destination';

  const handleAddManualItem = useCallback(() => {
    if (isGuest) {
      promptGuestUpgrade();
      return;
    }
    if (!composerTitle.trim()) return;

    setItinerary((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        day: composerDay.trim() || 'Day 1',
        title: composerTitle.trim(),
        note: composerNote.trim(),
        bucket: 'place',
        time: composerTime.trim() || '9:00 AM',
        source: 'manual',
        completed: false,
      },
    ]);
    setComposerTitle('');
    setComposerNote('');
    setComposerTime('9:00 AM');
  }, [composerDay, composerNote, composerTime, composerTitle, isGuest, promptGuestUpgrade]);

  const addRecommendationToTrip = useCallback((item: Recommendation) => {
    if (isGuest) {
      promptGuestUpgrade();
      return;
    }
    setItinerary((prev) => [
      ...prev,
      {
        id: `${item.id}-${Date.now()}`,
        day: composerDay.trim() || 'Day 1',
        title: item.title,
        note: `${item.area}. ${item.note}`,
        bucket: item.bucket,
        time: '2:00 PM',
        source: 'recommendation',
        completed: false,
      },
    ]);
  }, [composerDay, isGuest, promptGuestUpgrade]);

  const toggleDayComplete = useCallback((day: string) => {
    if (isGuest) {
      promptGuestUpgrade();
      return;
    }
    setItinerary((prev) => {
      const dayItems = prev.filter((item) => item.day === day);
      const shouldComplete = dayItems.some((item) => !item.completed);
      return prev.map((item) => (item.day === day ? { ...item, completed: shouldComplete } : item));
    });
  }, [isGuest, promptGuestUpgrade]);

  const removeDay = useCallback((day: string) => {
    if (isGuest) {
      promptGuestUpgrade();
      return;
    }
    Alert.alert('Remove day', 'This will remove the full day plan from your itinerary.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setItinerary((prev) => prev.filter((item) => item.day !== day)),
      },
    ]);
  }, [isGuest, promptGuestUpgrade]);

  const clearTrip = useCallback(() => {
    if (isGuest) {
      promptGuestUpgrade();
      return;
    }
    Alert.alert('Reset trip board', 'This will clear the trip title, dates, and all itinerary items.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setTripName('');
          setTripDates('');
          setItinerary([]);
        },
      },
    ]);
  }, [isGuest, promptGuestUpgrade]);

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.backgroundGlow, { backgroundColor: theme.primarySoft }]} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 96 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: theme.primary }]}>Trips</Text>
            <Text style={[styles.title, { color: theme.text }]}>Build your itinerary by destination and day.</Text>
          </View>
          {itinerary.length > 0 || tripName || tripDates ? (
            <Pressable
              style={[styles.clearButton, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
              onPress={clearTrip}
            >
              <Ionicons name="trash-outline" size={18} color={theme.text} />
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Set your main destination first, then add the places you want to visit for each day. Lumi will suggest tourist spots, food ideas, and easy routes for the places in your trip.
        </Text>

        {isGuest ? (
          <View style={[styles.guestNotice, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="lock-closed-outline" size={16} color={theme.primary} />
            <Text style={[styles.guestNoticeText, { color: theme.mutedText }]}>
              Guests can browse trips and suggestions, but login is required to save or edit travel plans.
            </Text>
          </View>
        ) : null}

        <View style={[styles.heroCard, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}>
          <View style={[styles.heroGlow, { backgroundColor: theme.heroAlt }]} />
          <Text style={styles.heroEyebrow}>Main destination</Text>
          <TextInput
            style={styles.heroTitleInput}
            value={tripName}
            onChangeText={setTripName}
            placeholder="e.g. Baguio"
            placeholderTextColor="rgba(255,255,255,0.68)"
            editable={!isGuest}
            onFocus={isGuest ? promptGuestUpgrade : undefined}
          />
          <TextInput
            style={styles.heroMetaInput}
            value={tripDates}
            onChangeText={setTripDates}
            placeholder="e.g. June 20 - June 23"
            placeholderTextColor="rgba(255,255,255,0.62)"
            editable={!isGuest}
            onFocus={isGuest ? promptGuestUpgrade : undefined}
          />

          <View style={styles.heroStats}>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{uniqueDays}</Text>
              <Text style={styles.heroStatLabel}>days planned</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{itinerary.length}</Text>
              <Text style={styles.heroStatLabel}>day plans</Text>
            </View>
            <View style={styles.heroStatCard}>
              <Text style={styles.heroStatValue}>{recommendationCount}</Text>
              <Text style={styles.heroStatLabel}>smart picks</Text>
            </View>
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.heroFootnote}>{completedCount} completed</Text>
            <Text style={styles.heroActionText}>Organized around {destinationLabel}</Text>
          </View>
        </View>

        <View style={[styles.composerCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Add a day plan</Text>
          </View>

          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Day</Text>
              <Pressable
                style={[styles.dropdownButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => (isGuest ? promptGuestUpgrade() : setActivePicker('day'))}
              >
                <Text style={[styles.dropdownValue, { color: theme.text }]}>{composerDay}</Text>
                <Ionicons name="chevron-down" size={16} color={theme.mutedText} />
              </Pressable>
            </View>

            <View style={styles.inlineField}>
              <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Best time</Text>
              <Pressable
                style={[styles.dropdownButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => (isGuest ? promptGuestUpgrade() : setActivePicker('time'))}
              >
                <Text style={[styles.dropdownValue, { color: theme.text }]}>{composerTime}</Text>
                <Ionicons name="chevron-down" size={16} color={theme.mutedText} />
              </Pressable>
            </View>
          </View>

          <Text style={[styles.fieldLabel, styles.fieldSpacer, { color: theme.mutedText }]}>Main place for this day</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            value={composerTitle}
            onChangeText={setComposerTitle}
            placeholder="e.g. Burnham Park"
            placeholderTextColor={theme.mutedText}
            editable={!isGuest}
            onFocus={isGuest ? promptGuestUpgrade : undefined}
          />

          <Text style={[styles.fieldLabel, styles.fieldSpacer, { color: theme.mutedText }]}>What happens on this day</Text>
          <TextInput
            style={[styles.input, styles.noteInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            value={composerNote}
            onChangeText={setComposerNote}
            placeholder="Add plans, reminders, food ideas, tickets, or notes for this day."
            placeholderTextColor={theme.mutedText}
            multiline
            editable={!isGuest}
            onFocus={isGuest ? promptGuestUpgrade : undefined}
          />

          <View style={styles.composerActions}>
            <Pressable
              style={[styles.secondaryButton, { backgroundColor: theme.primarySoft }]}
              onPress={() => {
                setComposerTitle('');
                setComposerNote('');
                setComposerTime('9:00 AM');
              }}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>Clear fields</Text>
            </Pressable>
            <Pressable style={[styles.primaryButton, { backgroundColor: theme.primary, opacity: isGuest ? 0.7 : 1 }]} onPress={handleAddManualItem}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Add day</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Itinerary</Text>
          <Text style={[styles.sectionHint, { color: theme.mutedText }]}>{destinationLabel}</Text>
        </View>

        {itineraryByDay.length > 0 ? (
          <View style={styles.timeline}>
            {itineraryByDay.map((group, index) => {
              const isLast = index === itineraryByDay.length - 1;
              const isComplete = group.items.every((item) => item.completed);
              const titleList = group.items.map((item) => item.title).filter(Boolean);
              const planTitle =
                titleList.length > 2
                  ? `${titleList.slice(0, 2).join(' • ')} +${titleList.length - 2} more`
                  : titleList.join(' • ');
              const planNotes = group.items
                .map((item) => item.note?.trim())
                .filter(Boolean)
                .slice(0, 2)
                .join(' ');
              const timeList = Array.from(new Set(group.items.map((item) => item.time).filter(Boolean)));
              const planTime =
                timeList.length > 2
                  ? `${timeList.slice(0, 2).join(' • ')} +${timeList.length - 2}`
                  : timeList.join(' • ');

              return (
                <View key={group.day} style={styles.itineraryItem}>
                  <View style={styles.timelineRail}>
                    <Pressable
                      style={[
                        styles.completeToggle,
                        {
                          backgroundColor: isComplete ? theme.primary : theme.card,
                          borderColor: isComplete ? theme.primary : theme.border,
                        },
                      ]}
                      onPress={() => toggleDayComplete(group.day)}
                    >
                      <Ionicons
                        name={isComplete ? 'checkmark' : 'ellipse'}
                        size={isComplete ? 14 : 10}
                        color={isComplete ? '#FFFFFF' : theme.primary}
                      />
                    </Pressable>
                    {!isLast ? (
                      <View
                        style={[
                          styles.timelineConnector,
                          { backgroundColor: isComplete ? theme.primary : theme.border },
                        ]}
                      />
                    ) : null}
                  </View>

                  <View style={styles.itineraryContent}>
                    <View style={styles.itineraryTop}>
                      <View style={styles.itineraryTopLeft}>
                        <Text style={[styles.itemTitle, { color: theme.text }, isComplete && styles.itemTitleCompleted]}>
                          {group.day}
                        </Text>
                        <Text style={[styles.daySubtitle, { color: theme.mutedText }]} numberOfLines={2}>
                          {planTitle || `Explore ${destinationLabel}`}
                        </Text>
                        <Text style={[styles.itemNote, { color: theme.mutedText }]} numberOfLines={3}>
                          {planNotes || `A full ${group.day.toLowerCase()} plan for ${destinationLabel}.`}
                        </Text>
                        <View style={styles.dayPlaceChips}>
                          {group.items.slice(0, 3).map((item) => (
                            <Pressable
                              key={item.id}
                              style={[styles.dayPlaceChip, { backgroundColor: theme.primarySoft }]}
                              onPress={() => setSelectedDayDetail({ day: group.day, items: group.items })}
                            >
                              <Text style={[styles.dayPlaceChipText, { color: theme.primary }]} numberOfLines={1}>
                                {item.title}
                              </Text>
                            </Pressable>
                          ))}
                          {group.items.length > 3 ? (
                            <Pressable
                              style={[styles.dayPlaceChip, { backgroundColor: theme.card, borderColor: theme.border }]}
                              onPress={() => setSelectedDayDetail({ day: group.day, items: group.items })}
                            >
                              <Text style={[styles.dayPlaceChipText, { color: theme.text }]} numberOfLines={1}>
                                +{group.items.length - 3} more
                              </Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                      <View style={styles.itineraryRight}>
                        <Text style={[styles.itemDayLabel, { color: theme.text }]} numberOfLines={2}>
                          {tripDates || destinationLabel}
                        </Text>
                        <Text style={[styles.itemTime, { color: theme.mutedText }]} numberOfLines={2}>
                          {planTime || 'Flexible day'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itineraryFooter}>
                      <View style={styles.itineraryMetaInline}>
                        <Text style={[styles.itemSource, { color: theme.mutedText }]}>
                          {isComplete ? 'Day finished' : 'Day planned'}
                        </Text>
                        <View style={[styles.itemBadge, { backgroundColor: theme.primarySoft }]}>
                          <Text style={[styles.itemBadgeText, { color: theme.primary }]}>
                            {group.items.length} {group.items.length === 1 ? 'place' : 'places'}
                          </Text>
                        </View>
                      </View>
                      <Pressable onPress={() => removeDay(group.day)} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color={theme.mutedText} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color={theme.mutedText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No itinerary yet</Text>
            <Text style={[styles.emptyCopy, { color: theme.mutedText }]}>
              Start with your own stop above or pull a place, tour, or food recommendation into the trip.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Suggestions</Text>
          <Text style={[styles.sectionHint, { color: theme.mutedText }]}>
            Travel guide
          </Text>
        </View>

        {recommendationGroups.length > 0 ? (
          <View style={styles.recommendationList}>
            {recommendationGroups.map((group) => (
              <View
                key={group.place}
                style={[
                  styles.placeCard,
                  dense && styles.placeCardDense,
                  { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
                ]}
              >
                <Pressable style={styles.placeHeader} onPress={() => toggleSuggestionGroup(group.place)}>
                  <View style={styles.placeHeaderCopy}>
                    <Text style={[styles.recommendationArea, { color: theme.primary }]} numberOfLines={2}>
                      {group.area}
                    </Text>
                    <Text style={[styles.placeTitle, { color: theme.text }]}>{group.place}</Text>
                    <Text style={[styles.placeSummary, { color: theme.mutedText }]}>
                      Tourist spots, food, and route ideas for this place
                    </Text>
                  </View>
                  <View style={styles.placeHeaderRight}>
                    <View style={[styles.placeBadge, { backgroundColor: theme.primarySoft }]}>
                      <Text style={[styles.placeBadgeText, { color: theme.primary }]}>{group.items.length} ideas</Text>
                    </View>
                    <Ionicons
                      name={expandedSuggestions[group.place] ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color={theme.mutedText}
                    />
                  </View>
                </Pressable>

                {expandedSuggestions[group.place] ? (
                  <View style={styles.placeItems}>
                    {group.items.map((item, index) => {
                      const meta = BUCKET_META[item.bucket];
                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.recommendationRow,
                            index > 0 && { borderTopColor: theme.border, borderTopWidth: 1 },
                          ]}
                        >
                          <View style={[styles.recommendationIcon, { backgroundColor: theme.primarySoft }]}>
                            <Ionicons name={item.icon} size={18} color={theme.primary} />
                          </View>
                          <View style={styles.recommendationBody}>
                            <Text style={[styles.recommendationType, { color: theme.primary }]} numberOfLines={1}>
                              {meta.label}
                            </Text>
                            <Text style={[styles.recommendationTitle, { color: theme.text }]}>{item.title}</Text>
                            <Text style={[styles.recommendationNote, { color: theme.mutedText }]}>{item.note}</Text>
                          </View>
                          <Pressable style={[styles.miniAddButton, { backgroundColor: theme.primary, opacity: isGuest ? 0.7 : 1 }]} onPress={() => addRecommendationToTrip(item)}>
                            <Ionicons name="add" size={16} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : (
          <View style={[styles.emptyRecommendationCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Ionicons name="sparkles-outline" size={22} color={theme.primary} />
            <Text style={[styles.emptyRecommendationTitle, { color: theme.text }]}>No suggestions yet</Text>
            <Text style={[styles.emptyRecommendationCopy, { color: theme.mutedText }]}>
              Add your destination or a day place first, then Lumi will show suggestions for those places here.
            </Text>
          </View>
        )}
      </ScrollView>
      <Modal
        animationType="fade"
        transparent
        visible={selectedDayDetail !== null}
        onRequestClose={() => setSelectedDayDetail(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropDismiss} onPress={() => setSelectedDayDetail(null)} />
          <View style={styles.modalCenterWrap}>
            <View
              style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
            >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {selectedDayDetail?.day ?? 'Day details'}
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.mutedText }]}>
              Places and suggestions added for this day
            </Text>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {selectedDayDetail?.items.map((item) => {
                const meta = BUCKET_META[item.bucket];
                return (
                  <View
                    key={item.id}
                    style={[styles.dayDetailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  >
                    <View style={styles.dayDetailTop}>
                      <View style={styles.dayDetailTopLeft}>
                        <Text style={[styles.dayDetailTitle, { color: theme.text }]}>{item.title}</Text>
                        <Text style={[styles.dayDetailTime, { color: theme.mutedText }]}>
                          {item.time} • {item.source === 'recommendation' ? 'Suggested by Lumi' : 'Added manually'}
                        </Text>
                      </View>
                      <View style={[styles.itemBadge, { backgroundColor: theme.primarySoft }]}>
                        <Text style={[styles.itemBadgeText, { color: theme.primary }]}>{meta.label}</Text>
                      </View>
                    </View>
                    <Text style={[styles.dayDetailNote, { color: theme.mutedText }]}>
                      {item.note || 'No extra notes added for this place yet.'}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="fade"
        transparent
        visible={activePicker !== null}
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.modalBackdropDismiss} onPress={() => setActivePicker(null)} />
          <View style={styles.modalCenterWrap}>
            <View
              style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
            >
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {activePicker === 'day' ? 'Select day' : 'Select time'}
            </Text>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {(activePicker === 'day' ? DAY_OPTIONS : TIME_OPTIONS).map((option) => {
                const selected = activePicker === 'day' ? composerDay === option : composerTime === option;
                return (
                  <Pressable
                    key={option}
                    style={[styles.modalOption, selected && { backgroundColor: theme.primarySoft }]}
                    onPress={() => {
                      if (activePicker === 'day') {
                        setComposerDay(option);
                      } else {
                        setComposerTime(option);
                      }
                      setActivePicker(null);
                    }}
                  >
                    <Text style={[styles.modalOptionText, { color: selected ? theme.primary : theme.text }]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundGlow: {
    position: 'absolute',
    top: -80,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.82,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  title: {
    marginTop: 10,
    fontSize: 30,
    lineHeight: 35,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 21,
  },
  guestNotice: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  guestNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  heroCard: {
    marginTop: 20,
    borderRadius: 30,
    padding: 22,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 8,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -24,
    width: 170,
    height: 170,
    borderRadius: 85,
    opacity: 0.35,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitleInput: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 31,
    fontWeight: '900',
    paddingVertical: 0,
  },
  heroMetaInput: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.78)',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 0,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 14,
  },
  heroStatValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  heroStatLabel: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '600',
  },
  heroFooter: {
    marginTop: 18,
  },
  heroFootnote: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '700',
  },
  heroActionText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '700',
  },
  composerCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 26,
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
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineField: {
    flex: 1,
  },
  dropdownButton: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldSpacer: {
    marginTop: 14,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
  },
  noteInput: {
    minHeight: 94,
    textAlignVertical: 'top',
  },
  composerActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  secondaryButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  primaryButton: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  recommendationList: {
    gap: 12,
  },
  emptyRecommendationCard: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  emptyRecommendationTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyRecommendationCopy: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  placeCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  placeCardDense: {
    padding: 14,
  },
  placeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  placeHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },
  placeHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
    maxWidth: 88,
  },
  placeSummary: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    flexShrink: 1,
  },
  placeTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '900',
    flexShrink: 1,
  },
  placeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  placeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  placeItems: {
    marginTop: 14,
  },
  recommendationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 2,
  },
  recommendationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationBody: {
    flex: 1,
    minWidth: 0,
  },
  recommendationArea: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  recommendationType: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    flexShrink: 1,
  },
  recommendationTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '900',
    flexShrink: 1,
  },
  recommendationNote: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    flexShrink: 1,
  },
  miniAddButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  timeline: {
    gap: 12,
  },
  dayCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 3,
  },
  dayCardDense: {
    padding: 14,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  dayHeaderCopy: {
    flex: 1,
  },
  dayTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  daySubtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  dayBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dayProgress: {
    flexDirection: 'row',
    marginTop: 16,
  },
  dayProgressSegment: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  dayMetaList: {
    marginTop: 18,
    gap: 12,
  },
  dayMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayMetaLabel: {
    minWidth: 66,
    fontSize: 13,
    fontWeight: '600',
  },
  dayMetaValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  daySummary: {
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
  },
  daySummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  daySummaryCopy: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  dayCount: {
    fontSize: 12,
    fontWeight: '700',
  },
  itineraryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 18,
  },
  timelineRail: {
    alignItems: 'center',
    width: 34,
  },
  completeToggle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    minHeight: 58,
    marginTop: 4,
  },
  itineraryContent: {
    flex: 1,
    paddingBottom: 2,
  },
  itineraryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  itineraryTopLeft: {
    flex: 1,
    paddingRight: 10,
    minWidth: 0,
  },
  itineraryRight: {
    alignItems: 'flex-end',
    width: 96,
    flexShrink: 0,
  },
  itemTime: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  itemBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  itemSource: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemDayLabel: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  itemTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  itemNote: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
  dayPlaceChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  dayPlaceChip: {
    maxWidth: '100%',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayPlaceChipText: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 1,
  },
  itineraryFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itineraryMetaInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 36,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCopy: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.3)',
  },
  modalBackdropDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    maxHeight: '70%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingBottom: 6,
  },
  modalOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dayDetailCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  dayDetailTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  dayDetailTopLeft: {
    flex: 1,
    minWidth: 0,
  },
  dayDetailTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  dayDetailTime: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  dayDetailNote: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
});
