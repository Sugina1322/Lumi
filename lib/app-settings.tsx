import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ThemeId } from './app-theme';

export type AppSettings = {
  notifications: boolean;
  location: boolean;
  reduceMotion: boolean;
  compactCards: boolean;
  homeFocus: 'overview' | 'commute' | 'budget';
  theme: ThemeId;
};

export const APP_SETTINGS_STORAGE_KEY = 'lumi_app_settings';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  notifications: true,
  location: true,
  reduceMotion: false,
  compactCards: false,
  homeFocus: 'overview',
  theme: 'lilac',
};

type AppSettingsContextValue = {
  settings: AppSettings;
  loaded: boolean;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  updateSettings: (patch: Partial<AppSettings>) => void;
};

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

async function loadStoredSettings(): Promise<AppSettings> {
  try {
    const raw = await SecureStore.getItemAsync(APP_SETTINGS_STORAGE_KEY);
    if (raw) {
      return {
        ...DEFAULT_APP_SETTINGS,
        ...(JSON.parse(raw) as Partial<AppSettings>),
      };
    }
  } catch {}
  return DEFAULT_APP_SETTINGS;
}

async function saveStoredSettings(settings: AppSettings): Promise<void> {
  await SecureStore.setItemAsync(APP_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadStoredSettings().then((nextSettings) => {
      setSettings(nextSettings);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveStoredSettings(settings).catch(() => {});
  }, [loaded, settings]);

  const value = useMemo(
    () => ({
      settings,
      loaded,
      setSettings,
      updateSettings: (patch: Partial<AppSettings>) => {
        setSettings((prev) => ({ ...prev, ...patch }));
      },
    }),
    [loaded, settings],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_APP_SETTINGS,
      loaded: true,
      setSettings: (() => {}) as React.Dispatch<React.SetStateAction<AppSettings>>,
      updateSettings: () => {},
    };
  }

  return context;
}
