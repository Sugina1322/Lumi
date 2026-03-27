import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../lib/app-theme';

interface BudgetItem {
  id: string;
  category: string;
  label: string;
  amount: number;
  icon: string;
}

interface BudgetData {
  tripName: string;
  totalBudget: string;
  items: BudgetItem[];
}

const STORAGE_KEY = 'lumi_travel_budget';

const CATEGORIES = [
  { key: 'transport', label: 'Transport', icon: 'bus-outline' },
  { key: 'food', label: 'Food & Drinks', icon: 'restaurant-outline' },
  { key: 'accommodation', label: 'Accommodation', icon: 'bed-outline' },
  { key: 'activities', label: 'Activities', icon: 'ticket-outline' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

async function saveBudget(data: BudgetData) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
}

async function loadBudget(): Promise<BudgetData | null> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

async function clearBudget() {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

export default function BudgetScreen() {
  const { theme } = useAppTheme();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [tripName, setTripName] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState('transport');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadBudget().then((data) => {
      if (data) {
        setTripName(data.tripName);
        setTotalBudget(data.totalBudget);
        setItems(data.items);
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const hasContent = tripName.trim().length > 0 || totalBudget.trim().length > 0 || items.length > 0;

    if (!hasContent) {
      clearBudget();
      return;
    }

    saveBudget({ tripName, totalBudget, items });
  }, [tripName, totalBudget, items, loaded]);

  const spent = items.reduce((sum, item) => sum + item.amount, 0);
  const budget = parseFloat(totalBudget) || 0;
  const remaining = budget - spent;
  const progress = budget > 0 ? Math.min(spent / budget, 1) : 0;

  const handleAdd = useCallback(() => {
    const amount = parseFloat(newAmount);
    if (!newLabel.trim() || Number.isNaN(amount) || amount <= 0) return;

    const category = CATEGORIES.find((item) => item.key === selectedCat)!;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        category: category.key,
        label: newLabel.trim(),
        amount,
        icon: category.icon,
      },
    ]);
    setNewLabel('');
    setNewAmount('');
    setShowAdd(false);
  }, [newAmount, newLabel, selectedCat]);

  const handleDeleteItem = (id: string) => {
    Alert.alert('Remove item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems((prev) => prev.filter((item) => item.id !== id)) },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Delete budget', 'This will remove all your budget data. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setTripName('');
          setTotalBudget('');
          setItems([]);
        },
      },
    ]);
  };

  const groupedByCategory = CATEGORIES.map((category) => ({
    ...category,
    items: items.filter((item) => item.category === category.key),
    total: items.filter((item) => item.category === category.key).reduce((sum, item) => sum + item.amount, 0),
  })).filter((group) => group.items.length > 0);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.surface }]}>
      <View style={[styles.backgroundGlow, { backgroundColor: theme.primarySoft }]} />

      <View style={styles.header}>
        <Pressable
          style={[styles.headerButton, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
          onPress={() => router.back()}
          hitSlop={6}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: theme.text }]}>Travel Budget</Text>

        {items.length > 0 || tripName || totalBudget ? (
          <Pressable
            style={[styles.headerButton, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
            onPress={handleClearAll}
            hitSlop={6}
          >
            <Ionicons name="trash-outline" size={20} color="#C0396A" />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Trip name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            placeholder="e.g. Tokyo Spring Escape"
            placeholderTextColor={theme.mutedText}
            value={tripName}
            onChangeText={setTripName}
          />

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: theme.mutedText }]}>Total budget</Text>
          <View style={styles.budgetInputRow}>
            <Text style={[styles.currency, { color: theme.primary }]}>PHP</Text>
            <TextInput
              style={[styles.input, styles.inputFlex, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="0.00"
              placeholderTextColor={theme.mutedText}
              keyboardType="numeric"
              value={totalBudget}
              onChangeText={setTotalBudget}
            />
          </View>
        </View>

        {budget > 0 ? (
          <View style={[styles.progressCard, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}>
            <View style={[styles.progressGlow, { backgroundColor: theme.heroAlt }]} />
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressSpent}>PHP {spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.progressSub}>spent of PHP {budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={[styles.remainBadge, remaining < 0 ? styles.remainBadgeOver : styles.remainBadgeSafe]}>
                <Text style={[styles.remainText, remaining < 0 ? styles.remainTextOver : styles.remainTextSafe]}>
                  {remaining >= 0
                    ? `PHP ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })} left`
                    : `Over by PHP ${Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: progress >= 1 ? '#E05353' : '#FFFFFF' },
                ]}
              />
            </View>
          </View>
        ) : null}

        {groupedByCategory.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Breakdown</Text>
            {groupedByCategory.map((group) => (
              <View key={group.key} style={[styles.groupCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIconWrap, { backgroundColor: theme.primarySoft }]}>
                    <Ionicons name={group.icon as any} size={18} color={theme.primary} />
                  </View>
                  <Text style={[styles.groupName, { color: theme.text }]}>{group.label}</Text>
                  <Text style={[styles.groupTotal, { color: theme.primary }]}>
                    PHP {group.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                </View>

                {group.items.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.itemRow, { borderTopColor: theme.border }]}
                    onLongPress={() => handleDeleteItem(item.id)}
                  >
                    <Text style={[styles.itemLabel, { color: theme.mutedText }]}>{item.label}</Text>
                    <View style={styles.itemRight}>
                      <Text style={[styles.itemAmount, { color: theme.text }]}>
                        PHP {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </Text>
                      <Pressable onPress={() => handleDeleteItem(item.id)} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color={theme.mutedText} />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={theme.mutedText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No expenses yet</Text>
            <Text style={[styles.emptyCopy, { color: theme.mutedText }]}>
              Tap the plus button to start planning your travel budget.
            </Text>
          </View>
        ) : null}

        {showAdd ? (
          <View style={[styles.addCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.addTitle, { color: theme.text }]}>Add expense</Text>

            <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((category) => {
                const active = selectedCat === category.key;

                return (
                  <Pressable
                    key={category.key}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: active ? theme.primary : theme.primarySoft,
                      },
                    ]}
                    onPress={() => setSelectedCat(category.key)}
                  >
                    <Ionicons name={category.icon as any} size={14} color={active ? '#FFFFFF' : theme.primary} />
                    <Text style={[styles.categoryChipText, { color: active ? '#FFFFFF' : theme.primary }]}>
                      {category.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: theme.mutedText }]}>Description</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Shinkansen ticket"
              placeholderTextColor={theme.mutedText}
              value={newLabel}
              onChangeText={setNewLabel}
            />

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: theme.mutedText }]}>Amount (PHP)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="0.00"
              placeholderTextColor={theme.mutedText}
              keyboardType="numeric"
              value={newAmount}
              onChangeText={setNewAmount}
            />

            <View style={styles.addActions}>
              <Pressable style={[styles.cancelButton, { backgroundColor: theme.primarySoft }]} onPress={() => setShowAdd(false)}>
                <Text style={[styles.cancelButtonText, { color: theme.primary }]}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.saveButton, { backgroundColor: theme.primary }]} onPress={handleAdd}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {!showAdd ? (
        <Pressable style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.shadow }]} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  backgroundGlow: {
    position: 'absolute',
    top: -90,
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
    paddingBottom: 100,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldLabelSpaced: {
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
  inputFlex: {
    flex: 1,
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  currency: {
    fontSize: 15,
    fontWeight: '800',
  },
  progressCard: {
    borderRadius: 26,
    padding: 20,
    marginTop: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 7,
  },
  progressGlow: {
    position: 'absolute',
    top: -40,
    right: -16,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.32,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  progressSpent: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  progressSub: {
    color: 'rgba(255,255,255,0.76)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  remainBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  remainBadgeSafe: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  remainBadgeOver: {
    backgroundColor: '#FFE7E7',
  },
  remainText: {
    fontSize: 11,
    fontWeight: '800',
  },
  remainTextSafe: {
    color: '#FFFFFF',
  },
  remainTextOver: {
    color: '#C0396A',
  },
  progressTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  groupCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 3,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  groupIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  groupTotal: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 44,
    borderTopWidth: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 50,
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
    maxWidth: 240,
    lineHeight: 19,
  },
  addCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginTop: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  categoryScroll: {
    marginBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 999,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 999,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 7,
  },
});
