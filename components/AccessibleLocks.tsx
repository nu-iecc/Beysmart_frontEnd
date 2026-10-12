import { AppButton, Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import Beylock from '@/design-system/icons/filled/Beylock';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/utils/api';
import { AccessibleLock, getAccessibleLocks, lockStatus } from '@/services/locks';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, AppState, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function AccessibleLocks({ emptyContent }: { emptyContent?: React.ReactNode }) {
  const [locks, setLocks] = useState<AccessibleLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [rooms, setRooms] = useState<Record<string, string>>({});
  const [homes, setHomes] = useState<Record<string, string>>({});

  useFocusEffect(useCallback(() => {
    const refreshLocks = () => setRefresh(value => value + 1);
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refreshLocks();
    });
    if (Platform.OS === 'web') window.addEventListener('focus', refreshLocks);
    return () => {
      subscription.remove();
      if (Platform.OS === 'web') window.removeEventListener('focus', refreshLocks);
    };
  }, []));

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    for (const resource of ['rooms', 'homes'] as const) {
      apiClient.get(`home/${resource}/`).then(({ data }) => {
        if (!active) return;
        const entries = Array.isArray(data) ? data : data.results || [];
        const names = Object.fromEntries(entries.map((entry: { id: string | number; name: string }) => [String(entry.id), entry.name]));
        if (resource === 'rooms') setRooms(names); else setHomes(names);
      }).catch(() => { /* Shared locks may not grant access to home or room metadata. */ });
    }
    getAccessibleLocks().then(data => {
      if (active) setLocks(data);
    }).catch(err => {
      if (active) setError(err instanceof Error && err.message.includes('without access roles')
        ? err.message : 'Unable to load your locks. Please try again.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [refresh]));

  // Show onboarding only after a successful request confirms there are no locks.
  if (!loading && !error && locks.length === 0 && emptyContent !== undefined) {
    return <>{emptyContent}<AppButton variant="primarySmall" title="Refresh locks" onPress={() => setRefresh(value => value + 1)} /></>;
  }

  return <View style={styles.section}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <Typography variant="h2">Your Locks</Typography>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh locks" disabled={loading} onPress={() => setRefresh(value => value + 1)}>
        <Ionicons name="refresh" size={22} color={colors.secondaryText} />
      </TouchableOpacity>
    </View>
    {loading ? <ActivityIndicator style={{ margin: 24 }} /> : error ? <View style={styles.message}>
      <Typography variant="body">{error}</Typography>
      <AppButton variant="primarySmall" title="Try again" onPress={() => setRefresh(value => value + 1)} />
    </View> : locks.length === 0 ? <Typography variant="body" style={styles.message}>No locks yet. Added locks and accepted guest invitations will appear here.</Typography> :
      <>
        {locks.map(lock => <TouchableOpacity key={lock.id} style={styles.lockRow}
          accessibilityRole="button" accessibilityLabel={`${lock.name}, ${lock.role}, ${lockStatus(lock)}`}
          onPress={() => router.push({ pathname: '/(app)/lock', params: { id: String(lock.id), homeName: homes[String(lock.home)] || '' } })}>
          <View style={styles.iconCircle}><Beylock width={22} height={38} color={colors.primary.darker} /></View>
          <View style={styles.lockInfo}>
            <View style={styles.titleRow}>
              <Typography variant="h3" style={{ flexShrink: 1 }}>{lock.name}</Typography>
              <Typography variant="caption" color={colors.secondaryText}>{lock.role === 'owner' ? 'Owner' : 'Guest'}</Typography>
            </View>
            <View style={styles.metaRow}>
              <Typography variant="caption" color={colors.secondaryText}>{rooms[String(lock.room)] || (lock.role === 'guest' ? 'Shared lock' : 'Room')}</Typography>
              <View style={styles.badge}><Typography variant="caption" color={colors.secondaryText}>Not Connected</Typography></View>
            </View>
            {lock.is_locked !== null && <Typography variant="caption" color={colors.secondaryText}>{lockStatus(lock)}</Typography>}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
        </TouchableOpacity>)}
        <TouchableOpacity style={styles.addLock} accessibilityRole="button" onPress={() => router.push('/(devices)/AddDevice2')}>
          <Ionicons name="add" size={30} color={colors.primary.darker} />
          <Typography variant="h3" color={colors.primary.darker}>Add Another Lock</Typography>
        </TouchableOpacity>
      </>}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 8 },
  lockRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: colors.surface, borderRadius: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  iconCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  lockInfo: { flex: 1, gap: 8 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  badge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#F3F4F6' },
  addLock: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, backgroundColor: '#F5F5F5', marginTop: 4 },
  message: { marginVertical: 16, gap: 12 },
});
