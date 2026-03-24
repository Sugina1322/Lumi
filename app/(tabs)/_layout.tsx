import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { outline: IoniconName; filled: IoniconName }> = {
  index:   { outline: 'home-outline',      filled: 'home'      },
  trips:   { outline: 'airplane-outline',  filled: 'airplane'  },
  saved:   { outline: 'heart-outline',     filled: 'heart'     },
};

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const insets    = useSafeAreaInsets();

  const isSmall   = width < 375;
  const iconSize  = isSmall ? 21 : 23;
  const labelSize = isSmall ? 10 : 11;

  // Base tab area + system safe area so the bar is never cut off or too tall
  const tabBarHeight = (isSmall ? 54 : 60) + insets.bottom;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#7055C8',
        tabBarInactiveTintColor: '#A89CC8',
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 8,
          // Reserve exactly the safe-area gap at the bottom, no more
          paddingBottom: insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 8 : 10),
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#EDE8FF',
          shadowColor: '#4C3D81',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.07,
          shadowRadius: 10,
          elevation: 20,
        },
        tabBarLabelStyle: {
          fontSize: labelSize,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons = TAB_ICONS[route.name];
          if (!icons) return null;
          return (
            <Ionicons
              name={focused ? icons.filled : icons.outline}
              size={iconSize}
              color={color}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index"   options={{ title: 'Home'    }} />
      <Tabs.Screen name="trips"   options={{ title: 'Trips'   }} />
      <Tabs.Screen name="saved"   options={{ title: 'Saved'   }} />
    </Tabs>
  );
}
