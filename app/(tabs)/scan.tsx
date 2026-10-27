
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFonts } from 'expo-font';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';
import { registerAttendance } from '@/lib/attendance';

export default function ScanScreen() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [profileName, setProfileName] = useState<string | null>(null);
  const [profileRole, setProfileRole] = useState<Role | null>(null);
  const [identityLoading, setIdentityLoading] = useState(true);
  const [identityError, setIdentityError] = useState(false);

  const scanLine = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  const scanLoop = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let active = true;

    async function loadIdentity() {
      if (!user) {
        setProfileName(null);
        setProfileRole(null);
        setIdentityError(false);
        setIdentityLoading(false);
        return;
      }

      setIdentityLoading(true);
      setIdentityError(false);

      try {
        const profile = await getProfile(user.id);

        if (!active) return;

        setProfileName(profile?.full_name ?? null);
        setProfileRole(profile?.role ?? null);
      } catch {
        if (!active) return;

        setProfileName(null);
        setProfileRole(null);
        setIdentityError(true);
      } finally {
        if (active) setIdentityLoading(false);
      }
    }

    void loadIdentity();

    return () => {
      active = false;
    };
  }, [user]);

  const startAnimation = useCallback(() => {
    scanLoop.current?.stop();
    glowLoop.current?.stop();

    scanLine.setValue(0);
    glow.setValue(0);

    scanLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 1900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    glowLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ])
    );

    scanLoop.current.start();
    glowLoop.current.start();
  }, [glow, scanLine]);

  useEffect(() => {
    if (permission?.granted && !scanned && !processing) {
      startAnimation();
    } else {
      scanLoop.current?.stop();
      glowLoop.current?.stop();
    }

    return () => {
      scanLoop.current?.stop();
      glowLoop.current?.stop();
    };
  }, [permission?.granted, scanned, processing, startAnimation]);

  const resetScanner = useCallback(() => {
    setScanned(false);
    setMessage(null);
    setSuccess(false);
    setProcessing(false);
  }, []);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || processing) return;

    setScanned(true);
    setMessage(null);
    setProcessing(true);

    try {
      if (!user) {
        setMessage('Please log in before recording attendance.');
        setSuccess(false);
        return;
      }

      if (identityLoading) {
        setMessage('Your account is still loading. Please scan again.');
        setSuccess(false);
        return;
      }

      if (identityError) {
        setMessage('Unable to verify your account. Please try again.');
        setSuccess(false);
        return;
      }

      if (profileRole === 'teacher') {
        setMessage(
          'Teacher accounts cannot record attendance. Please use a student account.'
        );
        setSuccess(false);
        return;
      }

      const result = await registerAttendance(data, user.id);

      setMessage(result.message);
      setSuccess(result.success);
    } catch {
      setMessage(
        'Something went wrong while recording attendance. Please try again.'
      );
      setSuccess(false);
    } finally {
      setProcessing(false);
    }
  };

  const identityLabel = identityLoading
    ? 'Checking account...'
    : identityError
      ? 'Account unavailable'
      : profileName || user?.email || 'Not logged in';

  const lineTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 228],
  });

  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1],
  });

  if (!fontsLoaded) return null;

  if (!permission) {
    return (
      <View style={styles.centerScreen}>
        <ActivityIndicator size="large" color={COLORS.sage} />
        <Text style={styles.mutedText}>Preparing your scanner...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionScreen}>
        <View style={styles.permissionArtwork}>
          <View style={styles.permissionArtworkInner}>
            <Ionicons
              name="scan-outline"
              size={48}
              color={COLORS.sage}
            />
          </View>
          <View style={styles.permissionDot} />
        </View>

        <Text style={styles.eyebrow}>ATTENDANCE SYSTEM</Text>
        <Text style={styles.permissionTitle}>Your camera is needed</Text>
        <Text style={styles.permissionDescription}>
          Enable camera access to scan event QR codes and record
          your attendance securely.
        </Text>

        <AppButton
          theme="primary"
          title="Enable Camera"
          icon="camera-outline"
          onPress={() => void requestPermission()}
        />

        <Text style={styles.permissionFootnote}>
          CAMERA ACCESS REQUIRED TO CHECK IN
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          scanned || processing ? undefined : handleBarcodeScanned
        }
      />

      <View pointerEvents="none" style={styles.cameraTint} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandMark}>
          <Ionicons
            name="leaf-outline"
            size={23}
            color={COLORS.sage}
          />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>CAMPUS • CHECK-IN</Text>
          <Text style={styles.title}>Scan & Check In</Text>
          <Text style={styles.subtitle}>
            Your presence, recorded simply.
          </Text>
        </View>

        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Animated QR scanner */}
      <View pointerEvents="none" style={styles.scannerArea}>
        <View style={styles.scannerHeading}>
          <View style={styles.scannerHeadingLine} />
          <Text style={styles.scannerHeadingText}>
            {processing
              ? 'VERIFYING CODE'
              : scanned
                ? 'SCAN PAUSED'
                : 'PLACE CODE INSIDE'}
          </Text>
          <View style={styles.scannerHeadingLine} />
        </View>

        <Animated.View
          style={[styles.scanFrame, { opacity: glowOpacity }]}
        >
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </Animated.View>

        {!scanned && !processing && (
          <Animated.View
            style={[
              styles.scanLine,
              { transform: [{ translateY: lineTranslate }] },
            ]}
          >
            <View style={styles.scanLineCore} />
            <View style={styles.scanLineGlow} />
          </Animated.View>
        )}

        <View style={styles.scannerHint}>
          <Ionicons
            name={processing ? 'sync-outline' : 'scan-outline'}
            size={17}
            color={COLORS.sage}
          />
          <Text style={styles.scannerHintText}>
            {processing
              ? 'Verifying your attendance...'
              : scanned
                ? 'Review your scan result below'
                : 'Align the entire QR code in the frame'}
          </Text>
        </View>
      </View>

      {/* Compact bottom panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.panelHandle} />

        {/* Signed-in account */}
        <View style={styles.identityCard}>
          <View style={styles.avatar}>
            <Ionicons
              name="person-outline"
              size={21}
              color={COLORS.sage}
            />
          </View>

          <View style={styles.identityContent}>
            <Text style={styles.identityLabel}>SIGNED IN AS</Text>
            <Text style={styles.identityName} numberOfLines={1}>
              {identityLabel}
            </Text>
            <Text style={styles.identityRole}>
              {identityLoading
                ? 'Verifying account'
                : profileRole === 'teacher'
                  ? 'Teacher account'
                  : profileRole
                    ? 'Student account'
                    : user
                      ? 'Account'
                      : 'Sign-in required'}
            </Text>
          </View>

          <View style={styles.accountVerified}>
            <Ionicons
              name={
                identityError
                  ? 'alert-circle-outline'
                  : identityLoading
                    ? 'time-outline'
                    : user
                      ? 'shield-checkmark-outline'
                      : 'person-outline'
              }
              size={19}
              color={identityError ? COLORS.danger : COLORS.sage}
            />
          </View>
        </View>

        {/* Instructions or attendance result */}
        {message ? (
          <View
            style={[
              styles.resultCard,
              success ? styles.resultSuccess : styles.resultFailure,
            ]}
          >
            <View style={styles.resultHeader}>
              <Ionicons
                name={
                  success
                    ? 'checkmark-circle'
                    : 'alert-circle-outline'
                }
                size={22}
                color={success ? COLORS.success : COLORS.danger}
              />
              <Text
                style={[
                  styles.resultTitle,
                  { color: success ? COLORS.success : COLORS.danger },
                ]}
              >
                {success ? 'Attendance recorded' : 'Unable to check in'}
              </Text>
            </View>

            <Text style={styles.resultMessage}>{message}</Text>

            <AppButton
              theme="primary"
              title="Scan Another Code"
              icon="refresh-outline"
              onPress={resetScanner}
              disabled={processing}
            />
          </View>
        ) : (
          <View style={styles.instructionCard}>
            <View style={styles.instructionIcon}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={COLORS.sage}
              />
            </View>

            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>
                A quick check-in
              </Text>
              <Text style={styles.instructionDescription}>
                Keep the event QR code clearly visible and hold
                your phone steady until it is recognized.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={COLORS.muted}
          />
          <Text style={styles.footerText}>
            Secure check-in • Linked to your account
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 13,
    backgroundColor: COLORS.background,
  },
  mutedText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
  },
  permissionScreen: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: COLORS.background,
    gap: 15,
  },
  permissionArtwork: {
    width: 112,
    height: 112,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  permissionArtworkInner: {
    width: 82,
    height: 82,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
  },
  permissionDot: {
    position: 'absolute',
    right: 15,
    top: 15,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  permissionTitle: {
    fontSize: 30,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: COLORS.textPrimary,
  },
  permissionDescription: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'DMSans_400Regular',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  permissionFootnote: {
    color: COLORS.muted,
    fontSize: 9,
    letterSpacing: 1.4,
    textAlign: 'center',
    marginTop: 8,
    fontFamily: 'DMSans_700Bold',
  },
  cameraTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,12,7,0.15)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 23,
    paddingHorizontal: 19,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(11,16,13,0.94)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brandMark: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: COLORS.sage,
    fontSize: 9,
    letterSpacing: 1.6,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 3,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: 25,
    fontFamily: 'CormorantGaramond_600SemiBold',
    letterSpacing: -0.2,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 7,
    backgroundColor: COLORS.deepForest,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  liveText: {
    color: COLORS.sage,
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1,
  },
  scannerArea: {
    position: 'absolute',
    top: '21%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  scannerHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 13,
  },
  scannerHeadingLine: {
    width: 24,
    height: 1,
    backgroundColor: COLORS.sage,
    opacity: 0.65,
  },
  scannerHeadingText: {
    color: COLORS.cream,
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 1.8,
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderRadius: 24,
    backgroundColor: 'rgba(11,16,13,0.08)',
  },
  corner: {
    position: 'absolute',
    width: 43,
    height: 43,
    borderColor: COLORS.sage,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 18,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 18,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 18,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 18,
  },
  scanLine: {
    position: 'absolute',
    top: 53,
    left: 10,
    right: 10,
    height: 2,
  },
  scanLineCore: {
    height: 2,
    backgroundColor: COLORS.sage,
    borderRadius: 2,
  },
  scanLineGlow: {
    position: 'absolute',
    top: -5,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: 'rgba(115,152,117,0.20)',
    borderRadius: 8,
  },
  scannerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 15,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 22,
    backgroundColor: 'rgba(11,16,13,0.94)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  scannerHintText: {
    color: COLORS.cream,
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    flexShrink: 1,
  },
  bottomPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: 'rgba(11,16,13,0.97)',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  panelHandle: {
    alignSelf: 'center',
    width: 37,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    marginBottom: 1,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderRadius: 15,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  identityContent: {
    flex: 1,
  },
  identityLabel: {
    color: COLORS.muted,
    fontSize: 9,
    letterSpacing: 1.3,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 2,
  },
  identityName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
  },
  identityRole: {
    color: COLORS.sage,
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    marginTop: 2,
  },
  accountVerified: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.deepForest,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  instructionIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.deepForest,
  },
  instructionContent: {
    flex: 1,
    gap: 4,
  },
  instructionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  instructionDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'DMSans_400Regular',
  },
  resultCard: {
    padding: 11,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    gap: 8,
  },
  resultSuccess: {
    borderColor: COLORS.success,
  },
  resultFailure: {
    borderColor: COLORS.border,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  resultTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'CormorantGaramond_600SemiBold',
  },
  resultMessage: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'DMSans_400Regular',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 1,
  },
  footerText: {
    color: COLORS.muted,
    fontSize: 9,
    textAlign: 'center',
    fontFamily: 'DMSans_400Regular',
  },
});
