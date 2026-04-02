/**
 * User commute preferences persistence.
 *
 * Stores learned route weights in Supabase (user_preferences table)
 * with a local fallback using SecureStore for offline/guest users.
 */

import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';
import { DEFAULT_WEIGHTS, UserWeights } from './route-algorithm';

const LOCAL_KEY = 'lumi_commute_weights';
const TRAVEL_MODE_KEY = 'lumi_travel_mode';

export type TravelModePreference = 'balanced' | 'fast' | 'calm';
export const DEFAULT_TRAVEL_MODE: TravelModePreference = 'balanced';

// ── Local storage (fallback / offline) ──

async function loadLocal(): Promise<UserWeights> {
  try {
    const raw = await SecureStore.getItemAsync(LOCAL_KEY);
    if (raw) return JSON.parse(raw) as UserWeights;
  } catch {}
  return { ...DEFAULT_WEIGHTS };
}

async function saveLocal(weights: UserWeights): Promise<void> {
  await SecureStore.setItemAsync(LOCAL_KEY, JSON.stringify(weights));
}

async function clearLocal(): Promise<void> {
  await SecureStore.deleteItemAsync(LOCAL_KEY);
}

// ── Supabase storage ──

async function loadRemote(userId: string): Promise<UserWeights | null> {
  try {
    const { data } = await supabase
      .from('user_preferences')
      .select('commute_weights')
      .eq('user_id', userId)
      .single();
    if (data?.commute_weights) return data.commute_weights as UserWeights;
  } catch {}
  return null;
}

async function saveRemote(userId: string, weights: UserWeights): Promise<void> {
  try {
    await supabase.from('user_preferences').upsert(
      { user_id: userId, commute_weights: weights, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );
  } catch {}
}

// ── Public API ──

export async function loadWeights(userId?: string | null): Promise<UserWeights> {
  if (userId) {
    const remote = await loadRemote(userId);
    if (remote) {
      await saveLocal(remote);
      return remote;
    }
  }
  return loadLocal();
}

export async function saveWeights(weights: UserWeights, userId?: string | null): Promise<void> {
  await saveLocal(weights);
  if (userId) {
    await saveRemote(userId, weights);
  }
}

export async function clearWeights(userId?: string | null): Promise<void> {
  await clearLocal();
  if (userId) {
    await saveRemote(userId, { ...DEFAULT_WEIGHTS });
  }
}

export async function loadTravelMode(): Promise<TravelModePreference> {
  try {
    const raw = await SecureStore.getItemAsync(TRAVEL_MODE_KEY);
    if (raw === 'balanced' || raw === 'fast' || raw === 'calm') {
      return raw;
    }
  } catch {}
  return DEFAULT_TRAVEL_MODE;
}

export async function saveTravelMode(mode: TravelModePreference): Promise<void> {
  await SecureStore.setItemAsync(TRAVEL_MODE_KEY, mode);
}
