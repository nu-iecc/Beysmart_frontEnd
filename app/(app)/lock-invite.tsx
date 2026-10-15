import LockSubpage, { subpageStyles } from '@/components/LockSubpage';
import { useToast } from '@/components/Toast';
import { AppButton, Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import TextField from '@/design-system/inputs/TextField';
import { getAccessibleLock } from '@/services/locks';
import apiClient from '@/utils/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

const STEPS = [
  { title: 'Send the invite', text: 'They receive an invitation code by email.' },
  { title: 'Guest signs in', text: 'They use the OTP option below the login password field, then set a password.' },
  { title: 'Access granted', text: 'The lock appears in their app, with access for one year.' },
];

export default function LockInviteScreen() {
  const { id, lockName } = useLocalSearchParams<{ id: string; lockName?: string }>();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const invite = async () => {
    if (busy || !email.trim()) return;
    setBusy(true);
    try {
      const current = await getAccessibleLock(id);
      if (current.role !== 'owner') throw new Error('Only the owner can manage this lock.');
      const { data } = await apiClient.post(`home/devices/${encodeURIComponent(id)}/invite-guest/`, { invitee_email: email.trim().toLowerCase(), ...(phone.trim() && { invitee_phone: phone.trim() }), role: 'guest' });
      setEmail('');
      setPhone('');
      toast('success', data.pending ? 'Invitation code sent. The guest can use the OTP option below the login password field, then set their password.' : 'Guest access granted. They can log in and refresh their locks.');
    } catch (err: any) {
      const detail = err.response?.data;
      toast('error', detail?.error || detail?.detail || (detail ? 'Unable to save. Check the details and try again.' : err.message) || 'Unable to save. Please try again.');
    } finally { setBusy(false); }
  };

  return <LockSubpage title="Invite a guest" lockName={lockName} busy={busy}>
    <View style={subpageStyles.card}>
      <View style={styles.intro}>
        <View style={styles.introIcon}>
          <Ionicons name="people" size={22} color={colors.text} />
        </View>
        <View style={styles.introCopy}>
          <Typography variant="h3">Invite family & friends</Typography>
          <Typography variant="caption" color={colors.disabled}>Give someone you trust guest access to this lock.</Typography>
        </View>
      </View>
      <View style={styles.divider} />
      <Typography variant="body" style={styles.label}>Guest email</Typography>
      <TextField value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address"
        leftIcon={<Ionicons name="mail-outline" size={18} color={colors.disabled} />} />
      <Typography variant="body" style={styles.label}>Phone number <Typography variant="caption" color={colors.disabled}>(optional)</Typography></Typography>
      <TextField value={phone} onChangeText={setPhone} placeholder="+20 123 456 7890" keyboardType="phone-pad"
        leftIcon={<Ionicons name="call-outline" size={18} color={colors.disabled} />} />
      <View style={styles.note}>
        <Ionicons name="time-outline" size={14} color={colors.disabled} />
        <Typography variant="caption" color={colors.disabled}>Guest access defaults to one year.</Typography>
      </View>
      <AppButton variant="primarySmall" title={busy ? 'Sending…' : 'Send invitation'} disabled={busy || !email.trim()} onPress={invite} />
    </View>

    <Typography variant="caption" color={colors.disabled} style={styles.sectionLabel}>HOW IT WORKS</Typography>
    <View style={subpageStyles.card}>
      {STEPS.map((step, index) => <View key={step.title} style={styles.step}>
        <View style={styles.stepTrack}>
          <View style={styles.stepNumber}>
            <Typography variant="caption" color={colors.text} style={styles.label}>{index + 1}</Typography>
          </View>
          {index < STEPS.length - 1 && <View style={styles.stepLine} />}
        </View>
        <View style={styles.stepCopy}>
          <Typography variant="body" style={styles.label}>{step.title}</Typography>
          <Typography variant="caption" color={colors.disabled}>{step.text}</Typography>
        </View>
      </View>)}
    </View>
  </LockSubpage>;
}

const styles = StyleSheet.create({
  intro: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  introIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  introCopy: { flex: 1, gap: 3 },
  divider: { height: 1, backgroundColor: '#EEF0F3', marginVertical: 2 },
  label: { fontWeight: '600' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: '600', marginLeft: 4, marginBottom: -6 },
  step: { flexDirection: 'row', gap: 14 },
  stepTrack: { alignItems: 'center' },
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.lightest },
  stepLine: { flex: 1, width: 2, minHeight: 16, marginVertical: 4, backgroundColor: '#E8ECF1' },
  stepCopy: { flex: 1, gap: 2, paddingBottom: 14 },
});
