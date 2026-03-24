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
  { key: 'transport',      label: 'Transport',      icon: 'bus-outline' },
  { key: 'food',           label: 'Food & Drinks',  icon: 'restaurant-outline' },
  { key: 'accommodation',  label: 'Accommodation',  icon: 'bed-outline' },
  { key: 'activities',     label: 'Activities',      icon: 'ticket-outline' },
  { key: 'shopping',       label: 'Shopping',        icon: 'bag-outline' },
  { key: 'other',          label: 'Other',           icon: 'ellipsis-horizontal-outline' },
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
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [tripName, setTripName] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState('transport');
  const [loaded, setLoaded] = useState(false);

  // Load saved data on mount
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

  // Auto-save whenever data changes (after initial load)
  useEffect(() => {
    if (!loaded) return;
    const hasContent = tripName.trim().length > 0 || totalBudget.trim().length > 0 || items.length > 0;

    if (!hasContent) {
      clearBudget();
      return;
    }

    saveBudget({ tripName, totalBudget, items });
  }, [tripName, totalBudget, items, loaded]);

  const spent = items.reduce((sum, i) => sum + i.amount, 0);
  const budget = parseFloat(totalBudget) || 0;
  const remaining = budget - spent;
  const progress = budget > 0 ? Math.min(spent / budget, 1) : 0;

  const handleAdd = useCallback(() => {
    const amount = parseFloat(newAmount);
    if (!newLabel.trim() || isNaN(amount) || amount <= 0) return;

    const cat = CATEGORIES.find((c) => c.key === selectedCat)!;
    setItems((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        category: cat.key,
        label: newLabel.trim(),
        amount,
        icon: cat.icon,
      },
    ]);
    setNewLabel('');
    setNewAmount('');
    setShowAdd(false);
  }, [newLabel, newAmount, selectedCat]);

  const handleDeleteItem = (id: string) => {
    Alert.alert('Remove item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems((prev) => prev.filter((i) => i.id !== id)) },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Delete budget',
      'This will remove all your budget data. Are you sure?',
      [
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
      ],
    );
  };

  const groupedByCategory = CATEGORIES.map((cat) => ({
    ...cat,
    items: items.filter((i) => i.category === cat.key),
    total: items.filter((i) => i.category === cat.key).reduce((s, i) => s + i.amount, 0),
  })).filter((g) => g.items.length > 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={6}>
          <Ionicons name="arrow-back" size={22} color="#2F2257" />
        </Pressable>
        <Text style={styles.headerTitle}>Travel Budget</Text>
        {(items.length > 0 || tripName || totalBudget) ? (
          <Pressable style={styles.deleteHeaderBtn} onPress={handleClearAll} hitSlop={6}>
            <Ionicons name="trash-outline" size={20} color="#E53935" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Trip info */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Trip name</Text>
          <TextInput
            style={styles.cardInput}
            placeholder="e.g. Tokyo Spring Escape"
            placeholderTextColor="#A89CC8"
            value={tripName}
            onChangeText={setTripName}
          />
          <Text style={[styles.cardLabel, { marginTop: 14 }]}>Total budget</Text>
          <View style={styles.budgetInputRow}>
            <Text style={styles.currency}>PHP</Text>
            <TextInput
              style={[styles.cardInput, { flex: 1 }]}
              placeholder="0.00"
              placeholderTextColor="#A89CC8"
              keyboardType="numeric"
              value={totalBudget}
              onChangeText={setTotalBudget}
            />
          </View>
        </View>

        {/* Progress card */}
        {budget > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressSpent}>PHP {spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <Text style={styles.progressSub}>spent of PHP {budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={[styles.remainBadge, remaining < 0 && styles.remainBadgeOver]}>
                <Text style={[styles.remainText, remaining < 0 && styles.remainTextOver]}>
                  {remaining >= 0 ? `PHP ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2 })} left` : `Over by PHP ${Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%` },
                  progress >= 1 && styles.progressFillOver,
                ]}
              />
            </View>
          </View>
        )}

        {/* Breakdown */}
        {groupedByCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Breakdown</Text>
            {groupedByCategory.map((group) => (
              <View key={group.key} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupIconWrap}>
                    <Ionicons name={group.icon as any} size={18} color="#7055C8" />
                  </View>
                  <Text style={styles.groupName}>{group.label}</Text>
                  <Text style={styles.groupTotal}>PHP {group.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                </View>
                {group.items.map((item) => (
                  <Pressable key={item.id} style={styles.itemRow} onLongPress={() => handleDeleteItem(item.id)}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <View style={styles.itemRight}>
                      <Text style={styles.itemAmount}>PHP {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                      <Pressable onPress={() => handleDeleteItem(item.id)} hitSlop={8}>
                        <Ionicons name="close-circle" size={18} color="#D1C4E9" />
                      </Pressable>
                    </View>
                  </Pressable>
                ))}
              </View>
            ))}
          </View>
        )}

        {items.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={48} color="#C4B5E3" />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySub}>Tap the + button to start planning your travel budget</Text>
          </View>
        )}

        {/* Add expense form */}
        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Add expense</Text>

            <Text style={styles.addLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.key}
                  style={[styles.catChip, selectedCat === cat.key && styles.catChipActive]}
                  onPress={() => setSelectedCat(cat.key)}
                >
                  <Ionicons name={cat.icon as any} size={14} color={selectedCat === cat.key ? '#FFF' : '#7055C8'} />
                  <Text style={[styles.catChipText, selectedCat === cat.key && styles.catChipTextActive]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={[styles.addLabel, { marginTop: 14 }]}>Description</Text>
            <TextInput
              style={styles.addInput}
              placeholder="e.g. Shinkansen ticket"
              placeholderTextColor="#A89CC8"
              value={newLabel}
              onChangeText={setNewLabel}
            />

            <Text style={[styles.addLabel, { marginTop: 14 }]}>Amount (PHP)</Text>
            <TextInput
              style={styles.addInput}
              placeholder="0.00"
              placeholderTextColor="#A89CC8"
              keyboardType="numeric"
              value={newAmount}
              onChangeText={setNewAmount}
            />

            <View style={styles.addActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleAdd}>
                <Ionicons name="checkmark" size={16} color="#FFF" />
                <Text style={styles.saveBtnText}>Add</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      {!showAdd && (
        <Pressable style={styles.fab} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={28} color="#FFF" />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F0FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4C3D81', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  deleteHeaderBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4C3D81', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  headerTitle: { color: '#1E1640', fontSize: 17, fontWeight: '800' },

  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },

  card: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 18,
    shadowColor: '#4C3D81', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardLabel: { color: '#7B6FA0', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  cardInput: {
    backgroundColor: '#F5F0FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#2F2644', fontWeight: '700',
  },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currency: { color: '#7055C8', fontSize: 15, fontWeight: '800' },

  progressCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginTop: 14,
    shadowColor: '#4C3D81', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  progressSpent: { color: '#1E1640', fontSize: 20, fontWeight: '900' },
  progressSub: { color: '#7B6FA0', fontSize: 12, fontWeight: '600', marginTop: 2 },
  remainBadge: { backgroundColor: '#E8F5E9', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  remainBadgeOver: { backgroundColor: '#FFEBEE' },
  remainText: { color: '#2E7D32', fontSize: 11, fontWeight: '800' },
  remainTextOver: { color: '#C62828' },
  progressTrack: { height: 8, backgroundColor: '#EDE8FF', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#7055C8', borderRadius: 4 },
  progressFillOver: { backgroundColor: '#E53935' },

  section: { marginTop: 20 },
  sectionTitle: { color: '#1E1640', fontSize: 18, fontWeight: '800', marginBottom: 12 },

  groupCard: {
    backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 10,
    shadowColor: '#4C3D81', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  groupIconWrap: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#EDE8FF',
    alignItems: 'center', justifyContent: 'center',
  },
  groupName: { flex: 1, color: '#2F2644', fontSize: 14, fontWeight: '800' },
  groupTotal: { color: '#7055C8', fontSize: 14, fontWeight: '800' },

  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, paddingLeft: 44, borderTopWidth: 1, borderTopColor: '#F5F0FF',
  },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemLabel: { color: '#5A4E78', fontSize: 13, fontWeight: '600', flex: 1 },
  itemAmount: { color: '#2F2644', fontSize: 13, fontWeight: '700' },

  empty: { alignItems: 'center', marginTop: 50, gap: 8 },
  emptyTitle: { color: '#5A4E78', fontSize: 16, fontWeight: '800' },
  emptySub: { color: '#A89CC8', fontSize: 13, fontWeight: '600', textAlign: 'center', maxWidth: 240 },

  addCard: {
    backgroundColor: '#FFF', borderRadius: 22, padding: 18, marginTop: 20,
    shadowColor: '#4C3D81', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3,
  },
  addTitle: { color: '#1E1640', fontSize: 16, fontWeight: '800', marginBottom: 14 },
  addLabel: { color: '#7B6FA0', fontSize: 12, fontWeight: '700', marginBottom: 6 },
  catScroll: { marginBottom: 4 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EDE8FF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8,
  },
  catChipActive: { backgroundColor: '#7055C8' },
  catChipText: { color: '#7055C8', fontSize: 12, fontWeight: '700' },
  catChipTextActive: { color: '#FFF' },
  addInput: {
    backgroundColor: '#F5F0FF', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#2F2644', fontWeight: '700',
  },
  addActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: 999, backgroundColor: '#EDE8FF',
  },
  cancelBtnText: { color: '#7055C8', fontSize: 14, fontWeight: '800' },
  saveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 999, backgroundColor: '#7055C8',
  },
  saveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 58, height: 58, borderRadius: 29, backgroundColor: '#7055C8',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7055C8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
});
