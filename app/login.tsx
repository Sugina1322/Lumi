import { router } from 'expo-router';
import { useState } from 'react';
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
  const { signIn, signUp, signInWithGoogle, signInAsGuest, resetPassword } = useAuth();
  const { theme } = useAppTheme();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [info, setInfo]         = useState<string | null>(null);
  const [mode, setMode]         = useState<'signin' | 'signup' | 'forgot'>('signin');

  const heroHeight  = height * 0.38;
  const isNarrow    = width < 375;
  const hPad        = isNarrow ? 18 : 24;
  const authHighlights = [
    { icon: 'sparkles-outline' as const, text: 'Fast sign-in' },
    { icon: 'shield-checkmark-outline' as const, text: 'Secure session' },
    { icon: 'mail-outline' as const, text: 'Email fallback' },
  ];

  function switchMode(next: 'signin' | 'signup' | 'forgot') {
    setError(null);
    setInfo(null);
    setMode(next);
  }

  async function handleSubmit() {
    if (mode === 'forgot') {
      if (!email) { setError('Please enter your email.'); return; }
      setLoading(true);
      setError(null);
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) setError(error);
      else setInfo('Check your email for a password reset link.');
      return;
    }
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError(null);
    const { error } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else if (mode === 'signup') {
      setInfo('Check your email to confirm your account, then sign in.');
      switchMode('signin');
    } else {
      router.replace('/(tabs)');
    }
  }

  async function handleGuest() {
    setLoading(true);
    setError(null);
    const { error } = await signInAsGuest();
    setLoading(false);
    if (error) setError(error);
    else router.replace('/(tabs)');
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) setError(error);
    else router.replace('/(tabs)');
  }

  return (
      <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.primary }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Hero ── */}
      <View style={[styles.hero, { height: heroHeight, paddingTop: insets.top + 10 }]}>
        <View style={[styles.heroOrbTR, { backgroundColor: theme.heroAlt }]} />
        <View style={[styles.heroOrbBL, { backgroundColor: theme.shadow }]} />
        <LumiLogo size={isNarrow ? 'md' : 'lg'} variant="light" />
        <Text style={[styles.heroTagline, { fontSize: isNarrow ? 12 : 13 }]}>
          your travel companion
        </Text>
      </View>

      {/* ── Form sheet ── */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={[
          styles.sheetContent,
          { paddingHorizontal: hPad, paddingBottom: insets.bottom + 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.formTitle, { fontSize: isNarrow ? 22 : 27 }]}>
            {mode === 'signin' && 'Welcome back'}
            {mode === 'signup' && 'Create account'}
            {mode === 'forgot' && 'Reset password'}
          </Text>
          <Text style={styles.formSubtitle}>
            {mode === 'signin' && 'Sign in to access your trips and saved places.'}
            {mode === 'signup' && 'Start planning your next adventure.'}
            {mode === 'forgot' && "We'll send a reset link to your email."}
          </Text>

          <View style={styles.infoRail}>
            {authHighlights.map((item) => (
              <View key={item.text} style={[styles.infoPill, { backgroundColor: theme.primarySoft, borderColor: theme.border }]}>
                <Ionicons name={item.icon} size={13} color={theme.primary} />
                <Text style={styles.infoPillText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.modeTabs}>
            <Pressable
              style={[
                styles.modeTab,
                { backgroundColor: theme.primarySoft, borderColor: theme.border },
                mode === 'signin' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => switchMode('signin')}
            >
              <Text style={[styles.modeTabText, mode === 'signin' && styles.modeTabTextActive]}>
                Sign in
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeTab,
                { backgroundColor: theme.primarySoft, borderColor: theme.border },
                mode === 'signup' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => switchMode('signup')}
            >
              <Text style={[styles.modeTabText, mode === 'signup' && styles.modeTabTextActive]}>
                Create
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeTab,
                { backgroundColor: theme.primarySoft, borderColor: theme.border },
                mode === 'forgot' && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => switchMode('forgot')}
            >
              <Text style={[styles.modeTabText, mode === 'forgot' && styles.modeTabTextActive]}>
                Reset
              </Text>
            </Pressable>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {info ? <Text style={styles.infoText}>{info}</Text> : null}

          {mode !== 'forgot' && (
            <>
              <Pressable
                style={[
                  styles.googleBtn,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  loading && styles.primaryBtnDisabled,
                ]}
                onPress={handleGoogle}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <Ionicons name="logo-google" size={18} color={theme.text} />
                    <Text style={styles.googleBtnText}>Continue with Google</Text>
                  </>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                <Text style={styles.dividerText}>or use email</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
              </View>
            </>
          )}

          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.input}
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
                  <Text style={styles.fieldLabel}>Password</Text>
                  {mode === 'signin' && (
                    <Pressable onPress={() => switchMode('forgot')} hitSlop={8}>
                      <Text style={styles.forgotLink}>Forgot?</Text>
                    </Pressable>
                  )}
                </View>
                <TextInput
                  style={styles.input}
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
              styles.primaryBtn,
              { backgroundColor: theme.primary, shadowColor: theme.primary },
              loading && styles.primaryBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <Text style={styles.primaryBtnText}>
                  {mode === 'signin' && 'Sign in'}
                  {mode === 'signup' && 'Create account'}
                  {mode === 'forgot' && 'Send reset link'}
                </Text>
            }
          </Pressable>

          {mode === 'forgot' ? (
            <Pressable style={styles.textAction} onPress={() => switchMode('signin')}>
              <Text style={[styles.textActionText, { color: theme.primary }]}>Back to sign in</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.textAction}
              onPress={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            >
              <Text style={[styles.textActionText, { color: theme.primary }]}>
                {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </Text>
            </Pressable>
          )}

          {mode !== 'forgot' && (
            <Pressable style={[styles.guestBtn, { borderColor: theme.border }]} onPress={handleGuest} disabled={loading}>
              <Text style={styles.guestBtnText}>Continue as guest</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#7055C8',
  },

  /* hero */
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  heroOrbTR: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#9078E0',
    opacity: 0.5,
  },
  heroOrbBL: {
    position: 'absolute',
    bottom: 20,
    left: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#5A44A8',
    opacity: 0.5,
  },
  heroTagline: {
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  /* sheet */
  sheet: {
    flex: 1,
    backgroundColor: '#F5F0FF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
  },
  sheetContent: {
    paddingTop: 28,
  },

  card: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#4C3D81',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  /* form */
  formTitle: {
    color: '#1E1640',
    fontWeight: '900',
    lineHeight: 32,
  },
  formSubtitle: {
    marginTop: 6,
    color: '#6B5F8A',
    fontSize: 14,
    lineHeight: 20,
  },
  infoRail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F7F3FF',
    borderWidth: 1,
    borderColor: '#E8E0FB',
  },
  infoPillText: {
    color: '#5A4E78',
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 14,
    color: '#C0396A',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  infoText: {
    marginTop: 14,
    color: '#3A7A58',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
  },
  modeTabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  modeTab: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: '#F4F0FF',
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7DFFE',
  },
  modeTabActive: {
    backgroundColor: '#7055C8',
    borderColor: '#7055C8',
  },
  modeTabText: {
    color: '#5B48A8',
    fontSize: 12,
    fontWeight: '800',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  fields: {
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
    color: '#2F2257',
    fontSize: 13,
    fontWeight: '700',
  },
  forgotLink: {
    color: '#7055C8',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E4DCFB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#1E1640',
    fontSize: 15,
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DDD2FA',
  },
  dividerText: {
    color: '#8B7BB5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },

  googleBtn: {
    marginTop: 16,
    borderRadius: 999,
    backgroundColor: '#FCFAFF',
    borderWidth: 1.5,
    borderColor: '#D9CCF8',
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  googleBtnText: {
    color: '#2F2257',
    fontSize: 14,
    fontWeight: '800',
  },

  /* buttons */
  primaryBtn: {
    marginTop: 20,
    borderRadius: 999,
    backgroundColor: '#7055C8',
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7055C8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  textAction: {
    marginTop: 14,
    alignItems: 'center',
  },
  textActionText: {
    color: '#5B48A8',
    fontSize: 14,
    fontWeight: '700',
  },
  guestBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD2FA',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  guestBtnText: {
    color: '#6B5F8A',
    fontSize: 14,
    fontWeight: '700',
  },
});
