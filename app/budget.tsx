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
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useAppTheme } from '../lib/app-theme';
import { useAuth } from '../context/auth';

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

type BudgetView = 'planner' | 'analytics';
type GuideTone = 'good' | 'watch' | 'alert';

const STORAGE_KEY = 'lumi_travel_budget';

const CATEGORIES = [
  { key: 'transport', label: 'Transport', icon: 'bus-outline', color: '#4D8CFF' },
  { key: 'food', label: 'Food & Drinks', icon: 'restaurant-outline', color: '#E2884A' },
  { key: 'accommodation', label: 'Accommodation', icon: 'bed-outline', color: '#7A5FA0' },
  { key: 'activities', label: 'Activities', icon: 'ticket-outline', color: '#2F9D76' },
  { key: 'shopping', label: 'Shopping', icon: 'bag-outline', color: '#D45D79' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#7D8A99' },
];

const CATEGORY_TARGETS: Record<string, number> = {
  accommodation: 35,
  transport: 20,
  food: 20,
  activities: 15,
  shopping: 5,
  other: 5,
};

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
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [tripName, setTripName] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState('transport');
  const [loaded, setLoaded] = useState(false);
  const [activeView, setActiveView] = useState<BudgetView>('planner');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [showGuide, setShowGuide] = useState(false);
  const isGuest = !user?.email;

  const promptGuestUpgrade = useCallback(() => {
    Alert.alert(
      'Login required',
      'Guests can view budget insights, but creating or editing budgets requires an account.',
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
    if (isGuest) {
      promptGuestUpgrade();
      return;
    }
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
  }, [isGuest, newAmount, newLabel, promptGuestUpgrade, selectedCat]);

  const handleDeleteItem = (id: string) => {
    if (isGuest) {
      promptGuestUpgrade();
      return;
    }
    Alert.alert('Remove item', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setItems((prev) => prev.filter((item) => item.id !== id)) },
    ]);
  };

  const handleClearAll = () => {
    if (isGuest) {
      promptGuestUpgrade();
      return;
    }
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

  const isNarrow = width < 390;
  const contentPadding = Math.max(100, insets.bottom + 88);
  const topCategory = groupedByCategory.reduce<(typeof groupedByCategory)[number] | null>(
    (largest, group) => (!largest || group.total > largest.total ? group : largest),
    null
  );
  const averageExpense = items.length > 0 ? spent / items.length : 0;
  const sortedGroups = [...groupedByCategory].sort((a, b) => b.total - a.total);
  const maxCategoryTotal = sortedGroups[0]?.total ?? 0;
  const budgetSplit = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const remainingSplit = Math.max(100 - budgetSplit, 0);
  const previewCount = 3;
  const topCategoryShare = spent > 0 && topCategory ? Math.round((topCategory.total / spent) * 100) : 0;
  const guideTone: GuideTone =
    budget > 0 && progress >= 1 ? 'alert' : budget > 0 && progress >= 0.8 ? 'watch' : 'good';
  const guideTitle =
    guideTone === 'alert'
      ? 'You are over budget'
      : guideTone === 'watch'
        ? 'You are entering your caution zone'
        : 'Your budget is in a healthy range';
  const guideCopy =
    guideTone === 'alert'
      ? 'Pause non-essential spending, trim shopping or optional activities, and protect transport and lodging first.'
      : guideTone === 'watch'
        ? 'You still have room, but it is a good time to tighten food, shopping, and optional activity spending.'
        : 'Keep some money reserved for transport changes, surprise fees, and your last travel day.';
  const guideTips = [
    budget <= 0
      ? 'Set a full trip budget first so Lumi can guide category limits and overspending risk.'
      : `Try to keep about PHP ${Math.max(budget - spent, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} protected for the rest of the trip.`,
    topCategory
      ? `${topCategory.label} is your biggest spend so far at ${topCategoryShare}% of total expenses.`
      : 'Track a few expenses first to unlock category-based guidance.',
    items.length > 0
      ? `Your average expense is PHP ${averageExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}, which can help you pace the next few purchases.`
      : 'Add your first few expenses so the guide can learn your spending pace.',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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

      {isGuest ? (
        <View style={[styles.guestNotice, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="lock-closed-outline" size={16} color={theme.primary} />
          <Text style={[styles.guestNoticeText, { color: theme.mutedText }]}>
            Guests can browse Budget, but login is required to create or edit travel budgets.
          </Text>
        </View>
      ) : null}

      <View style={styles.viewToggleWrap}>
        <View style={[styles.viewToggle, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
          {(['planner', 'analytics'] as const).map((view) => {
            const active = activeView === view;
            return (
              <Pressable
                key={view}
                style={[styles.viewToggleButton, active && { backgroundColor: theme.primary }]}
                onPress={() => setActiveView(view)}
              >
                <Ionicons
                  name={view === 'planner' ? 'wallet-outline' : 'bar-chart-outline'}
                  size={16}
                  color={active ? '#FFFFFF' : theme.mutedText}
                />
                <Text style={[styles.viewToggleText, { color: active ? '#FFFFFF' : theme.mutedText }]}>
                  {view === 'planner' ? 'Planner' : 'Analytics'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        key={activeView}
        contentContainerStyle={[styles.content, { paddingBottom: contentPadding }, isNarrow && styles.contentNarrow]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {activeView === 'planner' ? (
          <View key="planner" style={styles.viewContent}>
            <View style={[styles.card, isNarrow && styles.cardNarrow, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}> 
              <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Trip name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="e.g. Tokyo Spring Escape"
                placeholderTextColor={theme.mutedText}
                value={tripName}
                onChangeText={setTripName}
                editable={!isGuest}
                onFocus={isGuest ? promptGuestUpgrade : undefined}
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
                  editable={!isGuest}
                  onFocus={isGuest ? promptGuestUpgrade : undefined}
                />
              </View>
            </View>

            {budget > 0 ? (
              <View style={[styles.progressCard, isNarrow && styles.progressCardNarrow, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}> 
                <View style={[styles.progressGlow, { backgroundColor: theme.heroAlt }]} />
                <View style={[styles.progressHeader, isNarrow && styles.progressHeaderNarrow]}>
                  <View>
                    <Text style={[styles.progressSpent, isNarrow && styles.progressSpentNarrow]}>
                      PHP {spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
                    <Text style={styles.progressSub}>
                      spent of PHP {budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </Text>
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

            <View style={[styles.guideCard, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}>
              <View style={styles.sectionHeaderCompact}>
                <View>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Travel money guide</Text>
                  <Text style={[styles.guideSubcopy, { color: theme.mutedText }]}>Helpful pacing for the rest of your trip</Text>
                </View>
                <View style={styles.guideHeaderActions}>
                  <View
                    style={[
                      styles.guideBadge,
                      guideTone === 'good'
                        ? styles.guideBadgeGood
                        : guideTone === 'watch'
                          ? styles.guideBadgeWatch
                          : styles.guideBadgeAlert,
                    ]}
                  >
                    <Text
                      style={[
                        styles.guideBadgeText,
                        guideTone === 'good'
                          ? styles.guideBadgeTextGood
                          : guideTone === 'watch'
                            ? styles.guideBadgeTextWatch
                            : styles.guideBadgeTextAlert,
                      ]}
                    >
                      {guideTone === 'good' ? 'On track' : guideTone === 'watch' ? 'Watch spending' : 'Over budget'}
                    </Text>
                  </View>
                  <Pressable style={[styles.guideToggleButton, { backgroundColor: theme.primarySoft }]} onPress={() => setShowGuide((prev) => !prev)}>
                    <Text style={[styles.guideToggleText, { color: theme.primary }]}>
                      {showGuide ? 'Hide' : 'Show'}
                    </Text>
                    <Ionicons name={showGuide ? 'chevron-up' : 'chevron-down'} size={16} color={theme.primary} />
                  </Pressable>
                </View>
              </View>

              {showGuide ? (
                <>
                  <Text style={[styles.guideTitle, { color: theme.text }]}>{guideTitle}</Text>
                  <Text style={[styles.guideCopy, { color: theme.mutedText }]}>{guideCopy}</Text>

                  <View style={styles.guideTips}>
                    {guideTips.map((tip) => (
                      <View key={tip} style={styles.guideTipRow}>
                        <Ionicons name="sparkles-outline" size={15} color={theme.primary} />
                        <Text style={[styles.guideTipText, { color: theme.text }]}>{tip}</Text>
                      </View>
                    ))}
                  </View>

                  {budget > 0 ? (
                    <View style={styles.allocationList}>
                      {CATEGORIES.map((category) => {
                        const currentTotal = groupedByCategory.find((group) => group.key === category.key)?.total ?? 0;
                        const currentShare = spent > 0 ? (currentTotal / spent) * 100 : 0;
                        const targetShare = CATEGORY_TARGETS[category.key] ?? 0;
                        const targetAmount = budget * (targetShare / 100);

                        return (
                          <View key={category.key} style={styles.allocationRow}>
                            <View style={styles.allocationRowHeader}>
                              <View style={styles.analyticsLabelWrap}>
                                <View style={[styles.analyticsDot, { backgroundColor: category.color }]} />
                                <Text style={[styles.analyticsLabel, { color: theme.text }]}>{category.label}</Text>
                              </View>
                              <Text style={[styles.allocationValue, { color: theme.mutedText }]}>
                                Target {targetShare}% | PHP {targetAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </Text>
                            </View>
                            <View style={[styles.analyticsBarTrack, { backgroundColor: theme.primarySoft }]}>
                              <View
                                style={[
                                  styles.analyticsBarFill,
                                  { width: `${Math.min(targetShare, 100)}%`, backgroundColor: category.color, opacity: 0.28 },
                                ]}
                              />
                              <View
                                style={[
                                  styles.allocationCurrentMarker,
                                  { left: `${Math.min(currentShare, 100)}%`, borderColor: category.color },
                                ]}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={[styles.guideCollapsedCopy, { color: theme.mutedText }]}>
                  Open this to get spending advice, category targets, and travel budget warnings.
                </Text>
              )}
            </View>

            {groupedByCategory.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Breakdown</Text>
                {groupedByCategory.map((group) => (
                  <View key={group.key} style={[styles.groupCard, isNarrow && styles.groupCardNarrow, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}> 
                    <View style={[styles.groupHeader, isNarrow && styles.groupHeaderNarrow]}>
                      <View style={[styles.groupIconWrap, { backgroundColor: theme.primarySoft }]}>
                        <Ionicons name={group.icon as any} size={18} color={theme.primary} />
                      </View>
                      <Text style={[styles.groupName, { color: theme.text }]}>{group.label}</Text>
                      <Text style={[styles.groupTotal, { color: theme.primary }]}>PHP {group.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                    </View>

                    {(expandedGroups[group.key] ? group.items : group.items.slice(0, previewCount)).map((item) => (
                      <Pressable
                        key={item.id}
                        style={[styles.itemRow, isNarrow && styles.itemRowNarrow, { borderTopColor: theme.border }]}
                        onLongPress={() => handleDeleteItem(item.id)}
                      >
                        <Text style={[styles.itemLabel, { color: theme.mutedText }]}>{item.label}</Text>
                        <View style={styles.itemRight}>
                          <Text style={[styles.itemAmount, { color: theme.text }]}>PHP {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                          <Pressable onPress={() => handleDeleteItem(item.id)} hitSlop={8}>
                            <Ionicons name="close-circle" size={18} color={theme.mutedText} />
                          </Pressable>
                        </View>
                      </Pressable>
                    ))}

                    {group.items.length > previewCount ? (
                      <Pressable
                        style={[styles.groupExpandButton, { borderTopColor: theme.border }]}
                        onPress={() =>
                          setExpandedGroups((prev) => ({
                            ...prev,
                            [group.key]: !prev[group.key],
                          }))
                        }
                      >
                        <Text style={[styles.groupExpandText, { color: theme.primary }]}>
                          {expandedGroups[group.key]
                            ? 'Show less'
                            : `Show ${group.items.length - previewCount} more`}
                        </Text>
                        <Ionicons
                          name={expandedGroups[group.key] ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={theme.primary}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : null}

            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={48} color={theme.mutedText} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No expenses yet</Text>
                <Text style={[styles.emptyCopy, { color: theme.mutedText }]}>Tap the plus button to start planning your travel budget.</Text>
              </View>
            ) : null}

            {showAdd ? (
              <View style={[styles.addCard, isNarrow && styles.cardNarrow, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}> 
                <Text style={[styles.addTitle, { color: theme.text }]}>Add expense</Text>

                <Text style={[styles.fieldLabel, { color: theme.mutedText }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {CATEGORIES.map((category) => {
                    const active = selectedCat === category.key;
                    return (
                      <Pressable
                        key={category.key}
                        style={[styles.categoryChip, { backgroundColor: active ? theme.primary : theme.primarySoft }]}
                        onPress={() => (isGuest ? promptGuestUpgrade() : setSelectedCat(category.key))}
                      >
                        <Ionicons name={category.icon as any} size={14} color={active ? '#FFFFFF' : theme.primary} />
                        <Text style={[styles.categoryChipText, { color: active ? '#FFFFFF' : theme.primary }]}>{category.label}</Text>
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
                  editable={!isGuest}
                  onFocus={isGuest ? promptGuestUpgrade : undefined}
                />

                <Text style={[styles.fieldLabel, styles.fieldLabelSpaced, { color: theme.mutedText }]}>Amount (PHP)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="0.00"
                  placeholderTextColor={theme.mutedText}
                  keyboardType="numeric"
                  value={newAmount}
                  onChangeText={setNewAmount}
                  editable={!isGuest}
                  onFocus={isGuest ? promptGuestUpgrade : undefined}
                />

                <View style={[styles.addActions, isNarrow && styles.addActionsNarrow]}>
                  <Pressable style={[styles.cancelButton, { backgroundColor: theme.primarySoft }]} onPress={() => setShowAdd(false)}>
                    <Text style={[styles.cancelButtonText, { color: theme.primary }]}>Cancel</Text>
                  </Pressable>
                  <Pressable style={[styles.saveButton, { backgroundColor: theme.primary, opacity: isGuest ? 0.7 : 1 }]} onPress={handleAdd}>
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.saveButtonText}>Add</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        ) : (
          <View key="analytics" style={styles.viewContent}>
            <View style={[styles.analyticsHero, { backgroundColor: theme.hero, shadowColor: theme.shadow }]}> 
              <View style={[styles.progressGlow, { backgroundColor: theme.heroAlt }]} />
              <Text style={styles.analyticsHeroEyebrow}>Analytics page</Text>
              <Text style={styles.analyticsHeroTitle}>
                {tripName.trim().length > 0 ? tripName : 'Travel budget insights'}
              </Text>
              <Text style={styles.analyticsHeroCopy}>
                Your spending charts update automatically as you add or remove budget items.
              </Text>

              <View style={[styles.analyticsHighlights, isNarrow && styles.analyticsHighlightsNarrow]}>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsCardLabel}>Top category</Text>
                  <Text style={styles.analyticsCardValue}>{topCategory?.label ?? 'None yet'}</Text>
                  <Text style={styles.analyticsCardMeta}>
                    {topCategory
                      ? `PHP ${topCategory.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      : 'Add an expense to unlock charts'}
                  </Text>
                </View>

                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsCardLabel}>Average expense</Text>
                  <Text style={styles.analyticsCardValue}>
                    PHP {averageExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </Text>
                  <Text style={styles.analyticsCardMeta}>
                    {items.length} {items.length === 1 ? 'entry' : 'entries'}
                  </Text>
                </View>
              </View>
            </View>

            {budget > 0 ? (
              <View style={[styles.analyticsPanel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}> 
                <Text style={[styles.analyticsPanelTitle, { color: theme.text }]}>Budget usage</Text>
                <Text style={[styles.analyticsPanelSub, { color: theme.mutedText }]}>Spent versus remaining budget</Text>
                <View style={[styles.budgetChartTrack, { backgroundColor: theme.primarySoft }]}>
                  <View style={[styles.budgetChartSpent, { width: `${budgetSplit}%` }]} />
                  {remainingSplit > 0 ? <View style={[styles.budgetChartRemaining, { width: `${remainingSplit}%` }]} /> : null}
                </View>
                <View style={styles.budgetChartLabels}>
                  <Text style={[styles.budgetChartLabel, { color: theme.text }]}>Spent: PHP {spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                  <Text style={[styles.budgetChartLabel, { color: theme.mutedText }]}>Remaining: {remaining >= 0 ? 'PHP ' : '-PHP '}{Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                </View>
              </View>
            ) : null}

            <View style={[styles.analyticsPanel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}> 
              <Text style={[styles.analyticsPanelTitle, { color: theme.text }]}>Category chart</Text>
              <Text style={[styles.analyticsPanelSub, { color: theme.mutedText }]}>Bigger columns mean bigger spending share</Text>
              {sortedGroups.length > 0 ? (
                <View style={styles.columnsWrap}>
                  {sortedGroups.map((group) => {
                    const height = maxCategoryTotal > 0 ? Math.max((group.total / maxCategoryTotal) * 140, 18) : 18;
                    const share = spent > 0 ? Math.round((group.total / spent) * 100) : 0;
                    return (
                      <View key={group.key} style={styles.columnItem}>
                        <Text style={[styles.columnValue, { color: theme.text }]}>{share}%</Text>
                        <View style={[styles.columnTrack, { backgroundColor: theme.primarySoft }]}>
                          <View style={[styles.columnFill, { height, backgroundColor: group.color }]} />
                        </View>
                        <Text style={[styles.columnLabel, { color: theme.mutedText }]} numberOfLines={2}>{group.label}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.analyticsEmpty}>
                  <Ionicons name="bar-chart-outline" size={38} color={theme.mutedText} />
                  <Text style={[styles.analyticsEmptyTitle, { color: theme.text }]}>No chart data yet</Text>
                  <Text style={[styles.analyticsEmptyCopy, { color: theme.mutedText }]}>Switch to Planner and add a few expenses to populate the charts.</Text>
                </View>
              )}
            </View>

            <View style={[styles.analyticsPanel, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}> 
              <Text style={[styles.analyticsPanelTitle, { color: theme.text }]}>Spending distribution</Text>
              <Text style={[styles.analyticsPanelSub, { color: theme.mutedText }]}>Category share across your trip budget</Text>
              <View style={styles.analyticsList}>
                {sortedGroups.length > 0 ? (
                  sortedGroups.map((group) => {
                    const share = spent > 0 ? group.total / spent : 0;
                    return (
                      <View key={group.key} style={styles.analyticsRow}>
                        <View style={styles.analyticsRowHeader}>
                          <View style={styles.analyticsLabelWrap}>
                            <View style={[styles.analyticsDot, { backgroundColor: group.color }]} />
                            <Text style={[styles.analyticsLabel, { color: theme.text }]}>{group.label}</Text>
                          </View>
                          <Text style={[styles.analyticsValue, { color: theme.mutedText }]}>{Math.round(share * 100)}% | PHP {group.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                        </View>
                        <View style={[styles.analyticsBarTrack, { backgroundColor: theme.primarySoft }]}>
                          <View style={[styles.analyticsBarFill, { width: `${Math.max(share * 100, 6)}%`, backgroundColor: group.color }]} />
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.analyticsEmptyInline}>
                    <Text style={[styles.analyticsEmptyCopy, { color: theme.mutedText }]}>No expense breakdown yet.</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {!showAdd && activeView === 'planner' ? (
        <Pressable
          style={[styles.fab, { backgroundColor: theme.primary, shadowColor: theme.shadow, bottom: insets.bottom + 16 }]}
          onPress={() => (isGuest ? promptGuestUpgrade() : setShowAdd(true))}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  backgroundGlow: { position: 'absolute', top: -90, right: -30, width: 220, height: 220, borderRadius: 110, opacity: 0.8 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 20 },
  headerButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 4 },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSpacer: { width: 40 },
  guestNotice: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 16,
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
  viewToggleWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  viewToggle: { flexDirection: 'row', borderRadius: 18, borderWidth: 1, padding: 4, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 18, elevation: 3 },
  viewToggleButton: { flex: 1, borderRadius: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  viewToggleText: { fontSize: 13, fontWeight: '800' },
  viewContent: { gap: 0 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  contentNarrow: { paddingHorizontal: 16 },
  card: { borderRadius: 24, borderWidth: 1, padding: 18, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 4 },
  cardNarrow: { padding: 16, borderRadius: 20 },
  fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  fieldLabelSpaced: { marginTop: 14 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontWeight: '700' },
  inputFlex: { flex: 1 },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  currency: { fontSize: 15, fontWeight: '800' },
  progressCard: { borderRadius: 26, padding: 20, marginTop: 14, overflow: 'hidden', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 7 },
  progressCardNarrow: { padding: 16, borderRadius: 22 },
  progressGlow: { position: 'absolute', top: -40, right: -16, width: 160, height: 160, borderRadius: 80, opacity: 0.32 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  progressHeaderNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  progressSpent: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  progressSpentNarrow: { fontSize: 19 },
  progressSub: { color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  remainBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  remainBadgeSafe: { backgroundColor: 'rgba(255,255,255,0.18)' },
  remainBadgeOver: { backgroundColor: '#FFE7E7' },
  remainText: { fontSize: 11, fontWeight: '800' },
  remainTextSafe: { color: '#FFFFFF' },
  remainTextOver: { color: '#C0396A' },
  progressTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  guideCard: { marginTop: 18, borderRadius: 24, borderWidth: 1, padding: 18, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 4 },
  sectionHeaderCompact: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  guideSubcopy: { marginTop: 4, fontSize: 12, fontWeight: '600' },
  guideHeaderActions: { alignItems: 'flex-end', gap: 8 },
  guideBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  guideBadgeGood: { backgroundColor: '#E7F7EF' },
  guideBadgeWatch: { backgroundColor: '#FFF2DE' },
  guideBadgeAlert: { backgroundColor: '#FFE7E7' },
  guideBadgeText: { fontSize: 11, fontWeight: '800' },
  guideBadgeTextGood: { color: '#167A52' },
  guideBadgeTextWatch: { color: '#B86A00' },
  guideBadgeTextAlert: { color: '#C0396A' },
  guideToggleButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  guideToggleText: { fontSize: 12, fontWeight: '800' },
  guideTitle: { marginTop: 16, fontSize: 18, fontWeight: '900' },
  guideCopy: { marginTop: 8, fontSize: 14, lineHeight: 20, fontWeight: '600' },
  guideCollapsedCopy: { marginTop: 14, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  guideTips: { marginTop: 16, gap: 10 },
  guideTipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  guideTipText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  allocationList: { marginTop: 18, gap: 12 },
  allocationRow: { gap: 8 },
  allocationRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  allocationValue: { fontSize: 11, fontWeight: '700' },
  allocationCurrentMarker: { position: 'absolute', top: -2, marginLeft: -6, width: 12, height: 14, borderRadius: 6, borderWidth: 2, backgroundColor: '#FFFFFF' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  groupCard: { borderRadius: 20, borderWidth: 1, padding: 14, marginBottom: 10, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 18, elevation: 3 },
  groupCardNarrow: { padding: 12, borderRadius: 18 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  groupHeaderNarrow: { flexWrap: 'wrap' },
  groupIconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupName: { flex: 1, fontSize: 14, fontWeight: '800' },
  groupTotal: { fontSize: 14, fontWeight: '800' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, paddingLeft: 44, borderTopWidth: 1 },
  itemRowNarrow: { paddingLeft: 0, alignItems: 'flex-start', flexDirection: 'column', gap: 8 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemLabel: { fontSize: 13, fontWeight: '600', flex: 1 },
  itemAmount: { fontSize: 13, fontWeight: '700' },
  groupExpandButton: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupExpandText: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyState: { alignItems: 'center', marginTop: 50, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '800' },
  emptyCopy: { fontSize: 13, fontWeight: '600', textAlign: 'center', maxWidth: 240, lineHeight: 19 },
  addCard: { borderRadius: 24, borderWidth: 1, padding: 18, marginTop: 20, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18, elevation: 4 },
  addTitle: { fontSize: 16, fontWeight: '800', marginBottom: 14 },
  categoryScroll: { marginBottom: 4 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  categoryChipText: { fontSize: 12, fontWeight: '700' },
  addActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  addActionsNarrow: { flexDirection: 'column' },
  cancelButton: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 999 },
  cancelButtonText: { fontSize: 14, fontWeight: '800' },
  saveButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderRadius: 999 },
  saveButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  analyticsHero: { borderRadius: 28, padding: 20, overflow: 'hidden', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 7 },
  analyticsHeroEyebrow: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  analyticsHeroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 6 },
  analyticsHeroCopy: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', marginTop: 8, lineHeight: 19 },
  analyticsHighlights: { flexDirection: 'row', gap: 12, marginTop: 18 },
  analyticsHighlightsNarrow: { flexDirection: 'column' },
  analyticsCard: { flex: 1, borderRadius: 18, padding: 14, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  analyticsCardLabel: { color: 'rgba(255,255,255,0.68)', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  analyticsCardValue: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 8 },
  analyticsCardMeta: { color: 'rgba(255,255,255,0.72)', fontSize: 12, fontWeight: '600', marginTop: 4 },
  analyticsPanel: { marginTop: 16, borderRadius: 24, borderWidth: 1, padding: 18, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 4 },
  analyticsPanelTitle: { fontSize: 17, fontWeight: '900' },
  analyticsPanelSub: { fontSize: 13, fontWeight: '600', marginTop: 4, marginBottom: 14 },
  budgetChartTrack: { height: 18, borderRadius: 999, overflow: 'hidden', flexDirection: 'row' },
  budgetChartSpent: { backgroundColor: '#E2884A', height: '100%' },
  budgetChartRemaining: { backgroundColor: '#2F9D76', height: '100%' },
  budgetChartLabels: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12, flexWrap: 'wrap' },
  budgetChartLabel: { fontSize: 12, fontWeight: '700' },
  columnsWrap: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10, minHeight: 190, paddingTop: 8 },
  columnItem: { flex: 1, alignItems: 'center', gap: 8 },
  columnValue: { fontSize: 12, fontWeight: '800' },
  columnTrack: { width: '100%', maxWidth: 42, height: 150, borderRadius: 16, justifyContent: 'flex-end', padding: 6 },
  columnFill: { width: '100%', borderRadius: 10, minHeight: 12 },
  columnLabel: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  analyticsList: { gap: 12 },
  analyticsRow: { gap: 8 },
  analyticsRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  analyticsLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  analyticsDot: { width: 10, height: 10, borderRadius: 999 },
  analyticsLabel: { fontSize: 13, fontWeight: '700' },
  analyticsValue: { fontSize: 12, fontWeight: '800' },
  analyticsBarTrack: { width: '100%', height: 10, borderRadius: 999, overflow: 'hidden' },
  analyticsBarFill: { height: '100%', borderRadius: 999 },
  analyticsEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: 8 },
  analyticsEmptyInline: { paddingVertical: 6 },
  analyticsEmptyTitle: { fontSize: 16, fontWeight: '800' },
  analyticsEmptyCopy: { fontSize: 13, fontWeight: '600', textAlign: 'center', lineHeight: 19 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.18, shadowRadius: 18, elevation: 7 },
});
