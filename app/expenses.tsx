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

interface Expense {
  id: string;
  label: string;
  amount: number;
  date: string;
  icon: string;
  category: string;
}

const STORAGE_KEY = 'lumi_expenses';

const CATEGORIES = [
  { key: 'fare',      label: 'Fare',        icon: 'bus-outline' },
  { key: 'food',      label: 'Food',        icon: 'fast-food-outline' },
  { key: 'bills',     label: 'Bills',       icon: 'receipt-outline' },
  { key: 'shopping',  label: 'Shopping',    icon: 'bag-outline' },
  { key: 'health',    label: 'Health',      icon: 'medkit-outline' },
  { key: 'other',     label: 'Other',       icon: 'ellipsis-horizontal-outline' },
];

async function saveExpenses(data: Expense[]) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(data));
}

async function loadExpenses(): Promise<Expense[]> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

async function clearExpenses() {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

function getToday() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState('fare');
  const [loaded, setLoaded] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    loadExpenses().then((data) => {
      setExpenses(data);
      setLoaded(true);
    });
  }, []);

  // Auto-save whenever expenses change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    if (expenses.length === 0) {
      clearExpenses();
      return;
    }

    saveExpenses(expenses);
  }, [expenses, loaded]);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  const todayExpenses = expenses.filter((e) => e.date === getToday());
  const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);

  const categoryTotals = CATEGORIES.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.category === cat.key).reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.total > 0);

  const handleAdd = useCallback(() => {
    const amount = parseFloat(newAmount);
    if (!newLabel.trim() || isNaN(amount) || amount <= 0) return;

    const cat = CATEGORIES.find((c) => c.key === selectedCat)!;
    setExpenses((prev) => [
      {
        id: Date.now().toString(),
        label: newLabel.trim(),
        amount,
        date: getToday(),
        icon: cat.icon,
        category: cat.key,
      },
      ...prev,
    ]);
    setNewLabel('');
    setNewAmount('');
    setShowAdd(false);
  }, [newLabel, newAmount, selectedCat]);

  const handleDelete = (id: string) => {
    Alert.alert('Remove expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setExpenses((prev) => prev.filter((e) => e.id !== id)) },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear all expenses',
      'This will remove all your logged expenses. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear all',
          style: 'destructive',
          onPress: () => {
            setExpenses([]);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={6}>
          <Ionicons name="arrow-back" size={22} color="#2F2257" />
        </Pressable>
        <Text style={styles.headerTitle}>Expense Tracker</Text>
        {expenses.length > 0 ? (
          <Pressable style={styles.deleteHeaderBtn} onPress={handleClearAll} hitSlop={6}>
            <Ionicons name="trash-outline" size={20} color="#E53935" />
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryOrbTR} />
          <View style={styles.summaryOrbBL} />
          <Text style={styles.summaryLabel}>Total expenses</Text>
          <Text style={styles.summaryAmount}>PHP {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Today</Text>
              <Text style={styles.summaryColValue}>PHP {todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.summaryColDivider} />
            <View style={styles.summaryCol}>
              <Text style={styles.summaryColLabel}>Items</Text>
              <Text style={styles.summaryColValue}>{expenses.length}</Text>
            </View>
          </View>
        </View>

        {/* Category chips */}
        {categoryTotals.length > 0 && (
          <View style={styles.catRow}>
            {categoryTotals.map((cat) => (
              <View key={cat.key} style={styles.catPill}>
                <Ionicons name={cat.icon as any} size={14} color="#7055C8" />
                <Text style={styles.catPillText}>{cat.label}</Text>
                <Text style={styles.catPillAmount}>PHP {cat.total.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Expense list */}
        {expenses.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent</Text>
            {expenses.map((exp) => (
              <Pressable key={exp.id} style={styles.expenseRow} onLongPress={() => handleDelete(exp.id)}>
                <View style={styles.expenseIcon}>
                  <Ionicons name={exp.icon as any} size={18} color="#7055C8" />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseLabel}>{exp.label}</Text>
                  <Text style={styles.expenseDate}>{exp.date}</Text>
                </View>
                <Text style={styles.expenseAmount}>- PHP {exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <Pressable onPress={() => handleDelete(exp.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color="#D1C4E9" />
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color="#C4B5E3" />
            <Text style={styles.emptyTitle}>No expenses yet</Text>
            <Text style={styles.emptySub}>Tap + to log your first expense</Text>
          </View>
        )}

        {/* Add form */}
        {showAdd && (
          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Log expense</Text>

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

            <Text style={[styles.addLabel, { marginTop: 14 }]}>What did you spend on?</Text>
            <TextInput
              style={styles.addInput}
              placeholder="e.g. Grab ride to Makati"
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
                <Text style={styles.saveBtnText}>Log it</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, paddingHorizontal: 20,
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

  summaryCard: {
    backgroundColor: '#7055C8', borderRadius: 24, padding: 22, overflow: 'hidden',
  },
  summaryOrbTR: {
    position: 'absolute', top: -20, right: -20, width: 100, height: 100,
    borderRadius: 50, backgroundColor: '#9078E0', opacity: 0.4,
  },
  summaryOrbBL: {
    position: 'absolute', bottom: -25, left: -15, width: 80, height: 80,
    borderRadius: 40, backgroundColor: '#5A44A8', opacity: 0.4,
  },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
  summaryAmount: { color: '#FFF', fontSize: 32, fontWeight: '900', marginTop: 4 },
  summaryDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 16 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryCol: { flex: 1, alignItems: 'center' },
  summaryColLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: '700' },
  summaryColValue: { color: '#FFF', fontSize: 16, fontWeight: '800', marginTop: 2 },
  summaryColDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#4C3D81', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  catPillText: { color: '#5A4E78', fontSize: 12, fontWeight: '700' },
  catPillAmount: { color: '#7055C8', fontSize: 12, fontWeight: '800' },

  section: { marginTop: 20 },
  sectionTitle: { color: '#1E1640', fontSize: 18, fontWeight: '800', marginBottom: 12 },

  expenseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF', borderRadius: 18, padding: 14, marginBottom: 8,
    shadowColor: '#4C3D81', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  expenseIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: '#EDE8FF',
    alignItems: 'center', justifyContent: 'center',
  },
  expenseInfo: { flex: 1 },
  expenseLabel: { color: '#2F2644', fontSize: 14, fontWeight: '700' },
  expenseDate: { color: '#7B6FA0', fontSize: 11, fontWeight: '600', marginTop: 2 },
  expenseAmount: { color: '#E53935', fontSize: 14, fontWeight: '800' },

  empty: { alignItems: 'center', marginTop: 50, gap: 8 },
  emptyTitle: { color: '#5A4E78', fontSize: 16, fontWeight: '800' },
  emptySub: { color: '#A89CC8', fontSize: 13, fontWeight: '600', textAlign: 'center' },

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
