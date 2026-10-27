
import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import { signIn } from '@/lib/auth';

const GREEN = '#21834A';
const DARK_GREEN = '#176638';
const MINT = '#E6F5E9';
const CREAM = '#FAFBF7';
const TEXT = '#1D2B21';
const MUTED = '#788579';
const BORDER = '#E3EAE2';
const WHITE = '#FFFFFF';
const RED = '#D94848';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    setError(null);

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await signIn(
        email.trim(),
        password
      );

      if (authError) {
        setError(authError.message);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor={CREAM} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 20 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Brand */}
            <View style={styles.brandRow}>
              <View style={styles.logo}>
                <Ionicons name="leaf" size={27} color={WHITE} />
              </View>

              <View>
                <Text style={styles.brandName}>Kapoya</Text>
                <Text style={styles.brandCaption}>
                  QR ATTENDANCE
                </Text>
              </View>
            </View>

            {/* Welcome section */}
            <View style={styles.welcomeSection}>
              <View style={styles.eyebrow}>
                <View style={styles.eyebrowDot} />
                <Text style={styles.eyebrowText}>
                  YOUR CAMPUS, CONNECTED
                </Text>
              </View>

              <Text style={styles.title}>
                Welcome{'\n'}
                <Text style={styles.titleAccent}>back!</Text>
              </Text>

              <Text style={styles.subtitle}>
                Sign in to manage your attendance
                and get back to your day.
              </Text>

              <View style={styles.decorativeCircle}>
                <Ionicons
                  name="checkmark-circle"
                  size={25}
                  color={GREEN}
                />
              </View>
            </View>

            {/* Login form */}
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Sign in to your account</Text>
              <Text style={styles.formSubtitle}>
                Enter your details to continue.
              </Text>

              <View style={styles.form}>
                <Text style={styles.label}>Email address</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={MUTED}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      if (error) setError(null);
                    }}
                    placeholder="your.email@school.edu"
                    placeholderTextColor="#9AA59B"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    editable={!loading}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.label}>Password</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={MUTED}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      if (error) setError(null);
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor="#9AA59B"
                    secureTextEntry={!showPassword}
                    textContentType="password"
                    autoComplete="current-password"
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />

                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    hitSlop={10}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={21}
                      color={MUTED}
                    />
                  </Pressable>
                </View>

                {error ? (
                  <View style={styles.errorBox}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={20}
                      color={RED}
                    />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.buttonContainer}>
                  {loading ? (
                    <View style={styles.loadingButton}>
                      <ActivityIndicator color={WHITE} />
                      <Text style={styles.loadingText}>Signing in...</Text>
                    </View>
                  ) : (
                    <AppButton
                      theme="primary"
                      title="Sign In"
                      icon="log-in-outline"
                      onPress={handleLogin}
                    />
                  )}
                </View>

                <View style={styles.secureNote}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={16}
                    color={GREEN}
                  />
                  <Text style={styles.secureText}>
                    Your account is securely protected.
                  </Text>
                </View>
              </View>
            </View>

            {/* Registration link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                New to Kapoya?{' '}
              </Text>

              <Link href="/register" asChild>
                <Pressable accessibilityRole="link" disabled={loading}>
                  <Text style={styles.signUpLink}>Create an account</Text>
                </Pressable>
              </Link>
            </View>

            <Text style={styles.bottomCaption}>
              A better way to keep track of your day.
            </Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },

  // Brand
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
    marginBottom: 34,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: TEXT,
  },
  brandCaption: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: GREEN,
    marginTop: 2,
  },

  // Welcome
  welcomeSection: {
    position: 'relative',
    marginBottom: 26,
  },
  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  eyebrowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
  eyebrowText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: DARK_GREEN,
  },
  title: {
    fontSize: 43,
    lineHeight: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: TEXT,
  },
  titleAccent: {
    color: GREEN,
  },
  subtitle: {
    maxWidth: 300,
    fontSize: 15,
    lineHeight: 23,
    color: MUTED,
    marginTop: 12,
  },
  decorativeCircle: {
    position: 'absolute',
    right: 2,
    top: 24,
    width: 53,
    height: 53,
    borderRadius: 27,
    backgroundColor: MINT,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Form card
  formCard: {
    backgroundColor: WHITE,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#183D24',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.055,
    shadowRadius: 18,
    elevation: 2,
  },
  formTitle: {
    fontSize: 21,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: TEXT,
  },
  formSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: MUTED,
    marginTop: 6,
    marginBottom: 22,
  },
  form: {
    gap: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 9,
  },
  inputWrapper: {
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCF9',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 19,
  },
  inputIcon: {
    marginRight: 11,
  },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 53,
    paddingVertical: 12,
    paddingHorizontal: 0,
    fontSize: 14,
    color: TEXT,
  },
  eyeButton: {
    padding: 5,
    marginLeft: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: RED,
  },
  buttonContainer: {
    marginTop: 4,
  },
  loadingButton: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: GREEN,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '700',
    color: WHITE,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 18,
  },
  secureText: {
    fontSize: 11,
    color: MUTED,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 27,
  },
  footerText: {
    fontSize: 13,
    color: MUTED,
  },
  signUpLink: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
  },
  bottomCaption: {
    fontSize: 11,
    textAlign: 'center',
    color: '#98A398',
    marginTop: 18,
    marginBottom: 8,
  },
});
