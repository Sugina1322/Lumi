import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../lib/app-theme';
import { useAppSettings } from '../../lib/app-settings';

const STORAGE_KEY = 'lumi_saved_places';

type SavedPlace = {
  id: string;
  name: string;
  note: string;
  tag: string;
};

const TAGS = ['Cafe', 'Food', 'Art', 'Stay', 'Spot', 'Shop', 'Transit'];

const TAG_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  Cafe: 'cafe-outline',
  Food: 'restaurant-outline',
  Art: 'color-palette-outline',
  Stay: 'bed-outline',
  Spot: 'location-outline',
  Shop: 'bag-outline',
  Transit: 'train-outline',
};

export default function SavedScreen() {
  const { theme } = useAppTheme();
  const { settings } = useAppSettings();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const dense = settings.compactCards;

  const [places, setPlaces] = useState<SavedPlace[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTag, setActiveTag] = useState('All');
  const [composerOpen, setComposerOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('Spot');

  // Load from storage
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY).then((raw) => {
      if (raw) {
        try { setPlaces(JSON.parse(raw)); } catch {}
      }
      setLoaded(true);
    });
  }, []);

  // Persist to storage
  useEffect(() => {
    if (!loaded) return;
    SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(places)).catch(() => {});
  }, [places, loaded]);

  const addPlace = useCallback(() => {
    if (!newName.trim()) return;
    setPlaces((prev) => [
      {
        id: Date.now().toString(),
        name: newName.trim(),
        note: newNote.trim(),
        tag: newTag,
      },
      ...prev,
    ]);
    setNewName('');
    setNewNote('');
    setNewTag('Spot');
    setComposerOpen(false);
  }, [newName, newNote, newTag]);

  const deletePlace = useCallback((id: string, name: string) => {
    Alert.alert('Remove place', `Remove "${name}" from saved?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setPlaces((prev) => prev.filter((p) => p.id !== id)),
      },
    ]);
  }, []);

  const filterTags = ['All', ...Array.from(new Set(places.map((p) => p.tag)))];
  const filtered = activeTag === 'All' ? places : places.filter((p) => p.tag === activeTag);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.root, { backgroundColor: theme.surface }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 4, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Saved</Text>
          {places.length > 0 && (
            <View style={[styles.countBadge, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.countText, { color: theme.primary }]}>{places.length}</Text>
            </View>
          )}
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: composerOpen ? theme.primary : theme.card, borderColor: theme.border },
            pressed && styles.pressedSmall,
          ]}
          onPress={() => setComposerOpen((v) => !v)}
          accessibilityLabel={composerOpen ? 'Close add form' : 'Add a place'}
          accessibilityRole="button"
        >
          <Ionicons
            name={composerOpen ? 'close' : 'add'}
            size={22}
            color={composerOpen ? '#fff' : theme.text}
          />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Add form ── */}
        {composerOpen && (
          <View style={[styles.composer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TextInput
              style={[styles.composerInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
              placeholder="Place name"
              placeholderTextColor={theme.mutedText}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              returnKeyType="next"
            />
            <TextInput
              style={[styles.composerInput, { borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }]}
              placeholder="Note (optional)"
              placeholderTextColor={theme.mutedText}
              value={newNote}
              onChangeText={setNewNote}
              returnKeyType="done"
              onSubmitEditing={addPlace}
            />

            {/* Tag picker */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagRow}
            >
              {TAGS.map((tag) => (
                <Pressable
                  key={tag}
                  style={({ pressed }) => [
                    styles.tagChip,
                    {
                      backgroundColor: newTag === tag ? theme.primary : theme.surfaceAlt,
                      borderColor: newTag === tag ? theme.primary : theme.border,
                    },
                    pressed && styles.pressedSmall,
                  ]}
                  onPress={() => setNewTag(tag)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tag: ${tag}`}
                >
                  <Ionicons
                    name={TAG_ICONS[tag] ?? 'location-outline'}
                    size={13}
                    color={newTag === tag ? '#fff' : theme.mutedText}
                  />
                  <Text style={[styles.tagChipText, { color: newTag === tag ? '#fff' : theme.mutedText }]}>
                    {tag}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: newName.trim() ? theme.primary : theme.border },
                pressed && styles.pressedSmall,
              ]}
              onPress={addPlace}
              disabled={!newName.trim()}
              accessibilityRole="button"
              accessibilityLabel="Save place"
            >
              <Text style={[styles.saveBtnText, { color: newName.trim() ? '#fff' : theme.mutedText }]}>
                Save place
              </Text>
            </Pressable>
          </View>
        )}

        {/* ── Filter chips ── */}
        {places.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filterTags.map((tag) => (
              <Pressable
                key={tag}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: activeTag === tag ? theme.primary : theme.card,
                    borderColor: activeTag === tag ? theme.primary : theme.border,
                  },
                  pressed && styles.pressedSmall,
                ]}
                onPress={() => setActiveTag(tag)}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${tag}`}
              >
                <Text style={[styles.filterChipText, { color: activeTag === tag ? '#fff' : theme.text }]}>
                  {tag}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* ── Place list ── */}
        {filtered.length === 0 && loaded ? (
          <View style={[styles.empty, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
              <Ionicons name="bookmark-outline" size={24} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              {places.length === 0 ? 'No saved places yet' : `No places tagged "${activeTag}"`}
            </Text>
            <Text style={[styles.emptySub, { color: theme.mutedText }]}>
              {places.length === 0
                ? 'Tap + to save a cafe, spot, or stop.'
                : 'Try a different filter above.'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((place) => (
              <View
                key={place.id}
                style={[
                  styles.placeCard,
                  dense && styles.placeCardDense,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                <View style={[styles.placeIcon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons
                    name={TAG_ICONS[place.tag] ?? 'location-outline'}
                    size={20}
                    color={theme.primary}
                  />
                </View>

                <View style={styles.placeBody}>
                  <View style={styles.placeTop}>
                    <Text style={[styles.placeName, { color: theme.text }]} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <View style={[styles.placeTagBadge, { backgroundColor: theme.primarySoft }]}>
                      <Text style={[styles.placeTagText, { color: theme.primary }]}>{place.tag}</Text>
                    </View>
                  </View>
                  {place.note ? (
                    <Text style={[styles.placeNote, { color: theme.mutedText }]} numberOfLines={2}>
                      {place.note}
                    </Text>
                  ) : null}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressedSmall]}
                  onPress={() => deletePlace(place.id, place.name)}
                  accessibilityLabel={`Remove ${place.name}`}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={17} color={theme.mutedText} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
  },
  countBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  // Composer
  composer: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  composerInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
  },
  tagRow: {
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  // Filters
  filterRow: {
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty state
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Place list
  list: {
    gap: 10,
  },
  placeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  placeCardDense: {
    padding: 12,
  },
  placeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  placeBody: {
    flex: 1,
  },
  placeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  placeName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  placeTagBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  placeTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  placeNote: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  pressedSmall: { opacity: 0.7 },
});
