import LockLoader from '@/components/LockLoader';
import { AppButton, Typography } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import Beylock from '@/design-system/icons/filled/Beylock';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '@/utils/api';
import { AccessibleLock, getAccessibleLocks, lockStatus } from '@/services/locks';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { AppState, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

interface AccessibleLocksProps {
  emptyContent?: React.ReactNode;
  /** Changing this value reloads the locks, e.g. from a pull-to-refresh. */
  refreshKey?: number;
  onRefreshed?: () => void;
}

export default function AccessibleLocks({ emptyContent, refreshKey, onRefreshed }: AccessibleLocksProps) {
  const [locks, setLocks] = useState<AccessibleLock[] | null>(null);
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
      if (!active) return;
      setLoading(false);
      onRefreshed?.();
    });
    return () => { active = false; };
  }, [refresh, refreshKey, onRefreshed]));

  // Show onboarding only after a successful request confirms there are no locks.
  if (!error && locks?.length === 0 && emptyContent !== undefined) {
    return <>{emptyContent}</>;
  }

  return <View style={styles.section}>
    <View style={styles.header}>
      <Typography variant="h2">Your Locks</Typography>
    </View>
    {!locks && loading ? <LockLoader style={{ margin: 24 }} label="Loading your locks…" /> : error ? <View style={styles.message}>
      <Typography variant="body">{error}</Typography>
      <AppButton variant="primarySmall" title="Try again" onPress={() => setRefresh(value => value + 1)} />
    </View> : !locks || locks.length === 0 ? <Typography variant="body" style={styles.message}>No locks yet. Added locks and accepted guest invitations will appear here.</Typography> :
      <>
        {locks.map(lock => <TouchableOpacity key={lock.id} style={styles.lockCard} activeOpacity={0.85}
          accessibilityRole="button" accessibilityLabel={`${lock.name}, ${lock.role}, ${lockStatus(lock)}`}
          onPress={() => router.push({ pathname: '/(app)/lock', params: { id: String(lock.id), homeName: homes[String(lock.home)] || '' } })}>
          <View style={styles.cardTop}>
            <View style={styles.icon}><Beylock width={22} height={38} color={colors.surface} /></View>
            <View style={[styles.roleBadge, lock.role === 'guest' && styles.roleBadgeGuest]}>
              <Typography variant="caption" color={colors.text} style={styles.roleLabel}>{lock.role === 'owner' ? 'Owner' : 'Guest'}</Typography>
            </View>
          </View>
          <View style={styles.cardBottom}>
            <View style={styles.lockInfo}>
              <Typography variant="h2" color={colors.surface} numberOfLines={1}>{lock.name}</Typography>
              <View style={styles.metaRow}>
                <Typography variant="caption" color="#C7D0DD">{rooms[String(lock.room)] || (lock.role === 'guest' ? 'Shared lock' : 'Room')}</Typography>
                <View style={styles.statusDot} />
                <Typography variant="caption" color="#C7D0DD">Not connected</Typography>
              </View>
              {lock.is_locked !== null && <Typography variant="caption" color="#C7D0DD">{lockStatus(lock)}</Typography>}
            </View>
            <View style={styles.open}><Ionicons name="arrow-forward" size={20} color={colors.text} /></View>
          </View>
        </TouchableOpacity>)}
        <TouchableOpacity style={styles.addLock} accessibilityRole="button" activeOpacity={0.7} onPress={() => router.push('/(devices)/AddDevice2')}>
          <View style={styles.addIcon}><Ionicons name="add" size={24} color={colors.text} /></View>
          <Typography variant="body" style={styles.addLabel}>Add another lock</Typography>
          <Ionicons name="chevron-forward" size={18} color="#9AA4B2" />
        </TouchableOpacity>
      </>}
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  lockCard: { padding: 18, gap: 22, borderRadius: 24, backgroundColor: colors.navBarBackground },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  icon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.primary.base },
  roleBadgeGuest: { backgroundColor: colors.tertiary.lightest },
  roleLabel: { fontWeight: '600' },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  lockInfo: { flex: 1, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  statusDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#A2AAB5' },
  open: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  addLock: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D5DBE3', backgroundColor: colors.surface },
  addIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.lightest },
  addLabel: { flex: 1, fontWeight: '600' },
  message: { marginVertical: 16, gap: 12 },
});
