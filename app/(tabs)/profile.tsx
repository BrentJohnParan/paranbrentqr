
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth, signOut } from '@/lib/auth';
import { getProfile, updateProfile, type Profile } from '@/lib/profiles';

const SCREEN_HEIGHT = Dimensions.get('window').height;

type SectionKey =
  | 'personalHeading'
  | 'personalCard'
  | 'settingsHeading'
  | 'securityCard'
  | 'appearanceCard';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  // Measure the profile card before enabling its height collapse.
  const [profileCardHeight, setProfileCardHeight] = useState<number | null>(
    null
  );

  // Store the vertical position of each section in the scroll content.
  const [sectionPositions, setSectionPositions] = useState<
    Partial<Record<SectionKey, number>>
  >({});

  const editingRef = useRef(editing);
  editingRef.current = editing;

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setDraftName('');
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);

    try {
      const result = await getProfile(user.id);
      setProfile(result);

      if (!editingRef.current) {
        setDraftName(result?.full_name ?? '');
      }
    } catch {
      Alert.alert(
        'Profile unavailable',
        'Unable to load your profile. Please try again.'
      );
    } finally {
      setLoadingProfile(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile])
  );

  const handleSaveName = async () => {
    if (!user || saving) return;

    const name = draftName.trim();

    if (!name) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }

    setSaving(true);

    try {
      const { error } = await updateProfile(user.id, {
        full_name: name,
      });

      if (error) {
        Alert.alert('Could not save', error);
        return;
      }

      setProfile((current) =>
        current ? { ...current, full_name: name } : current
      );

      setDraftName(name);
      editingRef.current = false;
      setEditing(false);

      await loadProfile();

      Alert.alert('Profile updated', 'Your name has been saved.');
    } catch {
      Alert.alert(
        'Error',
        'Unable to save your profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftName(profile?.full_name ?? '');
    editingRef.current = false;
    setEditing(false);
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      await signOut();
      router.replace('/login');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to sign out.';

      Alert.alert('Error', message);
    } finally {
      setSigningOut(false);
    }
  };

  const startEditing = () => {
    editingRef.current = true;
    setDraftName(profile?.full_name ?? '');
    setEditing(true);
  };

  const role = profile?.role === 'teacher' ? 'Teacher' : 'Student';

  const initials = (profile?.full_name || user?.email || 'U')
    .trim()
    .charAt(0)
    .toUpperCase();

  const handleProfileCardLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;

    if (height > 0) {
      setProfileCardHeight((current) =>
        current === height ? current : height
      );
    }
  };

  const recordSectionPosition =
    (key: SectionKey) => (event: LayoutChangeEvent) => {
      const y = event.nativeEvent.layout.y;

      setSectionPositions((current) => {
        if (current[key] === y) return current;
        return { ...current, [key]: y };
      });
    };

  // Reveal each section as it approaches the visible screen area.
  // The stagger value makes each following card begin a little later.
  const getRevealStyle = (key: SectionKey, stagger = 0) => {
    const y = sectionPositions[key];

    if (y === undefined) {
      return {
        opacity: 1,
        transform: [{ translateY: 0 }],
      };
    }

    const start = y - SCREEN_HEIGHT + 150 + stagger;
    const end = start + 160;

    const progress = scrollY.interpolate({
      inputRange: [start, end],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });

    return {
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [24, 0],
            extrapolate: 'clamp',
          }),
        },
      ],
    };
  };

  // Profile card: fade, slide upward, and collapse its layout space.
  const profileCardOpacity = scrollY.interpolate({
    inputRange: [0, 60, 150],
    outputRange: [1, 0.55, 0],
    extrapolate: 'clamp',
  });

  const profileCardTranslateY = scrollY.interpolate({
    inputRange: [0, 150],
    outputRange: [0, -65],
    extrapolate: 'clamp',
  });

  const collapseProgress = scrollY.interpolate({
    inputRange: [0, 100, 180],
    outputRange: [0, 0.55, 1],
    extrapolate: 'clamp',
  });

  const collapsedHeight =
    profileCardHeight === null
      ? undefined
      : scrollY.interpolate({
          inputRange: [0, 180],
          outputRange: [profileCardHeight, 0],
          extrapolate: 'clamp',
        });

  const profileCardMargin = collapseProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      onScroll={Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false }
      )}
      scrollEventThrottle={16}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>
            Manage your personal information
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons
            name="leaf-outline"
            size={24}
            color={COLORS.sage}
          />
        </View>
      </View>

      {/* Profile Card: collapses on scroll down */}
      <Animated.View
        style={{
          height: collapsedHeight,
          marginBottom: profileCardMargin,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          onLayout={handleProfileCardLayout}
          style={[
            styles.profileCard,
            {
              opacity: profileCardOpacity,
              transform: [{ translateY: profileCardTranslateY }],
            },
          ]}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
            <View style={styles.onlineDot} />
          </View>

          <Text style={styles.profileName}>
            {profile?.full_name || 'Welcome'}
          </Text>

          <Text style={styles.profileEmail}>
            {user?.email ?? profile?.email ?? ''}
          </Text>

          <View style={styles.rolePill}>
            <Ionicons
              name={
                role === 'Teacher'
                  ? 'school-outline'
                  : 'person-outline'
              }
              size={15}
              color={COLORS.sage}
            />
            <Text style={styles.roleText}>{role}</Text>
          </View>
        </Animated.View>
      </Animated.View>

      {loadingProfile && (
        <ActivityIndicator
          color={COLORS.sage}
          size="small"
          style={styles.loader}
        />
      )}

      {/* Personal Information heading */}
      <Animated.View
        onLayout={recordSectionPosition('personalHeading')}
        style={getRevealStyle('personalHeading')}
      >
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Personal information</Text>
          <Text style={styles.sectionHint}>Your account details</Text>
        </View>
      </Animated.View>

      {/* Personal Information card */}
      <Animated.View
        onLayout={recordSectionPosition('personalCard')}
        style={[
          styles.infoCard,
          getRevealStyle('personalCard', 35),
        ]}
      >
        <View style={styles.fieldHeader}>
          <View style={styles.fieldIcon}>
            <Ionicons
              name="person-outline"
              size={18}
              color={COLORS.sage}
            />
          </View>

          <Text style={styles.label}>Full name</Text>

          {!editing && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit full name"
              onPress={startEditing}
              style={styles.editButton}
            >
              <Ionicons
                name="create-outline"
                size={15}
                color={COLORS.sage}
              />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          )}
        </View>

        {editing ? (
          <View>
            <TextInput
              style={styles.nameInput}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Enter your full name"
              placeholderTextColor={COLORS.muted}
              editable={!saving}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={() => void handleSaveName()}
              accessibilityLabel="Full name"
            />

            <View style={styles.actionRow}>
              <Pressable
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                disabled={saving}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveButton,
                  saving && styles.disabled,
                ]}
                onPress={() => void handleSaveName()}
                disabled={saving}
                accessibilityRole="button"
              >
                {saving ? (
                  <ActivityIndicator
                    color={COLORS.textOnPrimary}
                    size="small"
                  />
                ) : (
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={COLORS.textOnPrimary}
                  />
                )}

                <Text style={styles.saveText}>
                  {saving ? 'Saving...' : 'Save changes'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Text style={styles.value}>
            {profile?.full_name || 'Add your name'}
          </Text>
        )}

        <View style={styles.separator} />

        <View style={styles.fieldHeader}>
          <View style={styles.fieldIcon}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={COLORS.sage}
            />
          </View>
          <Text style={styles.label}>Email address</Text>
        </View>

        <Text selectable style={styles.value}>
          {user?.email ?? profile?.email ?? 'Not available'}
        </Text>

        <View style={styles.separator} />

        <View style={styles.fieldHeader}>
          <View style={styles.fieldIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color={COLORS.sage}
            />
          </View>
          <Text style={styles.label}>Account ID</Text>
        </View>

        <Text selectable style={styles.idValue}>
          {user?.id ?? 'Not available'}
        </Text>
      </Animated.View>

      {/* Settings heading */}
      <Animated.View
        onLayout={recordSectionPosition('settingsHeading')}
        style={getRevealStyle('settingsHeading', 65)}
      >
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Text style={styles.sectionHint}>
            Account and appearance
          </Text>
        </View>
      </Animated.View>

      {/* Account Security */}
      <Animated.View
        onLayout={recordSectionPosition('securityCard')}
        style={[
          styles.settingsCard,
          getRevealStyle('securityCard', 90),
        ]}
      >
        <View style={styles.settingIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color={COLORS.sage}
          />
        </View>

        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Account security</Text>
          <Text style={styles.settingDescription}>
            Keep your account details private
          </Text>
        </View>

        <Ionicons
          name="shield-checkmark-outline"
          size={20}
          color={COLORS.muted}
        />
      </Animated.View>

      {/* App Appearance */}
      <Animated.View
        onLayout={recordSectionPosition('appearanceCard')}
        style={[
          styles.settingsCard,
          getRevealStyle('appearanceCard', 125),
        ]}
      >
        <View style={styles.settingIcon}>
          <Ionicons
            name="leaf-outline"
            size={20}
            color={COLORS.sage}
          />
        </View>

        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>App appearance</Text>
          <Text style={styles.settingDescription}>
            Midnight Forest theme
          </Text>
        </View>

        <View style={styles.activeDot} />
      </Animated.View>

      {/* Sign out */}
      <View style={styles.signOutSection}>
        <Text style={styles.signOutHeading}>Sign out</Text>
        <Text style={styles.signOutDescription}>
          Sign out of your account on this device.
        </Text>

        <AppButton
          title={signingOut ? 'Signing Out...' : 'Sign Out'}
          icon="log-out-outline"
          onPress={handleSignOut}
          disabled={signingOut}
        />
      </View>

      <Text style={styles.footer}>
        MIDNIGHT FOREST {'  ·  '} ACCOUNT SETTINGS
      </Text>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700',
    color: COLORS.sage,
    marginBottom: 6,
  },
  title: {
    fontSize: 29,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 5,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.forest,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    shadowColor: COLORS.sage,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 26,
    backgroundColor: COLORS.forest,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.cream,
  },
  onlineDot: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.card,
    bottom: 1,
    right: 1,
  },
  profileName: {
    fontSize: 21,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 15,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleText: {
    color: COLORS.sage,
    fontWeight: '700',
    fontSize: 12,
  },
  loader: {
    marginBottom: 16,
  },
  sectionHeading: {
    marginBottom: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionHint: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    marginBottom: 28,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 30,
  },
  fieldIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: COLORS.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 9,
    marginLeft: 39,
  },
  idValue: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 9,
    marginLeft: 39,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 6,
  },
  editText: {
    color: COLORS.sage,
    fontSize: 12,
    fontWeight: '700',
  },
  nameInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: COLORS.textPrimary,
    fontSize: 15,
    marginTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 9,
    marginTop: 12,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
    justifyContent: 'center',
  },
  cancelText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: COLORS.primary,
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  saveText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.6,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 17,
    marginLeft: 39,
  },
  settingsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 10,
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: COLORS.deepForest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  settingDescription: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 4,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  signOutSection: {
    backgroundColor: COLORS.deepForest,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 17,
    marginTop: 22,
  },
  signOutHeading: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  signOutDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 16,
  },
  footer: {
    color: COLORS.muted,
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: 24,
  },
});
