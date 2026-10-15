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
import { StyleSheet, TouchableOpacity, View } from 'react-native';

const MAX_LENGTH = 32;

export default function LockSettingsScreen() {
  const { id, lockName } = useLocalSearchParams<{ id: string; lockName?: string }>();
  const [savedName, setSavedName] = useState(lockName || '');
  const [name, setName] = useState(lockName || '');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const trimmed = name.trim();
  const tooLong = trimmed.length > MAX_LENGTH;
  const unchanged = trimmed === savedName.trim();
  const canSave = !busy && !!trimmed && !tooLong && !unchanged;

  const save = async () => {
    if (!canSave) return;
    setBusy(true);
    try {
      const current = await getAccessibleLock(id);
      if (current.role !== 'owner') throw new Error('Only the owner can manage this lock.');
      const { data } = await apiClient.patch(`home/devices/${encodeURIComponent(id)}/`, { name: trimmed });
      setName(data.name);
      setSavedName(data.name);
      toast('success', 'Lock name updated.');
    } catch (err: any) {
      const detail = err.response?.data;
      toast('error', detail?.error || detail?.detail || (detail ? 'Unable to save. Check the details and try again.' : err.message) || 'Unable to save. Please try again.');
    } finally { setBusy(false); }
  };

  return <LockSubpage title="Lock name" lockName={savedName} busy={busy}>
    <View style={subpageStyles.card}>
      <View style={styles.preview}>
        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed" size={24} color={colors.navBarBackground} />
        </View>
        <View style={styles.previewCopy}>
          <Typography variant="caption" color={colors.notactiveicon}>Preview</Typography>
          <Typography variant="h3" numberOfLines={1}>{trimmed || 'Unnamed lock'}</Typography>
        </View>
      </View>

      <View style={styles.divider} />

      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Front door"
        disabled={busy}
        error={tooLong ? `Keep it under ${MAX_LENGTH} characters.` : undefined}
        rightIcon={!!name && !busy
          ? <TouchableOpacity onPress={() => setName('')} accessibilityRole="button" accessibilityLabel="Clear name" hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.notactiveicon} />
            </TouchableOpacity>
          : undefined}
        accessibilityLabel="Lock name"
      />
      <View style={styles.meta}>
        <Typography variant="caption" color={colors.notactiveicon} style={styles.hint}>Use the door or room it's on, so guests know which lock it is.</Typography>
        <Typography variant="caption" color={tooLong ? colors.error : colors.notactiveicon}>{trimmed.length}/{MAX_LENGTH}</Typography>
      </View>
    </View>

    <AppButton variant="primarySmall" title={busy ? 'Saving…' : 'Save changes'} disabled={!canSave} onPress={save} />
  </LockSubpage>;
}

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: '#F6F8FB' },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  previewCopy: { flex: 1, gap: 2 },
  divider: { height: 1, backgroundColor: '#EEF1F5', marginVertical: 4 },
  meta: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: -6 },
  hint: { flex: 1 },
});
