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
    description: 'Soft purple with a polished travel feel.',
    surface: '#F7F4FF',
    surfaceAlt: '#F1ECFF',
    card: '#FFFFFF',
    text: '#1E1640',
    mutedText: '#655C7C',
    primary: '#7055C8',
    primarySoft: '#EDE8FF',
    accent: '#8A6DE9',
    border: '#E4DCFB',
    shadow: '#4C3D81',
    hero: '#7055C8',
    heroAlt: '#9078E0',
  },
  {
    id: 'sage',
    label: 'Sage',
    description: 'Calm green with a clean utility-first look.',
    surface: '#F4FAF4',
    surfaceAlt: '#EAF6EA',
    card: '#FFFFFF',
    text: '#17301B',
    mutedText: '#5B7360',
    primary: '#3E8D5B',
    primarySoft: '#E2F3E6',
    accent: '#67A77C',
    border: '#D8E8DB',
    shadow: '#24402D',
    hero: '#3E8D5B',
    heroAlt: '#6CB887',
  },
  {
    id: 'pearl',
    label: 'Pearl',
    description: 'Neutral and minimal with a warm, airy finish.',
    surface: '#FBFAF7',
    surfaceAlt: '#F5F1EA',
    card: '#FFFFFF',
    text: '#25211D',
    mutedText: '#6D645A',
    primary: '#C08A4A',
    primarySoft: '#F5EADF',
    accent: '#D0A56C',
    border: '#ECE5D8',
    shadow: '#5B4B39',
    hero: '#C08A4A',
    heroAlt: '#E0B57B',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Darker slate with stronger contrast and depth.',
    surface: '#141824',
    surfaceAlt: '#1C2230',
    card: '#1B2130',
    text: '#F5F7FB',
    mutedText: '#B0B9CC',
    primary: '#7C91FF',
    primarySoft: '#222B40',
    accent: '#93A5FF',
    border: '#2B3446',
    shadow: '#000000',
    hero: '#3D4A7E',
    heroAlt: '#5E6FB8',
  },
];

export const DEFAULT_THEME: ThemeId = 'lilac';

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
