import { AppButton, Typography } from '@/design-system';
import TextField from '@/design-system/inputs/TextField';
import { AccessibleLock, getAccessibleLock, lockStatus } from '@/services/locks';
import apiClient from '@/utils/api';
import { colors } from '@/design-system/colors/colors';
import { BottomNavigation } from '@/design-system/Navigation';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LockScreen() {
  const { id, homeName } = useLocalSearchParams<{ id: string; homeName?: string }>();
  const [lock, setLock] = useState<AccessibleLock | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [panel, setPanel] = useState<'invite' | 'settings' | 'activity' | null>(null);
  const [connected, setConnected] = useState(false);
  const [battery, setBattery] = useState<number | null>(null);
  const [activities, setActivities] = useState<{ id: string; description: string; timestamp: string }[]>([]);
  const serviceRef = useRef<typeof import('@/src/ble/SmartLockService').smartLockService | null>(null);
  const subscriptionsRef = useRef<(() => void)[]>([]);
  useEffect(() => () => {
    subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
    subscriptionsRef.current = [];
    serviceRef.current?.disconnect().catch(() => {});
  }, [id]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [refresh, setRefresh] = useState(0);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLock(null);
    setPanel(null);
    setError('');
    setNotice('');
    setLoading(true);
    getAccessibleLock(id).then(data => {
      if (active) { setLock(data); setName(data.name); }
    }).catch(() => {
      if (active) setError('Unable to open this lock. Your access may have changed.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, refresh]));

  const connect = async () => {
    if (busy || !lock) return;
    setBusy(true);
    setError('');
    try {
      const current = await getAccessibleLock(id);
      setLock(current);
      if (Platform.OS === 'web') throw new Error('Open the mobile app to connect with Bluetooth.');
      if (!current.ble_device_id) throw new Error('This lock has no Bluetooth connection configured.');
      const { smartLockService } = await import('@/src/ble/SmartLockService');
      serviceRef.current = smartLockService;
      const { LockPosition } = await import('@/src/ble/types');
      subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
      subscriptionsRef.current = [
        smartLockService.on('disconnected', () => setConnected(false)),
        smartLockService.on('batteryLevelChanged', ({ batteryLevel }) => setBattery(batteryLevel)),
      ];
      const success = await smartLockService.connect(current.ble_device_id);
      setConnected(success);
      if (!success) throw new Error('Unable to connect. Enable Bluetooth and stay near the lock.');
      const state = smartLockService.getState();
      setBattery(state.batteryLevel);
      setLock({ ...current, is_locked: state.lockPosition === LockPosition.CLOSED_LOCKED_POSITION ? true :
        state.lockPosition === LockPosition.CLOSED_UNLOCKED_POSITION ? false : null });
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err.message : 'Unable to connect.');
    } finally { setBusy(false); }
  };

  const showActivity = async () => {
    setPanel('activity');
    setBusy(true);
    setError('');
    setActivities([]);
    try {
      const { data } = await apiClient.get('home/activity-logs/', { params: { device_id: id } });
      setActivities(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      setError(err.response?.status === 403 ? 'Activity logs are restricted by the server for this lock.' : 'Unable to load activity logs.');
    } finally { setBusy(false); }
  };

  const controlLock = async (action: 'lock' | 'unlock') => {
    if (!lock || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      // Refresh authorization before attempting a physical operation.
      const current = await getAccessibleLock(id);
      setLock(current);
      if (!current.ble_device_id) throw new Error('This lock has no Bluetooth connection configured.');
      const { smartLockService } = await import('@/src/ble/SmartLockService');
      serviceRef.current = smartLockService;
      const { LockingProcessState } = await import('@/src/ble/types');
      if (!connected && !await smartLockService.connect(current.ble_device_id)) {
        throw new Error('Unable to connect. Make sure Bluetooth is enabled and you are near the lock.');
      }
      try {
        const result = await smartLockService[action]();
        if (result !== LockingProcessState.SUCCESS) throw new Error('The lock did not complete the command. Please try again.');
        setLock({ ...current, is_locked: action === 'lock' });
        try {
          await apiClient.post(`home/devices/${encodeURIComponent(id)}/${action}/`, { access_method: 'bluetooth' });
        } catch {
          setNotice('The lock responded, but its activity could not be synced.');
        }
      } finally {
        await smartLockService.disconnect();
        setConnected(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to operate this lock.');
    } finally { setBusy(false); }
  };

  const manage = async () => {
    if (busy || lock?.role !== 'owner' || !panel || panel === 'activity') return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const current = await getAccessibleLock(id);
      setLock(current);
      if (current.role !== 'owner') { setPanel(null); throw new Error('Only the owner can manage this lock.'); }
      const path = `home/devices/${encodeURIComponent(id)}/`;
      if (panel === 'invite') {
        const { data } = await apiClient.post(`${path}invite-guest/`, { invitee_email: email.trim().toLowerCase(), role: 'guest' });
        setEmail('');
        setNotice(data.pending ? 'Invitation code sent. The guest can use the OTP option below the login password field, then set their password.' : 'Guest access granted. They can log in and refresh their locks.');
      } else {
        const { data } = await apiClient.patch(path, { name: name.trim() });
        setLock(data);
        setNotice('Lock settings saved.');
      }
      setPanel(null);
    } catch (err: any) {
      const detail = err.response?.data;
      setError(detail?.error || detail?.detail || (detail ? 'Unable to save. Check the details and try again.' : err.message) || 'Unable to save. Please try again.');
    } finally { setBusy(false); }
  };

  const menuRow = (icon: React.ComponentProps<typeof Ionicons>['name'], title: string, onPress: () => void) => (
    <TouchableOpacity style={styles.menuRow} accessibilityRole="button" disabled={busy} onPress={onPress}>
      <Ionicons name={icon} size={26} color={colors.navBarBackground} />
      <Typography variant="body" style={{ flex: 1 }}>{title}</Typography>
      <Ionicons name="chevron-forward" size={20} color={colors.secondaryText} />
    </TouchableOpacity>
  );

  return <View style={styles.screen}>
    <View style={styles.header}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back" disabled={busy} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={30} color={colors.surface} />
      </TouchableOpacity>
      <Typography variant="h3" color={colors.surface} style={{ flex: 1 }}>{lock?.name || 'Lock'}{homeName ? ` - ${homeName}` : ''}</Typography>
      {lock && <Typography variant="caption" color={colors.surface}>{lock.role === 'owner' ? 'Owner' : 'Guest'}</Typography>}
    </View>
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
    {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : <>
      {lock && <>
        <View style={styles.controlArea}>
          <View style={styles.telemetry}>
            <View style={styles.telemetryItem}>
              <Ionicons name="battery-full" size={22} color="#8D9E60" />
              <Typography variant="caption">{battery === null ? '--' : `${battery}%`}</Typography>
            </View>
            <TouchableOpacity style={styles.telemetryItem} accessibilityRole="button" disabled={busy} onPress={connect}>
              <Ionicons name="bluetooth" size={24} color={colors.info} />
              <Typography variant="caption" color={colors.info}>{busy ? 'Please wait...' : connected ? 'Connected' : 'Connect'}</Typography>
              <Ionicons name="wifi" size={24} color={colors.disabled} />
            </TouchableOpacity>
          </View>
          <View style={styles.circleArea}>
            <TouchableOpacity style={[styles.statusCircle, connected && { backgroundColor: colors.primary.lightest }]}
              accessibilityRole="button" accessibilityLabel={connected ? `Lock state: ${lockStatus(lock)}` : 'Connect to lock'}
              disabled={busy || connected} onPress={connect}>
              <Typography variant="h2" color={colors.disabled}>{busy ? 'Please wait...' : connected ? lockStatus(lock) : 'Disconnected'}</Typography>
            </TouchableOpacity>
            <Typography variant="body" color={colors.secondaryText} style={styles.hint}>
              {connected ? 'Use the controls below to lock or unlock.' : 'Please connect to wifi or bluetooth to use lock.'}
            </Typography>
            {connected && <View style={styles.actions}>
              <AppButton variant="primarySmall" title="Lock" disabled={busy} onPress={() => controlLock('lock')} />
              <AppButton variant="primarySmall" title="Unlock" disabled={busy} onPress={() => controlLock('unlock')} />
            </View>}
          </View>
        </View>
        {menuRow('list', 'Activity Log', showActivity)}
        {lock.role === 'owner' && <>
          {menuRow('person-add', 'Invite Family and Friends', () => { setPanel('invite'); setNotice(''); })}
          {menuRow('settings-sharp', 'Settings', () => { setPanel('settings'); setNotice(''); })}
        </>}
        {panel && <View style={styles.panel}>
          {panel === 'activity' ? <>
            <Typography variant="h3">Activity Log</Typography>
            {busy ? <ActivityIndicator /> : activities.length === 0 && !error ? <Typography variant="body">No activity available.</Typography> : activities.map(activity => <View key={activity.id} style={{ gap: 4 }}>
              <Typography variant="body">{activity.description}</Typography>
              <Typography variant="caption" color={colors.secondaryText}>{new Date(activity.timestamp).toLocaleString()}</Typography>
            </View>)}
          </> : lock.role === 'owner' && <View style={{ gap: 12 }}>
            <Typography variant="h3">{panel === 'invite' ? 'Invite a guest' : 'Lock name'}</Typography>
            <TextField value={panel === 'invite' ? email : name} onChangeText={panel === 'invite' ? setEmail : setName} placeholder={panel === 'invite' ? 'Guest email address' : 'Lock name'} />
            {panel === 'invite' && <Typography variant="caption">Guest access defaults to one year.</Typography>}
            <AppButton variant="primarySmall" title={panel === 'invite' ? 'Send invitation' : 'Save'} disabled={busy || !(panel === 'invite' ? email.trim() : name.trim())} onPress={manage} />
          </View>}
          <AppButton variant="primarySmall" title="Close" disabled={busy} onPress={() => setPanel(null)} />
        </View>}
      </>}
      {!!error && <Typography variant="body" color="#B42318" style={styles.message}>{error}</Typography>}
      {!!notice && <Typography variant="body" style={styles.message}>{notice}</Typography>}
      {!lock && <AppButton variant="primarySmall" title="Try again" onPress={() => setRefresh(value => value + 1)} />}
    </>}
    </ScrollView>
    <BottomNavigation items={[
      { key: 'home', label: 'Home', icon: null },
      { key: 'devices', label: 'Devices', icon: null },
      { key: 'energy', label: 'Energy', icon: null },
      { key: 'profile', label: 'Profile', icon: null },
    ]} activeKey="devices" onTabPress={key => {
      if (!busy) router.replace({ pathname: '/(app)/home', params: { tab: key } });
    }} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 20, paddingHorizontal: 24, paddingTop: 60, paddingBottom: 26, backgroundColor: colors.navBarBackground },
  controlArea: { backgroundColor: '#F5F5F5' },
  telemetry: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 20 },
  telemetryItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  circleArea: { alignItems: 'center', paddingTop: 44, paddingBottom: 72, paddingHorizontal: 24 },
  statusCircle: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#E5E7EB', borderWidth: 6, borderColor: '#F0F1F3', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } },
  hint: { textAlign: 'center', marginTop: 40 },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 24, paddingHorizontal: 20, paddingVertical: 22, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  panel: { padding: 24, gap: 14, backgroundColor: colors.surface },
  actions: { flexDirection: 'row', gap: 16, marginTop: 20 },
  message: { margin: 24 },
});
