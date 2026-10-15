import LockLoader from '@/components/LockLoader';
import { AppButton, Typography } from '@/design-system';
import { useToast } from '@/components/Toast';
import { AccessibleLock, getAccessibleLock, lockStatus } from '@/services/locks';
import apiClient from '@/utils/api';
import { colors } from '@/design-system/colors/colors';
import { BottomNavigation } from '@/design-system/Navigation';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function LockScreen() {
  const { id, homeName } = useLocalSearchParams<{ id: string; homeName?: string }>();
  const [lock, setLock] = useState<AccessibleLock | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);
  connectedRef.current = connected;
  const [phase, setPhase] = useState<'connecting' | 'disconnecting' | 'lock' | 'unlock' | null>(null);
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!phase) { pulse.stopAnimation(); pulse.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [phase, pulse]);
  const [battery, setBattery] = useState<number | null>(null);
  const serviceRef = useRef<typeof import('@/src/ble/SmartLockService').smartLockService | null>(null);
  const subscriptionsRef = useRef<(() => void)[]>([]);
  useEffect(() => () => {
    subscriptionsRef.current.forEach(unsubscribe => unsubscribe());
    subscriptionsRef.current = [];
    serviceRef.current?.disconnect().catch(() => {});
  }, [id]);
  const [refresh, setRefresh] = useState(0);

  // Re-check access (and pick up renames) whenever the screen regains focus.
  useFocusEffect(useCallback(() => {
    let active = true;
    setError('');
    getAccessibleLock(id).then(data => {
      // While connected, the lock itself is the source of truth for its position.
      if (active) setLock(prev => connectedRef.current && prev ? { ...data, is_locked: prev.is_locked } : data);
    }).catch(() => {
      if (active) { setLock(null); setError('Unable to open this lock. Your access may have changed.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, refresh]));

  const openPage = (pathname: '/(app)/lock-invite' | '/(app)/lock-settings' | '/(app)/lock-activity') => {
    if (busy || !lock) return;
    router.push({ pathname, params: { id, lockName: lock.name } });
  };

  const connect = async () => {
    if (busy || !lock) return;
    setBusy(true);
    setPhase('connecting');
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
      toast('error', err instanceof Error ? err.message : 'Unable to connect.');
    } finally { setBusy(false); setPhase(null); }
  };

  const disconnect = async () => {
    if (busy) return;
    setBusy(true);
    setPhase('disconnecting');
    try {
      await serviceRef.current?.disconnect();
    } catch {
      // The link is dropped locally either way.
    } finally {
      setConnected(false);
      setBusy(false);
      setPhase(null);
    }
  };

  const controlLock = async (action: 'lock' | 'unlock') => {
    if (!lock || busy) return;
    setBusy(true);
    setPhase(action);
    // Keep a connection the user opened; only drop one opened just for this command.
    const keepConnection = connected;
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
          toast('error', 'The lock responded, but its activity could not be synced.');
        }
      } finally {
        if (!keepConnection) {
          await smartLockService.disconnect();
          setConnected(false);
        }
      }
    } catch (err) {
      toast('error', err instanceof Error ? err.message : 'Unable to operate this lock.');
    } finally { setBusy(false); setPhase(null); }
  };

  const menuRow = (icon: React.ComponentProps<typeof Ionicons>['name'], title: string, description: string, onPress: () => void, last = false) => (
    <TouchableOpacity style={[styles.menuRow, !last && styles.menuRowDivider]} accessibilityRole="button" disabled={busy} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color={colors.navBarBackground} />
      </View>
      <View style={styles.menuCopy}>
        <Typography variant="body" style={styles.menuTitle}>{title}</Typography>
        <Typography variant="caption" color={colors.disabled}>{description}</Typography>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9AA4B2" />
    </TouchableOpacity>
  );

  const tile = (icon: React.ComponentProps<typeof Ionicons>['name'], title: string, description: string, tint: string, onPress: () => void) => (
    <TouchableOpacity style={styles.tile} accessibilityRole="button" disabled={busy} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.tileTop}>
        <View style={[styles.tileIcon, { backgroundColor: tint }]}>
          <Ionicons name={icon} size={22} color={colors.navBarBackground} />
        </View>
        <Ionicons name="arrow-forward" size={16} color="#9AA4B2" style={styles.tileArrow} />
      </View>
      <Typography variant="body" style={styles.menuTitle}>{title}</Typography>
      <Typography variant="caption" color={colors.disabled} numberOfLines={2}>{description}</Typography>
    </TouchableOpacity>
  );

  const isOwner = lock?.role === 'owner';
  const unlocked = connected && lock?.is_locked === false;
  const lockKnown = connected && lock?.is_locked != null;
  const statusTitle = phase === 'connecting' ? 'Connecting…' : phase === 'disconnecting' ? 'Disconnecting…'
    : phase === 'lock' ? 'Locking…' : phase === 'unlock' ? 'Unlocking…'
    : connected && lock ? lockStatus(lock) : 'Disconnected';
  const statusHint = phase === 'connecting' ? 'Stay close to the lock'
    : phase ? 'Please wait'
    : !connected ? 'Tap the lock to connect via Bluetooth'
    : lockKnown ? `Tap to ${unlocked ? 'lock' : 'unlock'}` : 'Use the buttons below to lock or unlock';
  const onHeroPress = () => {
    if (!lock || busy) return;
    if (!connected) connect();
    else if (lockKnown) controlLock(lock.is_locked ? 'unlock' : 'lock');
  };
  const pulseStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
  };

  return <View style={styles.screen}>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} accessibilityRole="button" accessibilityLabel="Back" disabled={busy} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.surface} />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Typography variant="h3" color={colors.surface} numberOfLines={1}>{lock?.name || 'Lock'}</Typography>
            <View style={styles.homeRow}>
              <Ionicons name="home-outline" size={12} color="#C7D0DD" />
              <Typography variant="caption" color="#C7D0DD" numberOfLines={1} style={styles.homeLabel}>{homeName || 'Your smart lock'}</Typography>
            </View>
          </View>
          {lock && <View style={[styles.roleBadge, isOwner && styles.roleBadgeOwner]}>
            <Ionicons name={isOwner ? 'key' : 'person'} size={12} color={isOwner ? colors.text : colors.surface} />
            <Typography variant="caption" color={isOwner ? colors.text : colors.surface} style={styles.roleLabel}>{isOwner ? 'Owner' : 'Guest'}</Typography>
          </View>}
        </View>

        {lock && <>
          <View style={styles.hero}>
            <View style={styles.heroStage}>
              <Animated.View pointerEvents="none" style={[styles.heroPulse, connected && styles.heroPulseConnected, pulseStyle]} />
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={connected ? (unlocked ? 'Lock' : 'Unlock') : 'Connect'}
                disabled={busy || (connected && !lockKnown)} onPress={onHeroPress} activeOpacity={0.85}
                style={[styles.heroRing, connected && styles.heroRingConnected]}>
                <View style={[styles.heroButton, connected && styles.heroButtonConnected]}>
                  {phase ? <LockLoader size={40} tone={connected ? 'lime' : 'dark'} /> :
                    <Ionicons name={connected ? (unlocked ? 'lock-open' : 'lock-closed') : 'bluetooth'} size={52} color={connected ? colors.text : colors.surface} />}
                </View>
              </TouchableOpacity>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, connected ? styles.statusDotConnected : styles.statusDotDisconnected]} />
              <Typography variant="h2" color={colors.surface} style={styles.statusTitle} numberOfLines={1}>{statusTitle}</Typography>
            </View>
            <Typography variant="caption" color="#C7D0DD" style={styles.statusHint}>{statusHint}</Typography>
            <TouchableOpacity style={[styles.linkButton, connected ? styles.disconnectButton : styles.connectButton]} accessibilityRole="button"
              disabled={busy} onPress={connected ? disconnect : connect} activeOpacity={0.8}>
              <Ionicons name={connected ? 'close-circle-outline' : 'bluetooth'} size={18} color={connected ? colors.surface : colors.text} />
              <Typography variant="body" color={connected ? colors.surface : colors.text} style={styles.actionLabel}>
                {connected ? 'Disconnect' : 'Connect'}
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.stats}>
            {[
              { icon: 'battery-half' as const, label: 'Battery', value: battery === null ? '--' : `${battery}%` },
              { icon: 'bluetooth' as const, label: 'Bluetooth', value: connected ? 'On' : 'Off' },
              { icon: 'shield-checkmark' as const, label: 'Access', value: isOwner ? 'Full' : 'Guest' },
            ].map(stat => <View key={stat.label} style={styles.stat}>
              <Ionicons name={stat.icon} size={16} color={colors.primary.base} />
              <Typography variant="body" color={colors.surface} style={styles.statValue}>{stat.value}</Typography>
              <Typography variant="caption" color="#C7D0DD">{stat.label}</Typography>
            </View>)}
          </View>
        </>}
      </View>

      <View style={styles.body}>
      {loading ? <LockLoader style={{ marginTop: 40 }} label="Loading lock…" /> : <>
        {lock && <>

        {connected && !lockKnown && <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionButton, styles.actionPrimary]} accessibilityRole="button" disabled={busy} onPress={() => controlLock('lock')}>
            <Ionicons name="lock-closed" size={18} color={colors.text} />
            <Typography variant="body" style={styles.actionLabel}>Lock</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionSecondary]} accessibilityRole="button" disabled={busy} onPress={() => controlLock('unlock')}>
            <Ionicons name="lock-open" size={18} color={colors.surface} />
            <Typography variant="body" color={colors.surface} style={styles.actionLabel}>Unlock</Typography>
          </TouchableOpacity>
        </View>}

        <View style={styles.menuSection}>
          <Typography variant="caption" color={colors.disabled} style={styles.sectionLabel}>QUICK ACCESS</Typography>
          {isOwner && <View style={styles.tiles}>
            {tile('people-outline', 'Invite', 'Share access with family & friends', colors.primary.lightest, () => openPage('/(app)/lock-invite'))}
            {tile('settings-outline', 'Settings', 'Rename and manage this lock', '#F0F3F7', () => openPage('/(app)/lock-settings'))}
          </View>}
          <View style={styles.menuList}>
            {menuRow('time-outline', 'Activity Log', 'Review recent lock activity', () => openPage('/(app)/lock-activity'), true)}
          </View>
        </View>
      </>}
      {!!error && <View style={[styles.message, styles.errorMessage]}>
        <Ionicons name="alert-circle" size={18} color="#B42318" />
        <Typography variant="caption" color="#B42318" style={{ flex: 1 }}>{error}</Typography>
      </View>}
      {!lock && <AppButton variant="primarySmall" title="Try again" onPress={() => setRefresh(value => value + 1)} />}
    </>}
      </View>
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
  screen: { flex: 1, backgroundColor: '#F3F5F8' },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },
  header: { paddingHorizontal: 16, paddingTop: 54, paddingBottom: 18, gap: 16, backgroundColor: '#26364A', borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.11)' },
  headerCopy: { flex: 1, minWidth: 0, gap: 3 },
  homeRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  homeLabel: { flexShrink: 1 },
  roleBadge: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.13)' },
  roleBadgeOwner: { backgroundColor: colors.primary.base },
  roleLabel: { fontWeight: '600' },
  hero: { alignItems: 'center', paddingTop: 4 },
  heroStage: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  heroPulse: { position: 'absolute', width: 168, height: 168, borderRadius: 84, borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  heroPulseConnected: { borderColor: colors.primary.base },
  heroRing: { width: 168, height: 168, borderRadius: 84, padding: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  heroRingConnected: { backgroundColor: 'rgba(207,255,94,0.14)', borderColor: 'rgba(207,255,94,0.4)' },
  heroButton: { flex: 1, borderRadius: 70, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
  heroButtonConnected: { backgroundColor: colors.primary.base },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%' },
  statusTitle: { flexShrink: 1, fontWeight: '700' },
  statusHint: { marginTop: 4, textAlign: 'center' },
  linkButton: { marginTop: 16, minHeight: 44, paddingHorizontal: 22, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 8 },
  connectButton: { backgroundColor: colors.primary.base },
  disconnectButton: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotConnected: { backgroundColor: colors.primary.base },
  statusDotDisconnected: { backgroundColor: '#A2AAB5' },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, alignItems: 'center', gap: 2, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.07)' },
  statValue: { fontWeight: '600', marginTop: 2 },
  body: { paddingHorizontal: 16, paddingTop: 18, gap: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, minHeight: 50, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionPrimary: { backgroundColor: colors.primary.base },
  actionSecondary: { backgroundColor: '#26364A' },
  actionLabel: { fontWeight: '600' },
  menuSection: { gap: 10 },
  sectionLabel: { fontSize: 11, letterSpacing: 1.2, fontWeight: '600', marginLeft: 4 },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, minHeight: 132, padding: 14, gap: 4, borderRadius: 20, borderWidth: 1, borderColor: '#E8ECF1', backgroundColor: colors.surface },
  tileTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  tileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileArrow: { transform: [{ rotate: '-45deg' }] },
  menuList: { borderRadius: 20, borderWidth: 1, borderColor: '#E8ECF1', backgroundColor: colors.surface, overflow: 'hidden' },
  menuRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  menuRowDivider: { borderBottomWidth: 1, borderBottomColor: '#EEF0F3' },
  menuIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F3F7' },
  menuCopy: { flex: 1, gap: 3 },
  menuTitle: { fontWeight: '600' },
  message: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14 },
  errorMessage: { backgroundColor: '#FEF3F2' },
});
