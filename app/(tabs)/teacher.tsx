
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';
import { createEvent } from '@/lib/events';
import { buildQRPayload } from '@/lib/qr';

type PickerTarget = 'start' | 'end';

export default function TeacherScreen() {
  const { user } = useAuth();

  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [roleError, setRoleError] = useState(false);

  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 60 * 1000)
  );

  const [editTarget, setEditTarget] = useState<PickerTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');

  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>(
    'error'
  );
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const checkRole = async () => {
        if (!user) {
          setRole(null);
          setRoleLoading(false);
          setRoleError(false);
          return;
        }

        setRoleLoading(true);
        setRoleError(false);

        try {
          const profile = await getProfile(user.id);

          if (active) {
            setRole(profile?.role ?? 'student');
          }
        } catch {
          if (active) {
            setRoleError(true);
          }
        } finally {
          if (active) {
            setRoleLoading(false);
          }
        }
      };

      void checkRole();

      return () => {
        active = false;
      };
    }, [user])
  );

  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (event.type === 'dismissed') {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    if (selected) {
      if (editTarget === 'start') {
        setStartDate(selected);
      } else if (editTarget === 'end') {
        setEndDate(selected);
      }
    }

    if (Platform.OS === 'android' && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  const applyQuickDuration = (minutes: number) => {
    setEndDate(new Date(startDate.getTime() + minutes * 60 * 1000));
    setMessage(null);
  };

  const handleCreateEvent = async () => {
    if (saving) return;

    setMessage(null);

    const cleanTitle = title.trim();
    const cleanEventId = eventId.trim();

    if (!cleanTitle || !cleanEventId) {
      setMessageType('error');
      setMessage('Please enter both an event title and event code.');
      return;
    }

    if (startDate.getTime() <= Date.now()) {
      setMessageType('error');
      setMessage('Choose a start time in the future.');
      return;
    }

    if (startDate >= endDate) {
      setMessageType('error');
      setMessage('The end time must be after the start time.');
      return;
    }

    const eventData = {
      eventId: cleanEventId,
      title: cleanTitle,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    setSaving(true);

    try {
      const { error } = await createEvent(eventData);

      if (error) {
        setMessageType('error');
        setMessage('Could not save the event. Check the event code and try again.');
        return;
      }

      setPayload(buildQRPayload(eventData));
      setMessageType('success');
      setMessage(
        'Event saved successfully! The QR code is ready for students to scan.'
      );
    } catch {
      setMessageType('error');
      setMessage('Something went wrong while saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading) {
    return (
      <View style={styles.centered}>
        <View style={styles.loadingIcon}>
          <ActivityIndicator size="large" color={COLORS.sage} />
        </View>
        <Text style={styles.loadingTitle}>Preparing your dashboard</Text>
        <Text style={styles.muted}>Checking your teacher account...</Text>
      </View>
    );
  }

  if (roleError) {
    return (
      <View style={styles.centered}>
        <View style={styles.accessIcon}>
          <Ionicons
            name="cloud-offline-outline"
            size={32}
            color={COLORS.warning}
          />
        </View>
        <Text style={styles.lockTitle}>Unable to verify account</Text>
        <Text style={styles.muted}>
          Check your connection and reopen this tab to try again.
        </Text>
      </View>
    );
  }

  if (role !== 'teacher') {
    return (
      <View style={styles.centered}>
        <View style={styles.accessIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={32}
            color={COLORS.sage}
          />
        </View>
        <Text style={styles.lockTitle}>Teachers only</Text>
        <Text style={styles.muted}>
          Only teacher accounts can create events and generate attendance QR codes.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Dashboard heading */}
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>MIDNIGHT FOREST</Text>
          <Text style={styles.heading}>Teacher Hub</Text>
          <Text style={styles.subtitle}>
            Create events and prepare attendance check-ins.
          </Text>
        </View>

        <View style={styles.headingArtwork}>
          <Ionicons
            name="leaf-outline"
            size={29}
            color={COLORS.sage}
          />
        </View>
      </View>

      {/* Intro card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="qr-code-outline"
              size={27}
              color={COLORS.sage}
            />
          </View>

          <View style={styles.heroBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.heroBadgeText}>TEACHER MODE</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Ready for your next event?</Text>
        <Text style={styles.heroDescription}>
          Set the event details, choose its schedule, and generate a QR code
          for student attendance.
        </Text>

        <View style={styles.heroFooter}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={COLORS.sage}
          />
          <Text style={styles.heroFooterText}>
            Event details are saved through your existing event service.
          </Text>
        </View>
      </View>

      {/* Event form */}
      <View style={styles.sectionHeading}>
        <View style={styles.sectionIcon}>
          <Ionicons
            name="create-outline"
            size={20}
            color={COLORS.sage}
          />
        </View>

        <View style={styles.sectionHeadingCopy}>
          <Text style={styles.sectionTitle}>Create an event</Text>
          <Text style={styles.sectionSubtitle}>
            Enter the details below
          </Text>
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>01</Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.label}>EVENT TITLE</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="calendar-outline"
            size={19}
            color={COLORS.muted}
          />
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setMessage(null);
            }}
            placeholder="e.g. Founders Day Assembly"
            placeholderTextColor={COLORS.muted}
            maxLength={120}
            returnKeyType="next"
          />
        </View>

        <Text style={styles.label}>EVENT CODE</Text>
        <View style={styles.inputWrap}>
          <Ionicons
            name="key-outline"
            size={19}
            color={COLORS.muted}
          />
          <TextInput
            style={styles.textInput}
            value={eventId}
            onChangeText={(value) => {
              setEventId(value);
              setMessage(null);
            }}
            placeholder="e.g. EVT-2026-0001"
            placeholderTextColor={COLORS.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={64}
          />
        </View>

        <View style={styles.formDivider} />

        <View style={styles.scheduleHeading}>
          <View>
            <Text style={styles.scheduleTitle}>Event schedule</Text>
            <Text style={styles.scheduleDescription}>
              Set when attendance is scheduled.
            </Text>
          </View>
          <Ionicons
            name="time-outline"
            size={22}
            color={COLORS.sage}
          />
        </View>

        <Text style={styles.label}>START DATE & TIME</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.dateButton,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setEditTarget('start');
            setEditingPart('date');
          }}
        >
          <View style={styles.dateIcon}>
            <Ionicons
              name="play-circle-outline"
              size={22}
              color={COLORS.sage}
            />
          </View>

          <View style={styles.dateCopy}>
            <Text style={styles.dateValue}>
              {startDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.dateTime}>
              {startDate.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.muted}
          />
        </Pressable>

        <Text style={styles.label}>END DATE & TIME</Text>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.dateButton,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            setEditTarget('end');
            setEditingPart('date');
          }}
        >
          <View style={styles.dateIcon}>
            <Ionicons
              name="stop-circle-outline"
              size={22}
              color={COLORS.warning}
            />
          </View>

          <View style={styles.dateCopy}>
            <Text style={styles.dateValue}>
              {endDate.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.dateTime}>
              {endDate.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={18}
            color={COLORS.muted}
          />
        </Pressable>

        {editTarget && (
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                Choose {editTarget === 'start' ? 'start' : 'end'}{' '}
                {Platform.OS === 'android' ? editingPart : 'date and time'}
              </Text>

              {Platform.OS === 'ios' && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setEditTarget(null)}
                >
                  <Text style={styles.doneText}>Done</Text>
                </Pressable>
              )}
            </View>

            <DateTimePicker
              value={editTarget === 'start' ? startDate : endDate}
              mode={Platform.OS === 'android' ? editingPart : 'datetime'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onPickerChange}
            />
          </View>
        )}

        <Text style={styles.label}>QUICK DURATION</Text>
        <Text style={styles.durationHint}>
          Set the end time relative to the selected start time.
        </Text>

        <View style={styles.chipRow}>
          {[
            { label: '30 min', minutes: 30 },
            { label: '1 hour', minutes: 60 },
            { label: '2 hours', minutes: 120 },
          ].map((option) => (
            <Pressable
              key={option.minutes}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.durationChip,
                pressed && styles.pressed,
              ]}
              onPress={() => applyQuickDuration(option.minutes)}
            >
              <Ionicons
                name="time-outline"
                size={15}
                color={COLORS.sage}
              />
              <Text style={styles.chipText}>{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={saving}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !saving && styles.primaryButtonPressed,
            saving && styles.buttonDisabled,
          ]}
          onPress={() => void handleCreateEvent()}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.textOnPrimary} />
          ) : (
            <>
              <Ionicons
                name="qr-code-outline"
                size={21}
                color={COLORS.textOnPrimary}
              />
              <Text style={styles.primaryButtonText}>
                Create event & generate QR
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={COLORS.textOnPrimary}
              />
            </>
          )}
        </Pressable>

        {message && (
          <View
            style={[
              styles.messageBox,
              messageType === 'success'
                ? styles.successMessage
                : styles.errorMessage,
            ]}
          >
            <Ionicons
              name={
                messageType === 'success'
                  ? 'checkmark-circle'
                  : 'alert-circle'
              }
              size={21}
              color={
                messageType === 'success'
                  ? COLORS.success
                  : COLORS.danger
              }
            />
            <Text
              style={[
                styles.messageText,
                {
                  color:
                    messageType === 'success'
                      ? COLORS.success
                      : COLORS.danger,
                },
              ]}
            >
              {message}
            </Text>
          </View>
        )}
      </View>

      {/* Generated QR */}
      {payload && (
        <>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionIcon}>
              <Ionicons
                name="scan-outline"
                size={20}
                color={COLORS.sage}
              />
            </View>

            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionTitle}>Your event QR</Text>
              <Text style={styles.sectionSubtitle}>
                Ready for student check-in
              </Text>
            </View>

            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>02</Text>
            </View>
          </View>

          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <View style={styles.qrHeaderIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={21}
                  color={COLORS.sage}
                />
              </View>
              <View style={styles.qrHeaderCopy}>
                <Text style={styles.qrHeading}>Attendance QR code</Text>
                <Text style={styles.qrSubtitle}>
                  {title.trim() || 'Your event'}
                </Text>
              </View>
            </View>

            <View style={styles.qrFrame}>
              <QRCode
                value={payload}
                size={210}
                backgroundColor="#FFFFFF"
                color="#101810"
              />
            </View>

            <View style={styles.qrReady}>
              <View style={styles.onlineDot} />
              <Text style={styles.qrReadyText}>QR GENERATED</Text>
            </View>

            <Text style={styles.qrInstructions}>
              Have students scan this code using the Scan tab while signed
              in to their own student accounts.
            </Text>

            <View style={styles.qrDetails}>
              <Text style={styles.qrDetailsLabel}>EVENT CODE</Text>
              <Text style={styles.qrDetailsValue}>
                {eventId.trim()}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                setPayload(null);
                setMessage(null);
              }}
            >
              <Ionicons
                name="add-circle-outline"
                size={19}
                color={COLORS.sage}
              />
              <Text style={styles.secondaryButtonText}>
                Prepare another event
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <View style={styles.bottomNote}>
        <Ionicons
          name="leaf-outline"
          size={17}
          color={COLORS.muted}
        />
        <Text style={styles.bottomNoteText}>
          Midnight Forest · Teacher workspace
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 19,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 19,
  },
  centered: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
    gap: 11,
  },
  loadingIcon: {
    width: 75,
    height: 75,
    borderRadius: 24,
    backgroundColor: COLORS.forest,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  loadingTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  accessIcon: {
    width: 82,
    height: 82,
    borderRadius: 27,
    backgroundColor: COLORS.forest,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  muted: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingCopy: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    color: COLORS.sage,
    marginBottom: 6,
  },
  heading: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: COLORS.textPrimary,
  },
  subtitle: {
    marginTop: 5,
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  headingArtwork: {
    width: 56,
    height: 56,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroCard: {
    backgroundColor: COLORS.forest,
    borderRadius: 23,
    padding: 19,
    borderWidth: 1,
    borderColor: COLORS.cardBorderNeon,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroIcon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  heroBadgeText: {
    color: COLORS.sage,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 27,
    marginTop: 2,
  },
  heroDescription: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 12,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  heroFooterText: {
    flex: 1,
    color: COLORS.sage,
    fontSize: 10,
    lineHeight: 16,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  sectionIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeadingCopy: {
    flex: 1,
    gap: 3,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  stepBadge: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepText: {
    color: COLORS.sage,
    fontSize: 11,
    fontWeight: '800',
  },
  formCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  label: {
    color: COLORS.sage,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 7,
  },
  inputWrap: {
    minHeight: 53,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    backgroundColor: COLORS.deepForest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textInput: {
    flex: 1,
    minHeight: 50,
    color: COLORS.textPrimary,
    fontSize: 13,
    paddingVertical: 10,
  },
  formDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 8,
  },
  scheduleHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 1,
  },
  scheduleTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  scheduleDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    minHeight: 68,
    padding: 12,
    borderRadius: 15,
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dateIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
  },
  dateCopy: {
    flex: 1,
    gap: 5,
  },
  dateValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  dateTime: {
    color: COLORS.sage,
    fontSize: 12,
    fontWeight: '600',
  },
  pickerContainer: {
    padding: 11,
    borderRadius: 15,
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 7,
  },
  pickerTitle: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  doneText: {
    color: COLORS.sage,
    fontSize: 12,
    fontWeight: '800',
    padding: 5,
  },
  durationHint: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginTop: -5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 3,
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: COLORS.forest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.sage,
  },
  primaryButtonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: COLORS.textOnPrimary,
    fontSize: 13,
    fontWeight: '800',
    flexShrink: 1,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 13,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 3,
  },
  successMessage: {
    backgroundColor: '#15251A',
    borderColor: COLORS.forest,
  },
  errorMessage: {
    backgroundColor: '#281A18',
    borderColor: '#55332D',
  },
  messageText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '600',
  },
  qrCard: {
    alignItems: 'center',
    padding: 19,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.cardBorderNeon,
    gap: 15,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 11,
  },
  qrHeaderIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  qrHeading: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  qrSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  qrFrame: {
    padding: 15,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 3,
  },
  qrReady: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  qrReadyText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  qrInstructions: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
  qrDetails: {
    alignSelf: 'stretch',
    padding: 13,
    borderRadius: 13,
    backgroundColor: COLORS.deepForest,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  qrDetailsLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  qrDetailsValue: {
    color: COLORS.sage,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.forest,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    color: COLORS.sage,
    fontSize: 12,
    fontWeight: '800',
  },
  bottomNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 5,
  },
  bottomNoteText: {
    color: COLORS.muted,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
});
