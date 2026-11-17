import LockSubpage, { subpageStyles } from '@/components/LockSubpage';
import { AppButton, Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import TextField from '@/design-system/inputs/TextField';
import { deviceRole } from '@/services/locks';
import apiClient from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { isAxiosError } from 'axios';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

const STEPS = [
  { title: 'Send the invitation', text: 'Enter the email address of the person you want to invite.' },
  { title: 'Guest signs in', text: 'If an invitation code is sent, they can use the OTP option on the login screen.' },
  { title: 'View the lock', text: 'The guest can sign in and refresh their locks after access is granted.' },
];

async function currentUserId(): Promise<string | null> {
  try {
    const raw = await AsyncStorage.getItem('userData');
    const id = raw ? JSON.parse(raw)?.id : null;
    return (typeof id === 'string' && id.trim()) || (typeof id === 'number' && Number.isSafeInteger(id))
      ? String(id) : null;
  } catch {
    return null;
  }
}

const detailStatus = (status: number) => (status >= 200 && status < 300) || status === 403;

// LockControlScreen serializes its own role-cache updates and rechecks on refocus.
function detailRole(data: unknown, status: number): 'owner' | 'guest' | undefined {
  return status !== 403 && data !== null && typeof data === 'object' ? deviceRole(data) : undefined;
}

function responseMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object') {
    const body = data as { error?: unknown; detail?: unknown; message?: unknown };
    for (const value of [body.error, body.detail, body.message]) {
      if (typeof value === 'string' && value.trim()) return value;
    }
  }
  return fallback;
}

function explicitlyFailed(data: unknown): boolean {
  return data !== null && typeof data === 'object' && (data as { success?: unknown }).success === false;
}

