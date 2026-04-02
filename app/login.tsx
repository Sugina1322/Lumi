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

type Mode = 'signin' | 'signup' | 'forgot';

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
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('signin');

  const isCompact = width < 375;
  const pad = isCompact ? 20 : 24;

  function switchMode(next: Mode) {
    setError(null);
    setInfo(null);
    setMode(next);
  }

  useEffect(() => {
    if (authLoading || !session) return;
    router.replace('/(tabs)');
  }, [authLoading, session]);

  async function handleSubmit() {
    if (mode === 'forgot') {
      if (!email) { setError('Enter your email.'); return; }
      setLoading(true);
      setError(null);
      const result = await resetPassword(email);
      setLoading(false);
      if (result.error) setError(result.error);
      else setInfo('Reset link sent — check your email.');
      return;
    }

    if (!email || !password) { setError('Fill in all fields.'); return; }
    setLoading(true);
    setError(null);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
    else if (mode === 'signup') { setInfo('Check your email to confirm.'); setMode('signin'); }
    else setInfo('Signing you in…');
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const result = await signInWithGoogle();
    setLoading(false);
    if (result.error) setError(result.error);
    else setInfo('Finishing Google sign-in…');
  }

  async function handleGuest() {
    setLoading(true);
    setError(null);
    const result = await signInAsGuest();
    setLoading(false);
    if (result.error) setError(result.error);
    else setInfo('Signing you in…');
  }

  const titleText = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password';
  const ctaText = mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* background blobs */}
      <View style={[styles.blob1, { backgroundColor: theme.hero }]} />
      <View style={[styles.blob2, { backgroundColor: theme.heroAlt }]} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 28, paddingHorizontal: pad },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo block */}
        <View style={styles.logoBlock}>
          <LumiLogo size={isCompact ? 'md' : 'lg'} variant="light" />
          <Text style={styles.logoTagline}>travel planning, simplified</Text>
        </View>

        {/* Auth card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>{titleText}</Text>

          {/* Google */}
          {mode !== 'forgot' && (
            <Pressable
              style={({ pressed }) => [
                styles.googleBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
                loading && styles.disabled,
                pressed && styles.pressed,
              ]}
              onPress={handleGoogle}
              disabled={loading}
              accessibilityLabel="Continue with Google"
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={theme.primary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color={theme.text} />
                  <Text style={[styles.googleBtnText, { color: theme.text }]}>Continue with Google</Text>
                </>
              )}
            </Pressable>
          )}

          {/* Divider */}
          {mode !== 'forgot' && (
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.dividerText, { color: theme.mutedText }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            </View>
          )}

          {/* Feedback */}
          {(error || info) && (
            <View style={[styles.feedback, { backgroundColor: error ? '#FFF0F4' : '#F0FFF4', borderColor: error ? '#F2D9E4' : '#C6F6D5' }]}>
              <Ionicons
                name={error ? 'alert-circle' : 'checkmark-circle'}
                size={16}
                color={error ? '#C0396A' : '#2F8F68'}
              />
              <Text style={[styles.feedbackText, { color: error ? '#C0396A' : '#2F8F68' }]}>
                {error ?? info}
              </Text>
            </View>
          )}

          {/* Fields */}
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                placeholder="you@example.com"
                placeholderTextColor={theme.mutedText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>

            {mode !== 'forgot' && (
              <View style={styles.field}>
                <View style={styles.labelRow}>
                  <Text style={[styles.label, { color: theme.text }]}>Password</Text>
                  {mode === 'signin' && (
                    <Pressable onPress={() => switchMode('forgot')} accessibilityRole="button">
                      <Text style={[styles.inlineLink, { color: theme.primary }]}>Forgot?</Text>
                    </Pressable>
                  )}
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                  placeholder="Your password"
                  placeholderTextColor={theme.mutedText}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
              </View>
            )}
          </View>

          {/* Primary CTA */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              { backgroundColor: theme.primary },
              loading && styles.disabled,
              pressed && styles.pressed,
            ]}
            onPress={handleSubmit}
            disabled={loading}
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>{ctaText}</Text>
            )}
          </Pressable>

          {/* Guest */}
          {mode !== 'forgot' && (
            <Pressable
              style={({ pressed }) => [
                styles.ghostBtn,
                { borderColor: theme.border },
                pressed && styles.pressed,
              ]}
              onPress={handleGuest}
              disabled={loading}
              accessibilityLabel="Continue as guest"
              accessibilityRole="button"
            >
              <Text style={[styles.ghostBtnText, { color: theme.mutedText }]}>Continue as guest</Text>
            </Pressable>
          )}

          {/* Switch mode */}
          <Pressable
            style={({ pressed }) => [styles.switchLink, pressed && styles.pressed]}
            onPress={() => switchMode(mode === 'forgot' ? 'signin' : mode === 'signin' ? 'signup' : 'signin')}
            accessibilityRole="button"
          >
            <Text style={[styles.switchText, { color: theme.primary }]}>
              {mode === 'signin' && "Don't have an account? Sign up"}
              {mode === 'signup' && 'Already have an account? Sign in'}
              {mode === 'forgot' && 'Back to sign in'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  blob1: {
    position: 'absolute',
    top: -60,
    left: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.85,
  },
  blob2: {
    position: 'absolute',
    top: 60,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.4,
  },

  scroll: { flexGrow: 1 },

  logoBlock: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  logoTagline: {
    marginTop: 14,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 18,
  },

  googleBtn: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 18,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: '600' },

  feedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  feedbackText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },

  fields: { gap: 16 },
  field: { gap: 8 },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  inlineLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
  },

  primaryBtn: {
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  ghostBtn: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ghostBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  switchLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '700',
  },

  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
});
