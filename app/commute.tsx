import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  DEFAULT_WEIGHTS,
  formatCost,
  formatDuration,
  getModeIcon,
  getScoreLabel,
  learnFromSelection,
  RouteOption,
  scoreRoutes,
  UserWeights,
} from '../lib/route-algorithm';
import { fetchRoutes, KNOWN_LOCATIONS, RouteSource } from '../lib/transit-provider';
import { loadWeights, saveWeights } from '../lib/preferences';
import { useAuth } from '../context/auth';

export default function CommuteScreen() {
  const { user } = useAuth();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);
  const [routeSource, setRouteSource] = useState<RouteSource>('fallback');
  const [routeMessage, setRouteMessage] = useState<string | null>(null);

  const weightsRef = useRef<UserWeights>({ ...DEFAULT_WEIGHTS });
  const rawRoutesRef = useRef<RouteOption[]>([]);
  const suggestionPressedRef = useRef(false);

  useEffect(() => {
    loadWeights(user?.id).then((w) => {
      weightsRef.current = w;
    });
  }, [user?.id]);

  const filteredLocations = (query: string) =>
    KNOWN_LOCATIONS.filter((l) => l.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5);

  const getRouteHighlights = (route: RouteOption) => {
    const highlights: string[] = [];

    if (route.transfers === 0) highlights.push('No transfers');
    else if (route.transfers === 1) highlights.push('1 transfer');
    else highlights.push(`${route.transfers} transfers`);

    if (route.walkingMeters < 500) highlights.push('Low walking');
    else if (route.walkingMeters < 1500) highlights.push('Moderate walking');
    else highlights.push('More walking');

    if (route.cost <= 30) highlights.push('Budget friendly');
    else if (route.cost <= 80) highlights.push('Balanced fare');
    else highlights.push('Higher fare');

    return highlights.slice(0, 3);
  };

  const handleSearch = useCallback(async () => {
    if (!from.trim() || !to.trim()) return;
    setLoading(true);
    setSearched(true);
    setSelectedId(null);
    setExpanded(null);
    setRouteMessage(null);
    try {
      const result = await fetchRoutes(from.trim(), to.trim());
      rawRoutesRef.current = result.routes;
      setRouteSource(result.source);
      setRouteMessage(result.message ?? null);
      const scored = scoreRoutes(result.routes, weightsRef.current);
      setRoutes(scored);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const handleSelectRoute = useCallback((route: RouteOption) => {
    setSelectedId(route.id);
    const updated = learnFromSelection(
      weightsRef.current,
      rawRoutesRef.current,
      route,
    );
    weightsRef.current = updated;
    saveWeights(updated, user?.id);
  }, [user?.id]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const renderRoute = ({ item }: { item: RouteOption }) => {
    const isSelected = selectedId === item.id;
    const isExpanded = expanded === item.id;
    const label = getScoreLabel(item.score ?? 1);
    const isBest = label === 'Best match';
    const highlights = getRouteHighlights(item);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.routeCard,
          isSelected && styles.routeCardSelected,
          pressed && styles.routeCardPressed,
        ]}
        onPress={() => handleSelectRoute(item)}
      >
        <View style={styles.routeHeader}>
          <View style={styles.routeHeaderLeft}>
            <View style={[styles.scoreBadge, isBest && styles.scoreBadgeBest]}>
              <Text style={[styles.scoreBadgeText, isBest && styles.scoreBadgeTextBest]}>
                {label}
              </Text>
            </View>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={18} color="#7055C8" />
            )}
          </View>
          <Pressable
            hitSlop={8}
            onPress={() => setExpanded(isExpanded ? null : item.id)}
          >
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#7B6FA0"
            />
          </Pressable>
        </View>

        <Text style={styles.routeSummary}>{item.summary}</Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color="#7B6FA0" />
            <Text style={styles.statText}>{formatDuration(item.duration)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="cash-outline" size={14} color="#7B6FA0" />
            <Text style={styles.statText}>{formatCost(item.cost)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="swap-horizontal-outline" size={14} color="#7B6FA0" />
            <Text style={styles.statText}>
              {item.transfers} transfer{item.transfers !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="footsteps-outline" size={14} color="#7B6FA0" />
            <Text style={styles.statText}>{(item.walkingMeters / 1000).toFixed(1)} km</Text>
          </View>
        </View>

        <View style={styles.highlightRow}>
          {highlights.map((highlight) => (
            <View key={highlight} style={styles.highlightChip}>
              <Text style={styles.highlightChipText}>{highlight}</Text>
            </View>
          ))}
        </View>

        <View style={styles.modesRow}>
          {item.steps
            .filter((s) => s.mode !== 'walk')
            .map((s, i) => (
              <View key={i} style={styles.modeChip}>
                <Ionicons name={getModeIcon(s.mode) as any} size={14} color="#7055C8" />
                <Text style={styles.modeChipText}>
                  {s.lineName ?? s.mode}
                </Text>
              </View>
            ))}
        </View>

        {isExpanded && (
          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>Step-by-step directions</Text>
            {item.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepDot}>
                  <Ionicons name={getModeIcon(s.mode) as any} size={16} color="#7055C8" />
                </View>
                <View style={styles.stepBody}>
                  <Text style={styles.stepInstruction}>{s.instruction}</Text>
                  <Text style={styles.stepMeta}>
                    {s.durationMinutes} min · {(s.distanceMeters / 1000).toFixed(1)} km
                    {s.cost > 0 ? ` · ${formatCost(s.cost)}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with back button */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={6}>
          <Ionicons name="arrow-back" size={22} color="#2F2257" />
        </Pressable>
        <Text style={styles.headerTitle}>Commute Guide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Where are you headed?</Text>
        <Text style={styles.subtitle}>
          Find the best route based on your preferences. Live transit data is used when available.
        </Text>
        <View style={[styles.modeBanner, routeSource === 'live' ? styles.modeBannerLive : styles.modeBannerFallback]}>
          <View style={styles.modeBadge}>
            <Ionicons
              name={routeSource === 'live' ? 'radio-outline' : 'analytics-outline'}
              size={13}
              color={routeSource === 'live' ? '#2E7D32' : '#7055C8'}
            />
            <Text style={[styles.modeBadgeText, routeSource === 'live' && styles.modeBadgeTextLive]}>
              {routeSource === 'live' ? 'Live transit data' : 'Local estimates'}
            </Text>
          </View>
          <Text style={styles.modeBannerText}>
            {routeSource === 'live'
              ? 'Routes are pulled from Google and then ranked with your preferences.'
              : 'Lumi is using local estimates until live routing is available.'}
          </Text>
          {routeMessage ? <Text style={styles.routeNotice}>{routeMessage}</Text> : null}
        </View>

        <View style={styles.inputSection}>
          <View style={styles.inputRow}>
            <View style={styles.inputDot}>
              <View style={styles.dotGreen} />
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="From (e.g. SM North EDSA)"
                placeholderTextColor="#A89CC8"
                value={from}
                onChangeText={(t) => {
                  setFrom(t);
                  setShowFromSuggestions(t.length > 0);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!suggestionPressedRef.current) {
                      setShowFromSuggestions(false);
                    }
                    suggestionPressedRef.current = false;
                  }, 0);
                }}
              />
              {showFromSuggestions && filteredLocations(from).length > 0 && (
                <View style={styles.suggestions}>
                  {filteredLocations(from).map((loc) => (
                    <Pressable
                      key={loc.name}
                      style={styles.suggestionItem}
                      onPressIn={() => { suggestionPressedRef.current = true; }}
                      onPress={() => {
                        setFrom(loc.name);
                        setShowFromSuggestions(false);
                      }}
                    >
                      <Ionicons name="location-outline" size={14} color="#7B6FA0" />
                      <Text style={styles.suggestionText}>{loc.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>

          <Pressable style={styles.swapBtn} onPress={handleSwap}>
            <Ionicons name="swap-vertical" size={20} color="#7055C8" />
          </Pressable>

          <View style={styles.inputRow}>
            <View style={styles.inputDot}>
              <View style={styles.dotPurple} />
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="To (e.g. Makati CBD)"
                placeholderTextColor="#A89CC8"
                value={to}
                onChangeText={(t) => {
                  setTo(t);
                  setShowToSuggestions(t.length > 0);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!suggestionPressedRef.current) {
                      setShowToSuggestions(false);
                    }
                    suggestionPressedRef.current = false;
                  }, 0);
                }}
              />
              {showToSuggestions && filteredLocations(to).length > 0 && (
                <View style={styles.suggestions}>
                  {filteredLocations(to).map((loc) => (
                    <Pressable
                      key={loc.name}
                      style={styles.suggestionItem}
                      onPressIn={() => { suggestionPressedRef.current = true; }}
                      onPress={() => {
                        setTo(loc.name);
                        setShowToSuggestions(false);
                      }}
                    >
                      <Ionicons name="location-outline" size={14} color="#7B6FA0" />
                      <Text style={styles.suggestionText}>{loc.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
        </View>

        <Pressable
          style={[styles.searchBtn, (!from.trim() || !to.trim()) && styles.searchBtnDisabled]}
          onPress={handleSearch}
          disabled={!from.trim() || !to.trim()}
        >
          <Ionicons name="navigate" size={16} color="#FFF" />
          <Text style={styles.searchBtnText}>Find routes</Text>
        </Pressable>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#7055C8" />
            <Text style={styles.loadingText}>
              {routeSource === 'live' ? 'Finding live routes from Google...' : 'Calculating local estimates...'}
            </Text>
          </View>
        )}

        {!loading && searched && routes.length > 0 && (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                {routes.length} routes found
              </Text>
              <Text style={styles.resultsSubtitle}>Ranked by your preferences</Text>
            </View>
            {routes.map((route) => (
              <View key={route.id}>{renderRoute({ item: route })}</View>
            ))}
            {selectedId && (
              <View style={styles.learnNote}>
                <Ionicons name="sparkles" size={14} color="#7055C8" />
                <Text style={styles.learnNoteText}>
                  Lumi is learning your preferences to rank better routes next time.
                </Text>
              </View>
            )}
          </View>
        )}

        {!loading && searched && routes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color="#C4B5E3" />
            <Text style={styles.emptyText}>No routes found. Try different locations.</Text>
          </View>
        )}
      </ScrollView>
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
    paddingHorizontal: 20,
    backgroundColor: '#F5F0FF',
  },
  headerBtn: {
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
  headerTitle: {
    color: '#1E1640',
    fontSize: 17,
    fontWeight: '800',
  },

  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 28 },

  title: {
    color: '#2F2644',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    color: '#655C7C',
    fontSize: 14,
    lineHeight: 21,
  },
  modeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#EDE8FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeBadgeText: {
    color: '#7055C8',
    fontSize: 12,
    fontWeight: '800',
  },
  modeBadgeTextLive: {
    color: '#2E7D32',
  },
  modeBanner: {
    marginTop: 12,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
  },
  modeBannerLive: {
    backgroundColor: '#F0FAF2',
    borderColor: '#D8F0DF',
  },
  modeBannerFallback: {
    backgroundColor: '#F4F0FF',
    borderColor: '#E1D7FF',
  },
  modeBannerText: {
    marginTop: 8,
    color: '#4F4668',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  routeNotice: {
    marginTop: 8,
    color: '#675C85',
    fontSize: 12,
    lineHeight: 17,
  },

  inputSection: { marginTop: 20, gap: 0 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputDot: { width: 24, alignItems: 'center' },
  dotGreen: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4CAF50' },
  dotPurple: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#7055C8' },
  inputWrap: { flex: 1, zIndex: 10 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2F2644',
    fontWeight: '600',
    shadowColor: '#4C3D81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  swapBtn: {
    alignSelf: 'center',
    marginLeft: 36,
    marginVertical: 6,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginTop: 4,
    paddingVertical: 4,
    shadowColor: '#4C3D81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: { color: '#2F2644', fontSize: 14, fontWeight: '600' },

  searchBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7055C8',
    borderRadius: 999,
    paddingVertical: 16,
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },

  loadingWrap: { alignItems: 'center', marginTop: 40, gap: 12 },
  loadingText: { color: '#7B6FA0', fontSize: 14, fontWeight: '600' },

  resultsSection: { marginTop: 24, gap: 12 },
  resultsHeader: { marginBottom: 4 },
  resultsTitle: { color: '#2F2644', fontSize: 20, fontWeight: '800' },
  resultsSubtitle: { color: '#7B6FA0', fontSize: 13, marginTop: 2 },

  routeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#4C3D81',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  routeCardSelected: {
    borderWidth: 2,
    borderColor: '#7055C8',
  },
  routeCardPressed: {
    transform: [{ scale: 0.995 }],
    shadowOpacity: 0.09,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreBadge: {
    backgroundColor: '#EDE8FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreBadgeBest: { backgroundColor: '#7055C8' },
  scoreBadgeText: { color: '#6248B0', fontSize: 11, fontWeight: '800' },
  scoreBadgeTextBest: { color: '#FFFFFF' },
  routeSummary: {
    marginTop: 10,
    color: '#2F2644',
    fontSize: 16,
    fontWeight: '800',
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: '#7B6FA0', fontSize: 12, fontWeight: '600' },

  highlightRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  highlightChip: {
    backgroundColor: '#FBF8FF',
    borderWidth: 1,
    borderColor: '#EDE8FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  highlightChipText: {
    color: '#5A44A8',
    fontSize: 11,
    fontWeight: '700',
  },

  modesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F5F0FF',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeChipText: { color: '#7055C8', fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  stepsContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#EDE8FF',
  },
  stepsTitle: { color: '#2F2644', fontSize: 14, fontWeight: '800', marginBottom: 10 },
  stepRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#F5F0FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: { flex: 1 },
  stepInstruction: { color: '#2F2644', fontSize: 14, fontWeight: '700' },
  stepMeta: { color: '#7B6FA0', fontSize: 12, marginTop: 2 },

  learnNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EDE8FF',
    borderRadius: 14,
    padding: 12,
    marginTop: 4,
  },
  learnNoteText: { flex: 1, color: '#5A44A8', fontSize: 12, fontWeight: '600', lineHeight: 17 },

  emptyState: { alignItems: 'center', marginTop: 40, gap: 12 },
  emptyText: { color: '#7B6FA0', fontSize: 14 },
});
