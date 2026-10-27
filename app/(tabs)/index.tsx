
import { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';

import {
  CormorantGaramond_600SemiBold,
} from '@expo-google-fonts/cormorant-garamond';

import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';

import Header from '@/components/Header';
import { COLORS } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } =
  Dimensions.get('window');

const LEAVES = [
  { left: 0.04, size: 17, delay: 0, duration: 10500 },
  { left: 0.17, size: 12, delay: 1800, duration: 12500 },
  { left: 0.29, size: 21, delay: 3500, duration: 9500 },
  { left: 0.42, size: 14, delay: 700, duration: 11500 },
  { left: 0.55, size: 19, delay: 2800, duration: 13000 },
  { left: 0.68, size: 13, delay: 4700, duration: 10000 },
  { left: 0.81, size: 22, delay: 1300, duration: 11000 },
  { left: 0.94, size: 15, delay: 3900, duration: 12000 },
  { left: 0.35, size: 11, delay: 5700, duration: 13500 },
  { left: 0.73, size: 12, delay: 6400, duration: 10800 },
];

type LeafConfig = (typeof LEAVES)[number];

function FallingLeaf({
  left,
  size,
  delay,
  duration,
}: LeafConfig) {
  const fallY = useRef(new Animated.Value(-70)).current;
  const driftX = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const reset = Animated.parallel([
      Animated.timing(fallY, {
        toValue: -70,
        duration: 1,
        useNativeDriver: true,
      }),
      Animated.timing(driftX, {
        toValue: 0,
        duration: 1,
        useNativeDriver: true,
      }),
      Animated.timing(rotation, {
        toValue: 0,
        duration: 1,
        useNativeDriver: true,
      }),
      Animated.timing(sway, {
        toValue: 0,
        duration: 1,
        useNativeDriver: true,
      }),
    ]);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(fallY, {
            toValue: SCREEN_HEIGHT + 100,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(driftX, {
              toValue: 26,
              duration: duration * 0.28,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(driftX, {
              toValue: -24,
              duration: duration * 0.34,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(driftX, {
              toValue: 15,
              duration: duration * 0.38,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotation, {
            toValue: 1,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(sway, {
              toValue: 1,
              duration: duration * 0.5,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(sway, {
              toValue: 0,
              duration: duration * 0.5,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ]),
        reset,
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [delay, duration, fallY, driftX, rotation, sway]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['-35deg', '325deg'],
  });

  const swayRotation = sway.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '12deg'],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.fallingLeaf,
        {
          left: SCREEN_WIDTH * left,
          opacity: 0.18 + (size / 22) * 0.13,
          transform: [
            { translateY: fallY },
            { translateX: driftX },
            { rotate },
            { rotate: swayRotation },
          ],
        },
      ]}
    >
      <Ionicons
        name={size > 17 ? 'leaf' : 'leaf-outline'}
        size={size}
        color={COLORS.sage}
      />
    </Animated.View>
  );
}

function FallingLeaves() {
  return (
    <View pointerEvents="none" style={styles.leavesLayer}>
      {LEAVES.map((leaf, index) => (
        <FallingLeaf key={index} {...leaf} />
      ))}
    </View>
  );
}

function ForestGlow() {
  return (
    <View pointerEvents="none" style={styles.glowLayer}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.screen}>
        <ForestGlow />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <Header title="QR Attendance" />
          </View>

          <View style={styles.welcomeSection}>
            <View style={styles.eyebrowRow}>
              <View style={styles.statusDot} />
              <Text style={styles.eyebrow}>
                YOUR ATTENDANCE SPACE
              </Text>
            </View>

            <Text style={styles.greeting}>
              Welcome back.
            </Text>

            <Text style={styles.subtitle}>
              A simpler way to check in, keep track,
              and stay organized.
            </Text>
          </View>

          <View style={styles.heroCard}>
            <View pointerEvents="none" style={styles.heroGlow} />

            <View
              pointerEvents="none"
              style={styles.heroDecoration}
            >
              <Ionicons
                name="leaf-outline"
                size={132}
                color={COLORS.sage}
              />
            </View>

            <View style={styles.heroTopRow}>
              <View style={styles.heroIcon}>
                <Ionicons
                  name="qr-code-outline"
                  size={27}
                  color={COLORS.sage}
                />
              </View>

              <View style={styles.heroTag}>
                <View style={styles.heroTagDot} />
                <Text style={styles.heroTagText}>
                  QUICK CHECK-IN
                </Text>
              </View>
            </View>

            <Text style={styles.heroKicker}>
              YOUR NEXT STEP
            </Text>

            <Text style={styles.heroTitle}>
              Check in with ease.
            </Text>

            <Text style={styles.heroDescription}>
              Scan the QR code provided for your event
              to record your attendance.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Scan QR code"
              onPress={() => router.push('/scan')}
              style={({ pressed }) => [
                styles.scanButton,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.scanButtonIcon}>
                <Ionicons
                  name="scan-outline"
                  size={21}
                  color={COLORS.textOnPrimary}
                />
              </View>

              <Text style={styles.scanButtonText}>
                Scan QR Code
              </Text>

              <View style={styles.scanArrow}>
                <Ionicons
                  name="arrow-forward-outline"
                  size={19}
                  color={COLORS.textOnPrimary}
                />
              </View>
            </Pressable>

            <View style={styles.heroBottomLine}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={COLORS.sage}
              />
              <Text style={styles.heroBottomText}>
                Simple. Fast. Organized.
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <View>
              <Text style={styles.sectionTitle}>
                Your workspace
              </Text>
              <Text style={styles.sectionSubtitle}>
                Everything you need, close at hand
              </Text>
            </View>

            <View style={styles.sectionIcon}>
              <Ionicons
                name="grid-outline"
                size={19}
                color={COLORS.sage}
              />
            </View>
          </View>

          <View style={styles.actionList}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Attendance History"
              onPress={() => router.push('/history')}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <Ionicons
                  name="time-outline"
                  size={23}
                  color={COLORS.sage}
                />
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  Attendance History
                </Text>
                <Text style={styles.actionDescription}>
                  Review your recorded check-ins
                </Text>
              </View>

              <View style={styles.actionArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={COLORS.sage}
                />
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="My Profile"
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [
                styles.actionCard,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.actionIcon}>
                <Ionicons
                  name="person-outline"
                  size={23}
                  color={COLORS.sage}
                />
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  My Profile
                </Text>
                <Text style={styles.actionDescription}>
                  View your account information
                </Text>
              </View>

              <View style={styles.actionArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={COLORS.sage}
                />
              </View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <View style={styles.footerLine} />
            <Ionicons
              name="leaf-outline"
              size={15}
              color={COLORS.muted}
            />
            <Text style={styles.footerText}>
              A calmer way to stay on track
            </Text>
            <View style={styles.footerLine} />
          </View>
        </ScrollView>

        {/* Decorative only: never intercepts taps. */}
        <FallingLeaves />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screen: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 30,
  },
  glowLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    top: 40,
    right: -105,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: COLORS.forest,
    opacity: 0.24,
  },
  glowBottom: {
    position: 'absolute',
    bottom: 40,
    left: -125,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.moss,
    opacity: 0.09,
  },
  leavesLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
    elevation: 5,
  },
  fallingLeaf: {
    position: 'absolute',
    top: 0,
  },
  headerSection: {
    marginBottom: 30,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 12,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.sage,
  },
  eyebrow: {
    color: COLORS.sage,
    fontFamily: 'DMSans_700Bold',
    fontSize: 10,
    letterSpacing: 1.8,
  },
  greeting: {
    color: COLORS.textPrimary,
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 43,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 310,
  },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: COLORS.forest,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: COLORS.cardBorderNeon,
    padding: 20,
    marginBottom: 32,
  },
  heroGlow: {
    position: 'absolute',
    top: 100,
    right: -80,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: COLORS.moss,
    opacity: 0.16,
  },
  heroDecoration: {
    position: 'absolute',
    right: -35,
    top: 105,
    opacity: 0.075,
    transform: [{ rotate: '-24deg' }],
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  heroIcon: {
    width: 53,
    height: 53,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  heroTagText: {
    color: COLORS.sage,
    fontFamily: 'DMSans_700Bold',
    fontSize: 9,
    letterSpacing: 0.8,
  },
  heroKicker: {
    color: COLORS.sage,
    fontFamily: 'DMSans_700Bold',
    fontSize: 9,
    letterSpacing: 1.7,
    marginBottom: 8,
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontFamily: 'CormorantGaramond_600SemiBold',
    fontSize: 34,
    letterSpacing: -0.3,
    lineHeight: 39,
    marginBottom: 9,
  },
  heroDescription: {
    color: COLORS.textSecondary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 22,
    maxWidth: 285,
  },
  scanButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
  },
  scanButtonIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: 'rgba(11,16,13,0.10)',
  },
  scanButtonText: {
    flex: 1,
    color: COLORS.textOnPrimary,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  scanArrow: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: 'rgba(11,16,13,0.10)',
  },
  heroBottomLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 17,
  },
  heroBottomText: {
    color: COLORS.textSecondary,
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
    letterSpacing: 0.3,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontFamily: 'DMSans_700Bold',
    fontSize: 19,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 12,
    marginTop: 5,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionList: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    minHeight: 86,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 13,
  },
  actionIcon: {
    width: 47,
    height: 47,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionContent: {
    flex: 1,
    gap: 5,
  },
  actionTitle: {
    color: COLORS.textPrimary,
    fontFamily: 'DMSans_700Bold',
    fontSize: 14,
  },
  actionDescription: {
    color: COLORS.textSecondary,
    fontFamily: 'DMSans_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  actionArrow: {
    width: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: COLORS.deepForest,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 29,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  footerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
    opacity: 0.7,
  },
  footerText: {
    color: COLORS.muted,
    fontFamily: 'DMSans_400Regular',
    fontSize: 10,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.99 }],
  },
});
