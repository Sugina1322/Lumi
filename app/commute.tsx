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
import { useAppTheme } from '../lib/app-theme';

export default function CommuteScreen() {
  const { user } = useAuth();
  const { theme } = useAppTheme();
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
    loadWeights(user?.id).then((nextWeights) => {
      weightsRef.current = nextWeights;
    });
  }, [user?.id]);

  const filteredLocations = (query: string) =>
    KNOWN_LOCATIONS.filter((location) => {
      const normalizedQuery = query.toLowerCase();
      return (
        location.name.toLowerCase().includes(normalizedQuery) ||
        (location.aliases ?? []).some((alias) => alias.toLowerCase().includes(normalizedQuery))
      );
    }).slice(0, 5);

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
      setRoutes(scoreRoutes(result.routes, weightsRef.current));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const handleSelectRoute = useCallback(
    (route: RouteOption) => {
      setSelectedId(route.id);
      const updated = learnFromSelection(weightsRef.current, rawRoutesRef.current, route);
      weightsRef.current = updated;
      saveWeights(updated, user?.id);
    },
    [user?.id],
  );

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const displayText = (value: unknown, fallback = '') =>
    typeof value === 'string' && value.length > 0 ? value : fallback;

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
          {
            backgroundColor: theme.card,
            borderColor: isSelected ? theme.primary : theme.border,
            shadowColor: theme.shadow,
          },
          pressed && styles.routeCardPressed,
        ]}
        onPress={() => handleSelectRoute(item)}
      >
        <View style={styles.routeHeader}>
          <View style={styles.routeHeaderLeft}>
            <View
              style={[
                styles.scoreBadge,
                { backgroundColor: isBest ? theme.primary : theme.primarySoft },
              ]}
            >
              <Text style={[styles.scoreBadgeText, { color: isBest ? '#FFFFFF' : theme.primary }]}>
                {label}
              </Text>
            </View>
            {isSelected ? <Ionicons name="checkmark-circle" size={18} color={theme.primary} /> : null}
          </View>

          <Pressable hitSlop={8} onPress={() => setExpanded(isExpanded ? null : item.id)}>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.mutedText}
            />
          </Pressable>
        </View>

        <Text style={[styles.routeSummary, { color: theme.text }]}>
          {displayText(item.summary, 'Route')}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color={theme.mutedText} />
            <Text style={[styles.statText, { color: theme.mutedText }]}>{formatDuration(item.duration)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="cash-outline" size={14} color={theme.mutedText} />
            <Text style={[styles.statText, { color: theme.mutedText }]}>{formatCost(item.cost)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="swap-horizontal-outline" size={14} color={theme.mutedText} />
            <Text style={[styles.statText, { color: theme.mutedText }]}>
              {item.transfers} transfer{item.transfers !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="footsteps-outline" size={14} color={theme.mutedText} />
            <Text style={[styles.statText, { color: theme.mutedText }]}>
              {(item.walkingMeters / 1000).toFixed(1)} km
            </Text>
          </View>
        </View>

        <View style={styles.highlightRow}>
          {highlights.map((highlight) => (
            <View
              key={highlight}
              style={[
                styles.highlightChip,
                { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.highlightChipText, { color: theme.primary }]}>{highlight}</Text>
            </View>
          ))}
        </View>

        <View style={styles.modesRow}>
          {item.steps
            .filter((step) => step.mode !== 'walk')
            .map((step, index) => (
              <View key={index} style={[styles.modeChip, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name={getModeIcon(step.mode) as any} size={14} color={theme.primary} />
                <Text style={[styles.modeChipText, { color: theme.primary }]}>
                  {displayText(step.lineName, step.mode)}
                </Text>
              </View>
            ))}
        </View>

        {isExpanded ? (
          <View style={[styles.stepsContainer, { borderTopColor: theme.border }]}>
            <Text style={[styles.stepsTitle, { color: theme.text }]}>Step-by-step directions</Text>
            {item.steps.map((step, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={[styles.stepDot, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name={getModeIcon(step.mode) as any} size={16} color={theme.primary} />
                </View>
                <View style={styles.stepBody}>
                  <Text style={[styles.stepInstruction, { color: theme.text }]}>
                    {displayText(step.instruction, 'Continue')}
                  </Text>
                  <Text style={[styles.stepMeta, { color: theme.mutedText }]}>
                    {step.durationMinutes} min · {(step.distanceMeters / 1000).toFixed(1)} km
                    {step.cost > 0 ? ` · ${formatCost(step.cost)}` : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
    );
  };

  const modeBannerStyle =
    routeSource === 'live'
      ? styles.modeBannerLive
      : routeSource === 'database'
        ? styles.modeBannerDatabase
        : styles.modeBannerFallback;

  const modeBadgeIconColor =
    routeSource === 'live' ? '#2E7D32' : routeSource === 'database' ? '#0F766E' : theme.primary;

  const modeBadgeTextColor =
    routeSource === 'live' ? '#2E7D32' : routeSource === 'database' ? '#0F766E' : theme.primary;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.backgroundGlow, { backgroundColor: theme.primarySoft }]} />

      <View style={styles.header}>
        <Pressable
          style={[
            styles.headerButton,
            { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
          ]}
          onPress={() => router.back()}
          hitSlop={6}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Commute Guide</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.text }]}>Where are you headed?</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Find the best route based on your preferences. Live transit data is used when available.
        </Text>

        <View style={[styles.modeBanner, modeBannerStyle]}>
          <View style={[styles.modeBadge, { backgroundColor: routeSource === 'fallback' ? theme.primarySoft : '#FFFFFF' }]}>
            <Ionicons
              name={
                routeSource === 'live'
                  ? 'radio-outline'
                  : routeSource === 'database'
                    ? 'git-network-outline'
                    : 'analytics-outline'
              }
              size={13}
              color={modeBadgeIconColor}
            />
            <Text style={[styles.modeBadgeText, { color: modeBadgeTextColor }]}>
              {routeSource === 'live'
                ? 'Live transit data'
                : routeSource === 'database'
                  ? 'Structured local data'
                  : 'Local estimates'}
            </Text>
          </View>
          <Text style={[styles.modeBannerText, { color: theme.text }]}>
            {routeSource === 'live'
              ? 'Routes are pulled from Google and then ranked with your preferences.'
              : routeSource === 'database'
                ? 'Routes are pulled from Lumi transit data before falling back to live routing.'
                : 'Lumi is using local estimates until live routing is available.'}
          </Text>
          {routeMessage ? <Text style={[styles.routeNotice, { color: theme.mutedText }]}>{routeMessage}</Text> : null}
        </View>

        <View
          style={[
            styles.inputSection,
            { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
          ]}
        >
          <View style={styles.inputRow}>
            <View style={styles.inputDot}>
              <View style={styles.dotGreen} />
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                ]}
                placeholder="From (e.g. SM North EDSA)"
                placeholderTextColor={theme.mutedText}
                value={from}
                onChangeText={(value) => {
                  setFrom(value);
                  setShowFromSuggestions(value.length > 0);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!suggestionPressedRef.current) setShowFromSuggestions(false);
                    suggestionPressedRef.current = false;
                  }, 0);
                }}
              />
              {showFromSuggestions && filteredLocations(from).length > 0 ? (
                <View
                  style={[
                    styles.suggestions,
                    { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
                  ]}
                >
                  {filteredLocations(from).map((location) => (
                    <Pressable
                      key={location.name}
                      style={styles.suggestionItem}
                      onPressIn={() => {
                        suggestionPressedRef.current = true;
                      }}
                      onPress={() => {
                        setFrom(location.name);
                        setShowFromSuggestions(false);
                      }}
                    >
                      <Ionicons name="location-outline" size={14} color={theme.mutedText} />
                      <Text style={[styles.suggestionText, { color: theme.text }]}>{location.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          <Pressable style={[styles.swapButton, { backgroundColor: theme.primarySoft }]} onPress={handleSwap}>
            <Ionicons name="swap-vertical" size={20} color={theme.primary} />
          </Pressable>

          <View style={styles.inputRow}>
            <View style={styles.inputDot}>
              <View style={[styles.dotPurple, { backgroundColor: theme.primary }]} />
            </View>
            <View style={styles.inputWrap}>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
                ]}
                placeholder="To (e.g. Makati CBD)"
                placeholderTextColor={theme.mutedText}
                value={to}
                onChangeText={(value) => {
                  setTo(value);
                  setShowToSuggestions(value.length > 0);
                }}
                onBlur={() => {
                  setTimeout(() => {
                    if (!suggestionPressedRef.current) setShowToSuggestions(false);
                    suggestionPressedRef.current = false;
                  }, 0);
                }}
              />
              {showToSuggestions && filteredLocations(to).length > 0 ? (
                <View
                  style={[
                    styles.suggestions,
                    { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
                  ]}
                >
                  {filteredLocations(to).map((location) => (
                    <Pressable
                      key={location.name}
                      style={styles.suggestionItem}
                      onPressIn={() => {
                        suggestionPressedRef.current = true;
                      }}
                      onPress={() => {
                        setTo(location.name);
                        setShowToSuggestions(false);
                      }}
                    >
                      <Ionicons name="location-outline" size={14} color={theme.mutedText} />
                      <Text style={[styles.suggestionText, { color: theme.text }]}>{location.name}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <Pressable
          style={[
            styles.searchButton,
            { backgroundColor: theme.primary, shadowColor: theme.shadow },
            (!from.trim() || !to.trim()) && styles.searchButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={!from.trim() || !to.trim()}
        >
          <Ionicons name="navigate" size={16} color="#FFFFFF" />
          <Text style={styles.searchButtonText}>Find routes</Text>
        </Pressable>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.mutedText }]}>
              {routeSource === 'live' ? 'Finding live routes from Google...' : 'Calculating local estimates...'}
            </Text>
          </View>
        ) : null}

        {!loading && searched && routes.length > 0 ? (
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: theme.text }]}>{routes.length} routes found</Text>
              <Text style={[styles.resultsSubtitle, { color: theme.mutedText }]}>Ranked by your preferences</Text>
            </View>

            {routes.map((route) => (
              <View key={route.id}>{renderRoute({ item: route })}</View>
            ))}

            {selectedId ? (
              <View style={[styles.learnNote, { backgroundColor: theme.primarySoft }]}>
                <Ionicons name="sparkles" size={14} color={theme.primary} />
                <Text style={[styles.learnNoteText, { color: theme.primary }]}>
                  Lumi is learning your preferences to rank better routes next time.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {!loading && searched && routes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color={theme.mutedText} />
            <Text style={[styles.emptyText, { color: theme.mutedText }]}>No routes found. Try different locations.</Text>
          </View>
        ) : null}
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
    top: -80,
    right: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  headerButton: {
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
  },
  modeBanner: {
    marginTop: 14,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
  },
  modeBannerLive: {
    backgroundColor: '#F0FAF2',
    borderColor: '#D8F0DF',
  },
  modeBannerDatabase: {
    backgroundColor: '#EBF7F5',
    borderColor: '#CFEDE7',
  },
  modeBannerFallback: {
    backgroundColor: '#F6F0E7',
    borderColor: '#EADCC7',
  },
  modeBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  modeBannerText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  routeNotice: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
  },
  inputSection: {
    marginTop: 18,
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputDot: {
    width: 24,
    alignItems: 'center',
  },
  dotGreen: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38A169',
  },
  dotPurple: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inputWrap: {
    flex: 1,
    zIndex: 10,
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
  },
  swapButton: {
    alignSelf: 'center',
    marginLeft: 36,
    marginVertical: 8,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
    paddingVertical: 4,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 6,
  },
  searchButtonDisabled: {
    opacity: 0.5,
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  loadingWrap: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsSection: {
    marginTop: 24,
    gap: 12,
  },
  resultsHeader: {
    marginBottom: 4,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  resultsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  routeCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  routeCardPressed: {
    transform: [{ scale: 0.995 }],
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  scoreBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  routeSummary: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  highlightChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  highlightChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  modeChipText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  stepsContainer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBody: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    fontWeight: '700',
  },
  stepMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  learnNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 12,
    marginTop: 4,
  },
  learnNoteText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
  },
});