export default function LockInviteScreen() {
  const params = useLocalSearchParams<{ deviceId?: string; lockName?: string }>();
  const deviceId = typeof params.deviceId === 'string' ? params.deviceId : '';
  const lockName = typeof params.lockName === 'string' ? params.lockName : undefined;
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const navigationRef = useRef(navigation);
  navigationRef.current = navigation;
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [access, setAccess] = useState<'loading' | 'owner' | 'denied' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [accessError, setAccessError] = useState('');
  const sendingRef = useRef(false);
  const focusVersionRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isFocused) return;
    let active = true;
    focusVersionRef.current += 1;
    const focusVersion = focusVersionRef.current;
    const controller = new AbortController();
    controllerRef.current = controller;
    const isCurrent = () => active && navigationRef.current.isFocused() && focusVersionRef.current === focusVersion;
    setBusy(false);
    setAccess('loading');
    setAccessError('');
    const verify = async () => {
      const userId = await currentUserId();
      try {
        if (!isCurrent()) return;
        if (!deviceId) throw new Error('Missing device ID');
        const { data, status } = await apiClient.get(`home/devices/${encodeURIComponent(deviceId)}/`, { validateStatus: detailStatus, signal: controller.signal });
        if (!isCurrent()) return;
        if (status !== 403 && explicitlyFailed(data)) {
          throw new Error(responseMessage(data, 'Unable to verify your access. Please try again.'));
        }
        const role = detailRole(data, status);
        const sameUser = !userId || await currentUserId() === userId;
        if (!isCurrent()) return;
        if (!sameUser) setAccessError('Account changed while checking access. Please try again.');
        setAccess(!sameUser ? 'error' : role === 'owner' ? 'owner' : 'denied');
      } catch (error) {
        if (!isCurrent()) return;
        const status = isAxiosError(error) ? error.response?.status : undefined;
        if (status === 401 || status === 403 || status === 404) {
          setAccess('denied');
        } else {
          setAccessError(isAxiosError(error)
            ? responseMessage(error.response?.data, 'Unable to verify your access. Please try again.')
            : error instanceof Error ? error.message : 'Unable to verify your access. Please try again.');
          setAccess('error');
        }
      }
    };
    void verify();
    return () => {
      active = false;
      focusVersionRef.current += 1;
      controller.abort();
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [deviceId, isFocused, retry]);

  const invite = async () => {
    if (sendingRef.current || access !== 'owner' || !deviceId || !navigation.isFocused() || !controllerRef.current) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    sendingRef.current = true;
    const focusVersion = focusVersionRef.current;
    const controller = controllerRef.current;
    const isCurrent = () => navigation.isFocused() && !controller.signal.aborted && focusVersionRef.current === focusVersion;
    setBusy(true);
    setFormError('');
    let checkingDetail = true;
    try {
      const userId = await currentUserId();
      if (!isCurrent()) return;
      // Recheck immediately before the mutation in case access changed while the form was open.
      const { data: detail, status } = await apiClient.get(`home/devices/${encodeURIComponent(deviceId)}/`, { validateStatus: detailStatus, signal: controller.signal });
      if (!isCurrent()) return;
      if (status !== 403 && explicitlyFailed(detail)) {
        throw new Error(responseMessage(detail, 'Unable to verify your access. Please try again.'));
      }
      if (detailRole(detail, status) !== 'owner') {
        setAccess('denied');
        throw new Error('Only the owner can invite guests.');
      }
      if (userId && await currentUserId() !== userId) throw new Error('Account changed while checking access.');
      if (!isCurrent()) return;
      checkingDetail = false;
      const { data, status: inviteStatus } = await apiClient.post(`home/devices/${encodeURIComponent(deviceId)}/invite-guest/`, {
        invitee_email: normalizedEmail,
        ...(phone.trim() && { invitee_phone: phone.trim() }),
        role: 'guest',
      }, { validateStatus: detailStatus, signal: controller.signal });
      if (!isCurrent()) return;
      if (inviteStatus === 403) {
        setAccess('denied');
        throw new Error('Only the owner can invite guests.');
      }
      if (explicitlyFailed(data)) {
        throw new Error(responseMessage(data, 'Unable to send the invitation. Please check the details and try again.'));
      }
      setEmail('');
      setPhone('');
      toast.success(data?.pending ? 'Invitation code sent.' : 'Guest access granted.');
    } catch (error) {
      if (!isCurrent()) return;
      const status = isAxiosError(error) ? error.response?.status : undefined;
      const denied = status === 401 || status === 403 || (checkingDetail && status === 404) ||
        (error instanceof Error && error.message === 'Only the owner can invite guests.');
      const fallback = checkingDetail ? 'Unable to verify your access. Please try again.' :
        'Unable to send the invitation. Please check the details and try again.';
      const message = denied ? 'Only the owner can invite guests.' : isAxiosError(error)
        ? responseMessage(error.response?.data, fallback) : error instanceof Error ? error.message : fallback;
      if (denied) {
        setAccess('denied');
      } else if (checkingDetail) {
        setAccessError(message);
        setAccess('error');
      }
      setFormError(message);
      toast.error(message);
    } finally {
      sendingRef.current = false;
      if (isCurrent()) setBusy(false);
    }
  };

  return <LockSubpage title="Invite a guest" lockName={lockName} busy={busy}>
    {access === 'loading' ? <View style={[subpageStyles.card, styles.accessMessage]}>
      <ActivityIndicator color={colors.navBarBackground} />
      <Typography variant="body">Checking your access…</Typography>
    </View> : access !== 'owner' ? <View style={subpageStyles.card}>
      <Typography variant="h3">{access === 'denied' ? 'Owner access required' : 'Unable to verify access'}</Typography>
      <Typography variant="body" color={colors.secondaryText}>
        {access === 'denied' ? 'Only the owner of this lock can invite guests.' : accessError || 'Please check your connection and try again.'}
      </Typography>
      {access === 'error' && <TouchableOpacity accessibilityRole="button" onPress={() => setRetry(value => value + 1)}>
        <Typography variant="body" style={styles.label}>Try again</Typography>
      </TouchableOpacity>}
    </View> : <>
      <View style={subpageStyles.card}>
        <View style={styles.intro}>
          <View style={styles.introIcon}><Ionicons name="people" size={22} color={colors.text} /></View>
          <View style={styles.introCopy}>
            <Typography variant="h3">Invite family & friends</Typography>
            <Typography variant="caption" color={colors.disabled}>Invite someone you trust to this lock.</Typography>
          </View>
        </View>
        <View style={styles.divider} />
        <TextField label="Guest email" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address"
          disabled={busy} accessibilityLabel="Guest email" leftIcon={<Ionicons name="mail-outline" size={18} color={colors.disabled} />} />
        <TextField label="Phone number (optional)" value={phone} onChangeText={setPhone} placeholder="+20 123 456 7890" keyboardType="phone-pad"
          disabled={busy} accessibilityLabel="Guest phone number, optional" leftIcon={<Ionicons name="call-outline" size={18} color={colors.disabled} />} />
        <View style={styles.note}>
          <Ionicons name="time-outline" size={16} color={colors.disabled} />
          <Typography variant="caption" color={colors.disabled} style={styles.introCopy}>Guest access defaults to one year.</Typography>
        </View>
        {!!formError && <Typography variant="caption" color={colors.error}>{formError}</Typography>}
        <AppButton variant="primarySmall" title={busy ? 'Sending…' : 'Send invitation'} disabled={busy || !email.trim()} onPress={invite} />
      </View>
      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={20} color={colors.navBarBackground} />
        <Typography variant="body" color={colors.navBarBackground} style={styles.introCopy}>Guest Bluetooth access is not yet available.</Typography>
      </View>
      <Typography variant="caption" color={colors.disabled} style={styles.sectionLabel}>HOW IT WORKS</Typography>
      <View style={subpageStyles.card}>
        {STEPS.map((step, index) => <View key={step.title} style={styles.step}>
          <View style={styles.stepTrack}>
            <View style={styles.stepNumber}><Typography variant="caption" color={colors.text} style={styles.label}>{index + 1}</Typography></View>
            {index < STEPS.length - 1 && <View style={styles.stepLine} />}
          </View>
          <View style={styles.stepCopy}>
            <Typography variant="body" style={styles.label}>{step.title}</Typography>
            <Typography variant="caption" color={colors.disabled}>{step.text}</Typography>
          </View>
        </View>)}
      </View>
    </>}
  </LockSubpage>;
}

const styles = StyleSheet.create({
  accessMessage: { flexDirection: 'row', alignItems: 'center' },
  intro: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  introIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  introCopy: { flex: 1, gap: 3 },
  divider: { height: 1, backgroundColor: '#EEF0F3', marginVertical: 2 },
  label: { fontWeight: '600' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderRadius: 16, backgroundColor: '#E8F0F7' },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: '600', marginLeft: 4, marginBottom: -6 },
  step: { flexDirection: 'row', gap: 14 },
  stepTrack: { alignItems: 'center' },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.lightest },
  stepLine: { flex: 1, width: 2, minHeight: 16, marginVertical: 4, backgroundColor: '#E8ECF1' },
  stepCopy: { flex: 1, gap: 2, paddingBottom: 14 },
});