
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
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';
import { signUp } from '@/lib/auth';

const FOREST = {
  background: '#0B100D',
  surface: '#141C16',
  surfaceRaised: '#1B281E',
  green: '#739875',
  greenBright: '#A5C5A0',
  text: '#F0F0E5',
  muted: '#89968A',
  border: '#2C3B2D',
  brown: '#72563C',
  danger: '#E58B80',
  cream: '#D9D3BC',
};

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);

    if (
      !fullName.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await signUp(
        email.trim(),
        password,
        {
          full_name: fullName.trim(),
          role,
        }
      );

      if (authError) {
        setError(authError.message);
      } else if (data.session) {
        router.replace('/(tabs)');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    options: {
      secure?: boolean;
      email?: boolean;
    } = {}
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={FOREST.muted}
        secureTextEntry={options.secure}
        autoCapitalize={options.email ? 'none' : 'words'}
        keyboardType={
          options.email ? 'email-address' : 'default'
        }
        autoCorrect={options.email ? false : undefined}
        editable={!loading}
        selectionColor={FOREST.greenBright}
      />
    </View>
  );

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, 24) + 24 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Header title="QR Attendance" />
            </View>

            <View style={styles.hero}>
              <View style={styles.eyebrowRow}>
                <View style={styles.eyebrowLine} />
                <Text style={styles.eyebrow}>
                  ROOTED IN RESPONSIBILITY
                </Text>
              </View>

              <Text style={styles.title}>
                Grow your{'\n'}
                <Text style={styles.titleAccent}>
                  journey.
                </Text>
              </Text>

              <Text style={styles.subtitle}>
                Create your account and make every
                {' '}attendance count.
              </Text>

              <View style={styles.decorativeLine}>
                <View style={styles.lineGreen} />
                <View style={styles.lineBrown} />
                <View style={styles.lineDark} />
              </View>
            </View>

            {success ? (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>✓</Text>
                </View>
                <Text style={styles.successTitle}>
                  Check your email
                </Text>
                <Text style={styles.successText}>
                  We sent a confirmation link to {email}.
                  Open the link to verify your account,
                  then return to sign in.
                </Text>
                <Link href="/login" style={styles.link}>
                  Back to Sign In →
                </Link>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.sectionHeading}>
                  <Text style={styles.sectionTitle}>
                    Create account
                  </Text>
                  <Text style={styles.stepText}>
                    YOUR FIRST STEP
                  </Text>
                </View>

                {renderInput(
                  'FULL NAME',
                  fullName,
                  setFullName,
                  'Juan Dela Cruz'
                )}

                {renderInput(
                  'EMAIL ADDRESS',
                  email,
                  setEmail,
                  'you@school.edu',
                  { email: true }
                )}

                {renderInput(
                  'PASSWORD',
                  password,
                  setPassword,
                  'At least 6 characters',
                  { secure: true }
                )}

                {renderInput(
                  'CONFIRM PASSWORD',
                  confirmPassword,
                  setConfirmPassword,
                  'Enter your password again',
                  { secure: true }
                )}

                <Text style={styles.label}>
                  CHOOSE YOUR ROLE
                </Text>

                <View style={styles.roleRow}>
                  {(
                    [
                      {
                        value: 'student',
                        title: 'Student',
                        detail: 'Track attendance',
                        symbol: 'S',
                      },
                      {
                        value: 'teacher',
                        title: 'Teacher',
                        detail: 'Manage classes',
                        symbol: 'T',
                      },
                    ] as const
                  ).map((item) => {
                    const active = role === item.value;

                    return (
                      <Pressable
                        key={item.value}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: active }}
                        disabled={loading}
                        onPress={() => setRole(item.value)}
                        style={[
                          styles.roleCard,
                          active && styles.roleCardActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.roleSymbol,
                            active && styles.roleSymbolActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.roleSymbolText,
                              active && styles.roleSymbolTextActive,
                            ]}
                          >
                            {item.symbol}
                          </Text>
                        </View>

                        <View style={styles.roleCopy}>
                          <Text style={styles.roleTitle}>
                            {item.title}
                          </Text>
                          <Text style={styles.roleDetail}>
                            {item.detail}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.radio,
                            active && styles.radioActive,
                          ]}
                        >
                          {active && (
                            <View style={styles.radioDot} />
                          )}
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorMark}>!</Text>
                    <Text style={styles.error}>{error}</Text>
                  </View>
                )}

                <View style={styles.buttonContainer}>
                  {loading ? (
                    <ActivityIndicator
                      size="large"
                      color={FOREST.greenBright}
                      style={styles.loader}
                    />
                  ) : (
                    <AppButton
                      theme="primary"
                      title="Create My Account"
                      icon="person-add-outline"
                      onPress={handleRegister}
                    />
                  )}
                </View>

                <Text style={styles.footerNote}>
                  A smarter way to stay present.
                </Text>
              </View>
            )}

            {!success && (
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>
                  Already have an account?{' '}
                </Text>
                <Link href="/login" style={styles.link}>
                  Sign in
                </Link>
              </View>
            )}

            <View style={styles.bottomDecoration}>
              <View style={styles.bottomLeaf} />
              <Text style={styles.bottomText}>
                NATURE INSPIRED · PURPOSE DRIVEN
              </Text>
              <View style={styles.bottomLeaf} />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FOREST.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginTop: 14,
    marginBottom: 34,
  },
  hero: {
    marginBottom: 30,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  eyebrowLine: {
    width: 25,
    height: 2,
    backgroundColor: FOREST.green,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    color: FOREST.greenBright,
  },
  title: {
    fontSize: 39,
    lineHeight: 45,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: FOREST.text,
  },
  titleAccent: {
    color: FOREST.greenBright,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: FOREST.muted,
    marginTop: 12,
    maxWidth: 300,
  },
  decorativeLine: {
    flexDirection: 'row',
    gap: 5,
    marginTop: 22,
  },
  lineGreen: {
    width: 42,
    height: 3,
    borderRadius: 2,
    backgroundColor: FOREST.green,
  },
  lineBrown: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: FOREST.brown,
  },
  lineDark: {
    width: 7,
    height: 3,
    borderRadius: 2,
    backgroundColor: FOREST.border,
  },
  form: {
    marginBottom: 24,
  },
  sectionHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FOREST.text,
  },
  stepText: {
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
    color: FOREST.muted,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontWeight: '700',
    color: FOREST.cream,
    marginBottom: 8,
    marginTop: 2,
  },
  input: {
    minHeight: 53,
    backgroundColor: FOREST.surface,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: FOREST.border,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: FOREST.text,
  },
  roleRow: {
    gap: 10,
    marginTop: 5,
    marginBottom: 12,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: FOREST.border,
    backgroundColor: FOREST.surface,
    gap: 11,
  },
  roleCardActive: {
    borderColor: FOREST.green,
    backgroundColor: '#19251B',
  },
  roleSymbol: {
    width: 39,
    height: 39,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#222820',
    borderWidth: 1,
    borderColor: FOREST.border,
  },
  roleSymbolActive: {
    backgroundColor: '#304735',
    borderColor: FOREST.green,
  },
  roleSymbolText: {
    fontSize: 17,
    fontWeight: '800',
    color: FOREST.muted,
  },
  roleSymbolTextActive: {
    color: FOREST.greenBright,
  },
  roleCopy: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: FOREST.text,
  },
  roleDetail: {
    fontSize: 12,
    color: FOREST.muted,
    marginTop: 4,
  },
  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: FOREST.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: FOREST.greenBright,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: FOREST.greenBright,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#2A1916',
    borderWidth: 1,
    borderColor: '#59302A',
  },
  errorMark: {
    color: FOREST.danger,
    fontWeight: '800',
    fontSize: 15,
  },
  error: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: FOREST.danger,
  },
  buttonContainer: {
    marginTop: 16,
  },
  loader: {
    marginVertical: 16,
  },
  link: {
    fontSize: 14,
    color: FOREST.greenBright,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 24,
    backgroundColor: FOREST.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FOREST.border,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#243B28',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successIconText: {
    fontSize: 25,
    fontWeight: '700',
    color: FOREST.greenBright,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: FOREST.text,
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: FOREST.muted,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
    marginBottom: 30,
  },
  loginText: {
    fontSize: 13,
    color: FOREST.muted,
  },
  footerNote: {
    marginTop: 20,
    fontSize: 11,
    color: FOREST.muted,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  bottomDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  bottomLeaf: {
    width: 16,
    height: 1,
    backgroundColor: FOREST.brown,
  },
  bottomText: {
    fontSize: 8,
    letterSpacing: 1.3,
    color: FOREST.muted,
    fontWeight: '600',
  },
});
