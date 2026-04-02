import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../lib/app-theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { outline: IoniconName; filled: IoniconName }> = {
  index: { outline: 'compass-outline', filled: 'compass' },
  trips: { outline: 'map-outline', filled: 'map' },
  saved: { outline: 'bookmark-outline', filled: 'bookmark' },
};

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { theme } = useAppTheme();

  const isSmall = width < 375;
  const iconSize = isSmall ? 20 : 22;
  const labelSize = isSmall ? 10 : 11;
  const tabBarHeight = (isSmall ? 70 : 76) + insets.bottom;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        sceneStyle: { backgroundColor: theme.surface },
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedText,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 12,
          paddingBottom: insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 12 : 14,
          paddingHorizontal: isSmall ? 16 : 22,
          marginHorizontal: 14,
          marginBottom: 12,
          borderRadius: 26,
          backgroundColor: theme.card,
          borderWidth: 1,
          borderTopColor: theme.border,
          borderColor: theme.border,
          position: 'absolute',
          shadowColor: theme.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: theme.id === 'midnight' ? 0.32 : 0.1,
          shadowRadius: 22,
          elevation: 24,
        },
        tabBarLabelStyle: {
          fontSize: labelSize,
          fontWeight: '700',
          marginTop: 3,
          letterSpacing: 0.2,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;

          return (
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: focused ? theme.primarySoft : 'transparent',
                  borderColor: focused ? theme.border : 'transparent',
                },
              ]}
            >
              <Ionicons
                name={focused ? icons.filled : icons.outline}
                size={iconSize}
                color={color}
              />
            </View>
          );
        },
        tabBarLabel: ({ color, focused, children }) => (
          <Text
            style={[
              styles.label,
              {
                color,
                fontSize: labelSize,
                opacity: focused ? 1 : theme.id === 'midnight' ? 0.9 : 0.75,
              },
            ]}
          >
            {children}
          </Text>
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="trips" options={{ title: 'Trips' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    minWidth: 44,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  label: {
    fontWeight: '700',
  },
});
