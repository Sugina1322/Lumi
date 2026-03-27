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
  { key: 'fare', label: 'Fare', icon: 'bus-outline' },
  { key: 'food', label: 'Food', icon: 'fast-food-outline' },
  { key: 'bills', label: 'Bills', icon: 'receipt-outline' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-outline' },
  { key: 'health', label: 'Health', icon: 'medkit-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
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
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ExpensesScreen() {
  const { theme } = useAppTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState('fare');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadExpenses().then((data) => {
      setExpenses(data);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (expenses.length === 0) {
      clearExpenses();
      return;
    }

    saveExpenses(expenses);
  }, [expenses, loaded]);

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const todayExpenses = expenses.filter((expense) => expense.date === getToday());
  const todayTotal = todayExpenses.reduce((sum, expense) => sum + expense.amount, 0);

  const categoryTotals = CATEGORIES.map((category) => ({
    ...category,
    total: expenses
      .filter((expense) => expense.category === category.key)
      .reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((category) => category.total > 0);

  const handleAdd = useCallback(() => {
    const amount = parseFloat(newAmount);
    if (!newLabel.trim() || Number.isNaN(amount) || amount <= 0) return;

    const category = CATEGORIES.find((item) => item.key === selectedCat)!;
    setExpenses((prev) => [
      {
        id: Date.now().toString(),
        label: newLabel.trim(),
        amount,
        date: getToday(),
        icon: category.icon,
        category: category.key,
      },
      ...prev,
    ]);
    setNewLabel('');
    setNewAmount('');
    setShowAdd(false);
  }, [newAmount, newLabel, selectedCat]);

  const handleDelete = (id: string) => {
    Alert.alert('Remove expense', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setExpenses((prev) => prev.filter((expense) => expense.id !== id)) },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert('Clear all expenses', 'This will remove all your logged expenses. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => {
          setExpenses([]);
        },
      },
    ]);
  };

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

        <Text style={[styles.headerTitle, { color: theme.text }]}>Expense Tracker</Text>

        {expenses.length > 0 ? (
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
        <View style={[styles.summaryCard, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}>
          <View style={[styles.summaryGlowTop, { backgroundColor: theme.heroAlt }]} />
          <View style={[styles.summaryGlowBottom, { backgroundColor: theme.accent }]} />

          <Text style={styles.summaryLabel}>Total expenses</Text>
          <Text style={styles.summaryAmount}>PHP {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>

          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryColumnLabel}>Today</Text>
              <Text style={styles.summaryColumnValue}>PHP {todayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.summaryColumnDivider} />
            <View style={styles.summaryColumn}>
              <Text style={styles.summaryColumnLabel}>Items</Text>
              <Text style={styles.summaryColumnValue}>{expenses.length}</Text>
            </View>
          </View>
        </View>

        {categoryTotals.length > 0 ? (
          <View style={styles.categoryTotalsRow}>
            {categoryTotals.map((category) => (
              <View
                key={category.key}
                style={[styles.categoryPill, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
              >
                <Ionicons name={category.icon as any} size={14} color={theme.primary} />
                <Text style={[styles.categoryPillText, { color: theme.mutedText }]}>{category.label}</Text>
                <Text style={[styles.categoryPillAmount, { color: theme.primary }]}>PHP {category.total.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {expenses.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent</Text>
            {expenses.map((expense) => (
              <Pressable
                key={expense.id}
                style={[styles.expenseRow, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}
                onLongPress={() => handleDelete(expense.id)}
              >
                <View style={[styles.expenseIcon, { backgroundColor: theme.primarySoft }]}>
                  <Ionicons name={expense.icon as any} size={18} color={theme.primary} />
                </View>
                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseLabel, { color: theme.text }]}>{expense.label}</Text>
                  <Text style={[styles.expenseDate, { color: theme.mutedText }]}>{expense.date}</Text>
                </View>
                <Text style={styles.expenseAmount}>- PHP {expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                <Pressable onPress={() => handleDelete(expense.id)} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={theme.mutedText} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={theme.mutedText} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No expenses yet</Text>
            <Text style={[styles.emptyCopy, { color: theme.mutedText }]}>Tap the plus button to log your first expense.</Text>
          </View>
        )}

        {showAdd ? (
          <View style={[styles.addCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
            <Text style={[styles.addTitle, { color: theme.text }]}>Log expense</Text>

            <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((category) => {
                const active = selectedCat === category.key;

                return (
                  <Pressable
                    key={category.key}
                    style={[styles.categoryChip, { backgroundColor: active ? theme.primary : theme.primarySoft }]}
                    onPress={() => setSelectedCat(category.key)}
                  >
                    <Ionicons name={category.icon as any} size={14} color={active ? '#FFFFFF' : theme.primary} />
                    <Text style={[styles.categoryChipText, { color: active ? '#FFFFFF' : theme.primary }]}>{category.label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: theme.mutedText }]}>What did you spend on?</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="e.g. Grab ride to Makati"
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
                <Text style={styles.saveButtonText}>Log it</Text>
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
    left: -40,
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
  summaryCard: {
    borderRadius: 26,
    padding: 22,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 7,
  },
  summaryGlowTop: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.38,
  },
  summaryGlowBottom: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.22,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryColumn: {
    flex: 1,
    alignItems: 'center',
  },
  summaryColumnLabel: {
    color: 'rgba(255,255,255,0.64)',
    fontSize: 11,
    fontWeight: '700',
  },
  summaryColumnValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  summaryColumnDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  categoryTotalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPillAmount: {
    fontSize: 12,
    fontWeight: '800',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 3,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  expenseDate: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  expenseAmount: {
    color: '#C0396A',
    fontSize: 14,
    fontWeight: '800',
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
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  fieldLabelSpaced: {
    marginTop: 14,
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
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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
