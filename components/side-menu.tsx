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
import { useAppTheme } from '../lib/app-theme';

type Props = { visible: boolean; onClose: () => void };
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type MenuItem = { label: string; icon: IoniconName; onPress?: () => void };
type Section = { title: string; items: MenuItem[] };

export function SideMenu({ visible, onClose }: Props) {
  const { user, signOut } = useAuth();
  const { theme } = useAppTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const sheetWidth = Math.min(width * 0.84, 324);
  const sheetWidthRef = useRef(sheetWidth);
  sheetWidthRef.current = sheetWidth;

  const translateX = useRef(new Animated.Value(-sheetWidth)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const isGuest = !user?.email;
  const initials = user?.email?.[0]?.toUpperCase() ?? 'G';
  const firstName = isGuest ? 'Guest' : user?.email?.split('@')[0] ?? '';
  const emailLabel = isGuest ? 'Browsing as guest' : user?.email ?? '';

  useEffect(() => {
    if (!visible) return;

    translateX.setValue(-sheetWidthRef.current);
    backdropAnim.setValue(0);
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 180,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropAnim, translateX, visible]);

  function closeWithAnimation(callback?: () => void) {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -sheetWidthRef.current,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      callback?.();
    });
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) => dx < -10 && Math.abs(dx) > Math.abs(dy) * 1.5,
      onPanResponderMove: (_, { dx }) => {
        if (dx < 0) translateX.setValue(dx);
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        if (dx < -(sheetWidthRef.current * 0.3) || vx < -0.6) {
          closeWithAnimation();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            damping: 20,
          }).start();
        }
      },
    }),
  ).current;

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
        { label: 'Home', icon: 'compass-outline', onPress: () => navigate('/(tabs)') },
        { label: 'Trips', icon: 'map-outline', onPress: () => navigate('/(tabs)/trips') },
        { label: 'Saved places', icon: 'bookmark-outline', onPress: () => navigate('/(tabs)/saved') },
      ],
    },
    {
      title: 'Tools',
      items: [
        { label: 'Commute guide', icon: 'navigate-outline', onPress: () => navigate('/commute') },
        { label: 'Travel budget', icon: 'wallet-outline', onPress: () => navigate('/budget') },
        { label: 'Expenses', icon: 'receipt-outline', onPress: () => navigate('/expenses') },
      ],
    },
    {
      title: 'Account',
      items: [
        { label: 'Profile', icon: 'person-outline', onPress: () => navigate('/profile') },
        { label: 'Settings', icon: 'settings-outline', onPress: () => navigate('/settings') },
      ],
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => closeWithAnimation()}>
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => closeWithAnimation()} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              width: sheetWidth,
              transform: [{ translateX }],
              backgroundColor: theme.card,
              shadowColor: theme.shadow,
            },
          ]}
          {...panResponder.panHandlers}
        >
          <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: theme.hero }]}>
            <View style={[styles.headerGlowLarge, { backgroundColor: theme.heroAlt }]} />
            <View style={[styles.headerGlowSmall, { backgroundColor: theme.accent }]} />

            <View style={styles.headerTopRow}>
              <Text style={styles.appName}>lumi</Text>
              <Pressable style={styles.closeButton} onPress={() => closeWithAnimation()} hitSlop={10}>
                <Ionicons name="close" size={17} color="rgba(255,255,255,0.82)" />
              </Pressable>
            </View>

            <View style={styles.profileRow}>
              <View style={styles.avatarWrap}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.profileCopy}>
                <Text style={styles.userName} numberOfLines={1}>{firstName}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{emailLabel}</Text>
              </View>
            </View>

            <View style={styles.headerFooter}>
              <Text style={styles.headerFooterText}>Swipe left to close</Text>
              <View style={styles.swipeBar} />
            </View>
          </View>

          {isGuest ? (
            <Pressable
              style={[styles.banner, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}
              onPress={() => closeWithAnimation(() => router.replace('/login'))}
            >
              <View style={[styles.bannerIcon, { backgroundColor: theme.card }]}>
                <Ionicons name="sparkles" size={14} color={theme.primary} />
              </View>
              <Text style={[styles.bannerText, { color: theme.text }]}>Create an account to save your trips and places</Text>
              <Ionicons name="arrow-forward" size={14} color={theme.primary} />
            </Pressable>
          ) : null}

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
            showsVerticalScrollIndicator={false}
          >
            {sections.map((section, index) => (
              <View
                key={section.title}
                style={[
                  styles.section,
                  index > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    marginTop: 8,
                    paddingTop: 16,
                  },
                ]}
              >
                <Text style={[styles.sectionLabel, { color: theme.mutedText }]}>{section.title}</Text>
                {section.items.map((item) => (
                  <Pressable
                    key={item.label}
                    style={({ pressed }) => [
                      styles.item,
                      {
                        backgroundColor: pressed ? theme.surfaceAlt : 'transparent',
                      },
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={[styles.itemIcon, { backgroundColor: theme.primarySoft }]}>
                      <Ionicons name={item.icon} size={17} color={theme.primary} />
                    </View>
                    <Text style={[styles.itemLabel, { color: theme.text }]}>{item.label}</Text>
                    <Ionicons name="chevron-forward" size={14} color={theme.mutedText} />
                  </Pressable>
                ))}
              </View>
            ))}

            <View style={[styles.section, { borderTopWidth: 1, borderTopColor: theme.border, marginTop: 8, paddingTop: 16 }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.item,
                  {
                    backgroundColor: pressed ? '#FFF1F5' : 'transparent',
                  },
                ]}
                onPress={handleSignOut}
              >
                <View style={[styles.itemIcon, styles.itemIconDanger]}>
                  <Ionicons name="log-out-outline" size={17} color="#C0396A" />
                </View>
                <Text style={styles.itemLabelDanger}>Sign out</Text>
              </Pressable>
            </View>

            <Text style={[styles.version, { color: theme.mutedText }]}>Lumi · v1.0.0</Text>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    backgroundColor: 'rgba(16, 14, 24, 0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
    shadowOffset: { width: 12, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerGlowLarge: {
    position: 'absolute',
    top: -34,
    right: -24,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.34,
  },
  headerGlowSmall: {
    position: 'absolute',
    bottom: -24,
    left: -24,
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.22,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2.5,
    textTransform: 'lowercase',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },
  profileCopy: {
    flex: 1,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  userEmail: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '600',
  },
  headerFooter: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerFooterText: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '700',
  },
  swipeBar: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  banner: {
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  section: {
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconDanger: {
    backgroundColor: '#FFF0F4',
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  itemLabelDanger: {
    flex: 1,
    color: '#C0396A',
    fontSize: 14,
    fontWeight: '700',
  },
  version: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 18,
    letterSpacing: 0.4,
  },
});
