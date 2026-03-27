import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type ThemeId = 'lilac' | 'sage' | 'pearl' | 'midnight';

export type ThemePalette = {
  id: ThemeId;
  label: string;
  description: string;
  surface: string;
  surfaceAlt: string;
  card: string;
  text: string;
  mutedText: string;
  primary: string;
  primarySoft: string;
  accent: string;
  border: string;
  shadow: string;
  hero: string;
  heroAlt: string;
};

export const THEME_STORAGE_KEY = 'lumi_theme';

export const THEME_OPTIONS: ThemePalette[] = [
  {
    id: 'lilac',
    label: 'Lilac',
    description: 'Dusky orchid with a boutique city-guide feel.',
    surface: '#F6F2FA',
    surfaceAlt: '#EEE6F5',
    card: '#FFFFFF',
    text: '#241A31',
    mutedText: '#70627D',
    primary: '#7A5FA0',
    primarySoft: '#EEE4FA',
    accent: '#AA7BCF',
    border: '#E5D8F0',
    shadow: '#433152',
    hero: '#6B4D95',
    heroAlt: '#AF8AD7',
  },
  {
    id: 'sage',
    label: 'Sage',
    description: 'Fresh green with a calm, map-first look.',
    surface: '#F2F7F3',
    surfaceAlt: '#E5F0E8',
    card: '#FFFFFF',
    text: '#173126',
    mutedText: '#617467',
    primary: '#2F7A5E',
    primarySoft: '#DDEEE6',
    accent: '#57A784',
    border: '#D3E3DA',
    shadow: '#1B3B31',
    hero: '#1F6B55',
    heroAlt: '#5DAA86',
  },
  {
    id: 'pearl',
    label: 'Pearl',
    description: 'Warm stone and sand with a polished editorial finish.',
    surface: '#F8F4EE',
    surfaceAlt: '#EFE5D7',
    card: '#FFFFFF',
    text: '#2F271E',
    mutedText: '#75685A',
    primary: '#B57945',
    primarySoft: '#F4E5D5',
    accent: '#D59C64',
    border: '#E8DBCC',
    shadow: '#5E4632',
    hero: '#9F6635',
    heroAlt: '#D8A068',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Ink blue with brighter contrast and sharper depth.',
    surface: '#101722',
    surfaceAlt: '#182130',
    card: '#182130',
    text: '#F4F6FA',
    mutedText: '#A8B3C6',
    primary: '#6FA3FF',
    primarySoft: '#22304A',
    accent: '#93BDFF',
    border: '#29364A',
    shadow: '#000000',
    hero: '#274266',
    heroAlt: '#416AA3',
  },
];

export const DEFAULT_THEME: ThemeId = 'pearl';

type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemePalette;
  loaded: boolean;
  setThemeId: (themeId: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

async function loadThemeId() {
  try {
    const raw = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
    if (raw && THEME_OPTIONS.some((option) => option.id === raw)) {
      return raw as ThemeId;
    }
  } catch {}
  return DEFAULT_THEME;
}

async function saveThemeId(themeId: ThemeId) {
  await SecureStore.setItemAsync(THEME_STORAGE_KEY, themeId);
}

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadThemeId().then((next) => {
      setThemeIdState(next);
      setLoaded(true);
    });
  }, []);

  const setThemeId = (nextThemeId: ThemeId) => {
    setThemeIdState(nextThemeId);
    saveThemeId(nextThemeId).catch(() => {});
  };

  const theme = useMemo(
    () => THEME_OPTIONS.find((option) => option.id === themeId) ?? THEME_OPTIONS[0],
    [themeId],
  );

  return (
    <ThemeContext.Provider value={{ themeId, theme, loaded, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeId: DEFAULT_THEME as ThemeId,
      theme: THEME_OPTIONS[0],
      loaded: true,
      setThemeId: (_themeId: ThemeId) => {},
    };
  }
  return context;
}
