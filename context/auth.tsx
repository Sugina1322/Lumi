import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { ExecutionEnvironment } from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signInAsGuest: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function getGoogleRedirectUri() {
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

  return makeRedirectUri({
    scheme: 'lumi',
    path: 'auth/callback',
    ...(isExpoGo ? {} : { native: 'lumi://auth/callback' }),
    preferLocalhost: true,
  });
}

type OAuthSessionResult =
  | { code: string }
  | { accessToken: string; refreshToken: string };

function getTokensFromUrl(url: string): OAuthSessionResult {
  const [baseUrl, hash] = url.split('#');
  const parsed = new URL(hash ? `${baseUrl}?${hash}` : url);
  const code = parsed.searchParams.get('code');
  const accessToken = parsed.searchParams.get('access_token');
  const refreshToken = parsed.searchParams.get('refresh_token');
  const errorCode = parsed.searchParams.get('error_code') ?? parsed.searchParams.get('error');
  const errorDescription = parsed.searchParams.get('error_description');

  if (errorCode) {
    throw new Error(errorDescription ?? errorCode);
  }

  if (code) {
    return { code };
  }

  if (!accessToken || !refreshToken) {
    throw new Error('Authentication did not return a valid session.');
  }

  return { accessToken, refreshToken };
}

async function waitForSession(timeoutMs = 8000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  return null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await waitForSession(3000);
    }
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signInWithGoogle() {
    const redirectTo = getGoogleRedirectUri();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: Platform.OS !== 'web',
      },
    });

    if (error) {
      return { error: error.message };
    }

    if (!data.url) {
      return { error: 'Google sign-in is not available right now.' };
    }

    if (Platform.OS === 'web') {
      return { error: null };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { error: 'Google sign-in was cancelled.' };
    }

    if (result.type !== 'success' || !result.url) {
      return { error: 'Google sign-in did not complete correctly.' };
    }

    let sessionResult: OAuthSessionResult;

    try {
      sessionResult = getTokensFromUrl(result.url);
    } catch (parseError) {
      return { error: parseError instanceof Error ? parseError.message : 'Could not read the Google callback.' };
    }

    const { error: exchangeError } =
      'code' in sessionResult
        ? await supabase.auth.exchangeCodeForSession(sessionResult.code)
        : await supabase.auth.setSession({
            access_token: sessionResult.accessToken,
            refresh_token: sessionResult.refreshToken,
          });

    if (exchangeError) {
      return { error: exchangeError.message };
    }

    const session = await waitForSession();
    if (!session) {
      return { error: 'Google sign-in finished, but the session was not ready yet.' };
    }

    return { error: null };
  }

  async function signInAsGuest() {
    const { error } = await supabase.auth.signInAnonymously();
    if (!error) {
      await waitForSession(3000);
    }
    return { error: error?.message ?? null };
  }

  async function resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getGoogleRedirectUri(),
    });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signIn, signUp, signInWithGoogle, signInAsGuest, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
