import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LumiLogo } from '../components/lumi-logo';
import { useAuth } from '../context/auth';
import { useAppTheme } from '../lib/app-theme';

export default function LoginScreen() {
  const {
    session,
    loading: authLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInAsGuest,
    resetPassword,
  } = useAuth();
  const { theme } = useAppTheme();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');

  const heroHeight = height * 0.37;
  const isNarrow = width < 375;
  const horizontalPadding = isNarrow ? 18 : 24;

  function switchMode(nextMode: 'signin' | 'signup' | 'forgot') {
    setError(null);
    setInfo(null);
    setMode(nextMode);
  }

  useEffect(() => {
    if (authLoading || !session) return;
    router.replace('/(tabs)');
  }, [authLoading, session]);

  async function handleSubmit() {
    if (mode === 'forgot') {
      if (!email) {
        setError('Please enter your email.');
        return;
      }

      setLoading(true);
      setError(null);
      const result = await resetPassword(email);
      setLoading(false);

      if (result.error) setError(result.error);
      else setInfo('Check your email for a password reset link.');
      return;
    }

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (mode === 'signup') {
      setInfo('Check your email to confirm your account, then sign in.');
      setMode('signin');
    } else {
      setInfo('Signing you in...');
    }
  }

  async function handleGuest() {
    setLoading(true);
    setError(null);
    const result = await signInAsGuest();
    setLoading(false);

    if (result.error) setError(result.error);
    else setInfo('Signing you in...');
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const result = await signInWithGoogle();
    setLoading(false);

    if (result.error) setError(result.error);
    else setInfo('Finishing Google sign-in...');
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.hero }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.hero, { height: heroHeight, paddingTop: insets.top + 10 }]}>
        <View style={[styles.heroGlowLarge, { backgroundColor: theme.heroAlt }]} />
        <View style={[styles.heroGlowSmall, { backgroundColor: theme.accent }]} />

        <View style={styles.heroInner}>
          <LumiLogo size={isNarrow ? 'md' : 'lg'} variant="light" />
          <Text style={styles.heroEyebrow}>your city companion</Text>
          <Text style={styles.heroTitle}>Travel planning that feels calm before you even open the map.</Text>
        </View>
      </View>

      <ScrollView
        style={[styles.sheet, { backgroundColor: theme.surface }]}
        contentContainerStyle={[
          styles.sheetContent,
          { paddingHorizontal: horizontalPadding, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.formTitle, { color: theme.text }]}>
              {mode === 'signin' && 'Welcome back'}
              {mode === 'signup' && 'Create account'}
              {mode === 'forgot' && 'Reset password'}
            </Text>
            <Text style={[styles.formSubtitle, { color: theme.mutedText }]}>
              {mode === 'signin' && 'Sign in to access your saved places, trips, and commute history.'}
              {mode === 'signup' && 'Start shaping your next move with one account.'}
              {mode === 'forgot' && "We'll send a reset link to your email."}
            </Text>
          </View>

          <View style={[styles.modeTabs, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
            {[
              ['signin', 'Sign in'],
              ['signup', 'Create'],
              ['forgot', 'Reset'],
            ].map(([value, label]) => {
              const active = mode === value;

              return (
                <Pressable
                  key={value}
                  style={[
                    styles.modeTab,
                    active && { backgroundColor: theme.card, shadowColor: theme.shadow },
                  ]}
                  onPress={() => switchMode(value as 'signin' | 'signup' | 'forgot')}
                >
                  <Text style={[styles.modeTabText, { color: active ? theme.text : theme.mutedText }]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {error ? (
            <View style={styles.messageRow}>
              <Ionicons name="alert-circle" size={16} color="#C0396A" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {info ? (
            <View style={styles.messageRow}>
              <Ionicons name="checkmark-circle" size={16} color="#2F8F68" />
              <Text style={styles.infoText}>{info}</Text>
            </View>
          ) : null}

          {mode !== 'forgot' && (
            <>
              <Pressable
                style={[
                  styles.googleButton,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                  loading && styles.disabled,
                ]}
                onPress={handleGoogle}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color={theme.text} />
                    <Text style={[styles.googleButtonText, { color: theme.text }]}>Continue with Google</Text>
                  </>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={[styles.dividerText, { color: theme.mutedText }]}>or use email</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>
            </>
          )}

          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={theme.mutedText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {mode !== 'forgot' && (
              <View style={styles.field}>
                <View style={styles.fieldLabelRow}>
                  <Text style={[styles.fieldLabel, { color: theme.text }]}>Password</Text>
                  {mode === 'signin' ? (
                    <Pressable onPress={() => switchMode('forgot')} hitSlop={8}>
                      <Text style={[styles.inlineLink, { color: theme.primary }]}>Forgot?</Text>
                    </Pressable>
                  ) : null}
                </View>

                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Your password"
                  placeholderTextColor={theme.mutedText}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            )}
          </View>

          <Pressable
            style={[
              styles.primaryButton,
              { backgroundColor: theme.primary, shadowColor: theme.shadow },
              loading && styles.disabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'signin' && 'Sign in'}
                {mode === 'signup' && 'Create account'}
                {mode === 'forgot' && 'Send reset link'}
              </Text>
            )}
          </Pressable>

          {mode === 'forgot' ? (
            <Pressable style={styles.textAction} onPress={() => switchMode('signin')}>
              <Text style={[styles.textActionText, { color: theme.primary }]}>Back to sign in</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.textAction} onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}>
              <Text style={[styles.textActionText, { color: theme.primary }]}>
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          )}

          {mode !== 'forgot' ? (
            <Pressable
              style={[
                styles.guestButton,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
              onPress={handleGuest}
              disabled={loading}
            >
              <Text style={[styles.guestButtonText, { color: theme.mutedText }]}>Continue as guest</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  hero: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroGlowLarge: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 210,
    height: 210,
    borderRadius: 105,
    opacity: 0.36,
  },
  heroGlowSmall: {
    position: 'absolute',
    bottom: 12,
    left: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.2,
  },
  heroInner: {
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  heroEyebrow: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.74)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    maxWidth: 330,
  },
  sheet: {
    flex: 1,
    marginTop: -28,
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
  },
  sheetContent: {
    paddingTop: 28,
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    padding: 20,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.08,
    shadowRadius: 26,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
  },
  formSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  modeTabs: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    padding: 5,
    gap: 6,
  },
  modeTab: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    alignItems: 'flex-start',
  },
  errorText: {
    flex: 1,
    color: '#C0396A',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  infoText: {
    flex: 1,
    color: '#2F8F68',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  googleButton: {
    marginTop: 16,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  googleButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldGroup: {
    marginTop: 18,
    gap: 14,
  },
  field: {
    gap: 8,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  inlineLink: {
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  textAction: {
    marginTop: 14,
    alignItems: 'center',
  },
  textActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
  guestButton: {
    marginTop: 12,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 13,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.7,
  },
});
