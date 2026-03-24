import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef } from 'react';
import { useAuth } from '../context/auth';

type Props = { visible: boolean; onClose: () => void };
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type MenuItem = { label: string; icon: IoniconName; onPress?: () => void; danger?: boolean };
type Section  = { title: string; items: MenuItem[] };

export function SideMenu({ visible, onClose }: Props) {
  const { user, signOut } = useAuth();
  const { width }  = useWindowDimensions();
  const insets     = useSafeAreaInsets();

  const sheetWidth    = Math.min(width * 0.82, 310);
  const sheetWidthRef = useRef(sheetWidth);
  sheetWidthRef.current = sheetWidth;

  const translateX     = useRef(new Animated.Value(-sheetWidth)).current;
  const backdropAnim   = useRef(new Animated.Value(0)).current;

  const isGuest    = !user?.email;
  const initials   = user?.email?.[0]?.toUpperCase() ?? 'G';
  const firstName  = isGuest ? 'Guest' : (user?.email?.split('@')[0] ?? '');
  const emailLabel = isGuest ? 'Browsing as guest' : (user?.email ?? '');

  /* ── Open animation ── */
  useEffect(() => {
    if (visible) {
      translateX.setValue(-sheetWidthRef.current);
      backdropAnim.setValue(0);
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 180 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  /* ── Close animation then call onClose ── */
  function closeWithAnimation(cb?: () => void) {
    Animated.parallel([
      Animated.timing(translateX, { toValue: -sheetWidthRef.current, duration: 230, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 230, useNativeDriver: true }),
    ]).start(() => { onClose(); cb?.(); });
  }

  /* ── Swipe-to-close gesture ── */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        dx < -10 && Math.abs(dx) > Math.abs(dy) * 1.5,
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) translateX.setValue(dx);
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        if (dx < -(sheetWidthRef.current * 0.3) || vx < -0.6) {
          closeWithAnimation();
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 20 }).start();
        }
      },
    })
  ).current;

  /* ── Sign out ── */
  async function handleSignOut() {
    closeWithAnimation(async () => {
      await signOut();
      router.replace('/login');
    });
  }

  function navigate(route: string) {
    closeWithAnimation(() => router.push(route as never));
  }

  const sections: Section[] = [
    {
      title: 'Travel',
      items: [
        { label: 'Home',         icon: 'home-outline',     onPress: () => navigate('/(tabs)') },
        { label: 'Trips',        icon: 'airplane-outline', onPress: () => navigate('/(tabs)/trips') },
        { label: 'Saved places', icon: 'heart-outline',    onPress: () => navigate('/(tabs)/saved') },
      ],
    },
    {
      title: 'Tools',
      items: [
        { label: 'Commute guide', icon: 'navigate-outline', onPress: () => navigate('/commute') },
        { label: 'Travel budget', icon: 'wallet-outline',   onPress: () => navigate('/budget') },
        { label: 'Expenses',      icon: 'receipt-outline',  onPress: () => navigate('/expenses') },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile',  icon: 'person-outline',   onPress: () => navigate('/profile') },
        { label: 'Settings', icon: 'settings-outline', onPress: () => navigate('/settings') },
      ],
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => closeWithAnimation()}>
      <View style={styles.root}>

        {/* ── Animated backdrop ── */}
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => closeWithAnimation()} />
        </Animated.View>

        {/* ── Drawer sheet ── */}
        <Animated.View
          style={[styles.sheet, { width: sheetWidth, transform: [{ translateX }] }]}
          {...panResponder.panHandlers}
        >
          {/* Purple header */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerOrbTR} />
            <View style={styles.headerOrbBL} />

            <View style={styles.headerTopRow}>
              <Text style={styles.appName}>lumi</Text>
              <Pressable style={styles.closeBtn} onPress={() => closeWithAnimation()} hitSlop={10}>
                <Ionicons name="close" size={17} color="rgba(255,255,255,0.75)" />
              </Pressable>
            </View>

            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.userName} numberOfLines={1}>{firstName}</Text>
            <Text style={styles.userEmail} numberOfLines={1}>{emailLabel}</Text>

            {/* Swipe hint */}
            <View style={styles.swipeHint}>
              <View style={styles.swipeBar} />
            </View>
          </View>

          {/* Guest upgrade banner */}
          {isGuest && (
            <Pressable style={styles.banner} onPress={() => closeWithAnimation(() => router.replace('/login'))}>
              <View style={styles.bannerIcon}>
                <Ionicons name="sparkles" size={14} color="#7055C8" />
              </View>
              <Text style={styles.bannerText}>Create an account to save your trips</Text>
              <Ionicons name="arrow-forward" size={13} color="#7055C8" />
            </Pressable>
          )}

          {/* Scrollable sections */}
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section, si) => (
              <View key={section.title} style={[styles.section, si > 0 && styles.sectionDivider]}>
                <Text style={styles.sectionLabel}>{section.title}</Text>
                {section.items.map((item) => (
                  <Pressable
                    key={item.label}
                    style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                    onPress={item.onPress}
                  >
                    <View style={styles.itemIcon}>
                      <Ionicons name={item.icon} size={17} color="#7055C8" />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={13} color="#D0C8EC" />
                  </Pressable>
                ))}
              </View>
            ))}

            {/* Sign out */}
            <View style={[styles.section, styles.sectionDivider]}>
              <Pressable
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                onPress={handleSignOut}
              >
                <View style={[styles.itemIcon, styles.itemIconDanger]}>
                  <Ionicons name="log-out-outline" size={17} color="#C0396A" />
                </View>
                <Text style={[styles.itemLabel, styles.itemLabelDanger]}>Sign out</Text>
              </Pressable>
            </View>

            <Text style={styles.version}>Lumi · v1.0.0</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1 },
  backdrop: { backgroundColor: 'rgba(18, 12, 38, 0.45)' },

  /* sheet */
  sheet: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    backgroundColor: '#FAFAFE',
    shadowColor: '#1E1640',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 24,
    overflow: 'hidden',
  },

  /* header */
  header: {
    backgroundColor: '#7055C8',
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerOrbTR: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#9078E0', opacity: 0.35,
  },
  headerOrbBL: {
    position: 'absolute', bottom: -20, left: -20,
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#5A44A8', opacity: 0.4,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2.5,
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  userName:   { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 3 },
  userEmail:  { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  swipeHint:  { alignItems: 'flex-end', marginTop: 14 },
  swipeBar: {
    width: 28, height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },

  /* banner */
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 14,
    marginTop: 12,
    backgroundColor: '#EDE8FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  bannerIcon: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  bannerText: { flex: 1, color: '#5B48A8', fontSize: 12, fontWeight: '700', lineHeight: 16 },

  /* sections */
  scroll:        { flex: 1 },
  scrollContent: { paddingTop: 14 },
  section:       { paddingHorizontal: 10, paddingBottom: 6 },
  sectionDivider:{ marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EEEAF8' },
  sectionLabel: {
    color: '#B0A8D0',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    paddingHorizontal: 8,
    marginBottom: 4,
  },

  /* items */
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 13,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  itemPressed:      { backgroundColor: '#F0ECFF' },
  itemIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: '#EDE8FF',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  itemIconDanger:   { backgroundColor: '#FFF0F4' },
  itemLabel:        { flex: 1, color: '#2F2257', fontSize: 14, fontWeight: '600' },
  itemLabelDanger:  { color: '#C0396A' },

  version: {
    textAlign: 'center',
    color: '#C4BCDC',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 20,
    letterSpacing: 0.5,
  },
});
