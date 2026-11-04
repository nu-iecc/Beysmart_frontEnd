import LockSubpage, { subpageStyles } from '@/components/LockSubpage';
import LockLoader from '@/components/LockLoader';
import TextField from '@/design-system/inputs/TextField';
import { AppButton } from '@/design-system/Buttons/Buttons';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';
import PageHeader from '@/components/PageHeader';
import { getMediaUrl } from '@/constants/api';
import { LockColors } from '@/design-system';
import { colors } from '@/design-system/colors/colors';
import { BackArrow } from '@/design-system/icons';
import { Spacing } from '@/design-system/Layout/spacing';
import { Typography } from '@/design-system/typography/typography';
import { smartLockService } from '@/src/ble';
import apiClient from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserData {
  first_name?: string;
  profile_picture?: string;
}

const DeviceSettings: React.FC = () => {
  const params = useLocalSearchParams();
  const deviceId = params.deviceId as string;
  const deviceName = params.deviceName as string;
  const homeName = params.homeName as string;

  // State
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);

  // Settings state
  const [newDeviceName, setNewDeviceName] = useState(deviceName || '');
  const [doorSensorEnabled, setDoorSensorEnabled] = useState(true);
  const [latchEnabled, setLatchEnabled] = useState(true);

  // Track changes
  const initialStateRef = useRef({
    doorSensorEnabled: true,
    latchEnabled: true,
  });

  const isMountedRef = useRef(true);

  // Load user data for bottom navigation
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser({
            first_name: userData.first_name || undefined,
            profile_picture: getMediaUrl(userData.profile_picture),
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  // Load cached device settings on mount (device does not support read for these characteristics)
  useEffect(() => {
    const loadDeviceSettings = async () => {
      setIsLoading(true);
      try {
        const cacheKey = `device_settings_${deviceId}`;
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (isMountedRef.current) {
            setDoorSensorEnabled(!!parsed.doorSensorEnabled);
            setLatchEnabled(!!parsed.latchEnabled);
            initialStateRef.current = {
              doorSensorEnabled: !!parsed.doorSensorEnabled,
              latchEnabled: !!parsed.latchEnabled,
            };
          }
        }
      } catch (error) {
        console.error('❌ Failed to load cached device settings:', error);
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadDeviceSettings();

    return () => {
      isMountedRef.current = false;
    };
  }, [deviceId]);

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle rename device
  const handleRenameDevice = async () => {
    if (!newDeviceName.trim()) {
      Alert.alert('Error', 'Device name cannot be empty', [{ text: 'OK' }]);
      return;
    }

    if (newDeviceName === deviceName) {
      setShowRenameModal(false);
      return;
    }

    setIsSaving(true);
    try {
      console.log('📝 Renaming device to:', newDeviceName);

      // Update device name in database
      const response = await apiClient.patch(`home/devices/${deviceId}/`, {
        name: newDeviceName,
      });

      console.log('✅ Device renamed successfully');

      if (isMountedRef.current) {
        setShowRenameModal(false);
        Alert.alert('Success', 'Device name updated successfully', [{ text: 'OK' }]);
      }
    } catch (error: any) {
      console.error('❌ Failed to rename device:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to rename device. Please try again.',
        [{ text: 'OK' }]
      );
      // Reset name on error
      setNewDeviceName(deviceName);
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  // Handle door sensor toggle
  const handleDoorSensorToggle = async (value: boolean) => {
    setDoorSensorEnabled(value);
    setIsSaving(true);

    try {
      console.log(`📝 Setting door sensor to: ${value ? 'ENABLED' : 'DISABLED'}`);

      // Write to device
      await smartLockService.configureDoorSensor(value);
      await AsyncStorage.setItem(
        `device_settings_${deviceId}`,
        JSON.stringify({
          doorSensorEnabled: value,
          latchEnabled,
        })
      );

      console.log('✅ Door sensor configured successfully');

      if (isMountedRef.current) {
        Alert.alert(
          'Success',
          `Door sensor ${value ? 'enabled' : 'disabled'} successfully`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Failed to configure door sensor:', error);

      // Revert change on error
      if (isMountedRef.current) {
        setDoorSensorEnabled(!value);
        Alert.alert(
          'Error',
          'Failed to configure door sensor. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  // Handle latch toggle
  const handleLatchToggle = async (value: boolean) => {
    setLatchEnabled(value);
    setIsSaving(true);

    try {
      console.log(`📝 Setting latch to: ${value ? 'ENABLED' : 'DISABLED'}`);

      // Write to device
      await smartLockService.configureUnlatchMode(value);
      await AsyncStorage.setItem(
        `device_settings_${deviceId}`,
        JSON.stringify({
          doorSensorEnabled,
          latchEnabled: value,
        })
      );

      console.log('✅ Latch configured successfully');

      if (isMountedRef.current) {
        Alert.alert(
          'Success',
          `Latch ${value ? 'enabled' : 'disabled'} successfully`,
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Failed to configure latch:', error);

      // Revert change on error
      if (isMountedRef.current) {
        setLatchEnabled(!value);
        Alert.alert(
          'Error',
          'Failed to configure latch. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  // Handle delete device
  const handleDeleteDevice = async () => {
    setShowDeleteConfirm(false);
    setIsSaving(true);

    try {
      console.log('🗑️ Deleting device:', deviceId);

      // Disconnect from BLE device first if connected
      if (smartLockService.isConnected()) {
        console.log('🔌 Disconnecting from device before deletion...');
        await smartLockService.disconnect();
        console.log('✅ Disconnected successfully');
      }

      // Delete device from backend
      await apiClient.delete(`home/devices/${deviceId}/`);

      console.log('✅ Device deleted successfully');

      if (isMountedRef.current) {
        Alert.alert('Success', 'Device deleted successfully', [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to devices list
              router.push('/(HomePage_actions)/MyDevices' as never);
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('❌ Failed to delete device:', error);
      if (isMountedRef.current) {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to delete device. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  // Settings Item Component
  const SettingsItem: React.FC<{
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
  }> = ({ title, subtitle, rightElement, onPress, disabled = false }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isSaving}
      activeOpacity={onPress ? 0.7 : 1}
      style={{
        backgroundColor: colors.surface,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1 }}>
        <Typography
          variant="body"
          color={disabled ? colors.disabled : colors.text}
          style={{ fontWeight: '600', marginBottom: subtitle ? 4 : 0 }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color={colors.secondaryText} style={{ fontSize: 12 }}>
            {subtitle}
          </Typography>
        )}
      </View>
      {rightElement && (
        <View style={{ marginLeft: Spacing.md }}>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );

  return (<LockSubpage title="Lock name" lockName={deviceName} busy={isSaving}>
 <View style={subpageStyles.card}>
  <View style={styles.preview}><View style={styles.iconWrap}><Ionicons name="lock-closed" size={24} color={colors.navBarBackground} /></View><View style={styles.previewCopy}><Typography variant="caption" color={colors.notactiveicon}>Preview</Typography><Typography variant="h3" numberOfLines={1}>{newDeviceName.trim() || 'Unnamed lock'}</Typography></View></View>
  <View style={styles.divider} />
  <TextField label="Name" maxLength={50} value={newDeviceName} onChangeText={setNewDeviceName} placeholder="e.g. Front door" disabled={isSaving} rightIcon={!!newDeviceName && !isSaving ? <TouchableOpacity onPress={() => setNewDeviceName('')} accessibilityRole="button" accessibilityLabel="Clear name" hitSlop={8}><Ionicons name="close-circle" size={20} color={colors.notactiveicon} /></TouchableOpacity> : undefined} />
  <View style={styles.meta}><Typography variant="caption" color={colors.disabled}>Choose a name you can recognise.</Typography><Typography variant="caption" color={colors.disabled}>{newDeviceName.length}/50</Typography></View>
  <AppButton variant="primarySmall" title={isSaving ? 'Saving...' : 'Save name'} onPress={handleRenameDevice} disabled={isSaving || !newDeviceName.trim() || newDeviceName === deviceName} />
 </View>
 <Typography variant="caption" color={colors.disabled} style={{ fontSize: 11, letterSpacing: 1.2 }}>CONFIGURATION</Typography>
 <View style={subpageStyles.card}>
  {isLoading ? <LockLoader label="Loading settings..." /> : <>
   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Typography variant="body">Door sensor</Typography><Typography variant="caption" color={colors.disabled}>{doorSensorEnabled ? 'Enabled' : 'Disabled'}</Typography></View><Switch value={doorSensorEnabled} onValueChange={handleDoorSensorToggle} disabled={isSaving || !smartLockService.isConnected()} trackColor={{ false: colors.border, true: colors.primary.base }} /></View>
   <View style={styles.divider} />
   <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><View style={{ flex: 1 }}><Typography variant="body">Latch configuration</Typography><Typography variant="caption" color={colors.disabled}>{latchEnabled ? 'Latch active' : 'Latch inactive'}</Typography></View><Switch value={latchEnabled} onValueChange={handleLatchToggle} disabled={isSaving || !smartLockService.isConnected()} trackColor={{ false: colors.border, true: colors.primary.base }} /></View>
  </>}
  {!smartLockService.isConnected() && <Typography variant="caption" color={colors.info}>Connect to your lock to modify these settings.</Typography>}
 </View>
 <View style={subpageStyles.card}><Typography variant="body">Location</Typography><Typography variant="caption" color={colors.disabled}>{homeName}</Typography></View>
 <TouchableOpacity style={[subpageStyles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]} onPress={() => setShowDeleteConfirm(true)} disabled={isSaving}><Ionicons name="trash-outline" size={20} color={colors.error} /><Typography variant="body" color={colors.error}>Delete device</Typography></TouchableOpacity>
 <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: Spacing.md,
              paddingTop: Spacing.lg,
              width: '100%',
              alignItems: 'center',
            }}
          >
            {/* Warning Icon */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#FFE6E6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: Spacing.lg,
              }}
            >
              <Typography variant="h2" color={colors.error} style={{ fontSize: 40 }}>
                ⚠️
              </Typography>
            </View>

            {/* Modal Content */}
            <Typography
              variant="h2"
              color="#000000"
              style={{ fontSize: 20, fontWeight: '600', marginBottom: Spacing.sm, textAlign: 'center' }}
            >
              Delete Device?
            </Typography>
            <Typography
              variant="body"
              color="#666666"
              style={{ fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: Spacing.lg }}
            >
              This action cannot be undone. The device &quot;{deviceName}&quot; will be permanently removed from your account.
            </Typography>

            {/* Action Buttons */}
            <View style={{ width: '100%', gap: Spacing.md }}>
              <TouchableOpacity
                onPress={handleDeleteDevice}
                disabled={isSaving}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.error,
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="body"
                  color={colors.text}
                  style={{ fontSize: 16, fontWeight: '600' }}
                >
                  {isSaving ? 'Deleting...' : 'Delete Device'}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(false)}
                disabled={isSaving}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#F5F5F5',
                  paddingVertical: Spacing.md,
                  paddingHorizontal: Spacing.lg,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Typography variant="body" color="#000000" style={{ fontSize: 16, fontWeight: '600' }}>
                  Cancel
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
</LockSubpage>);
};

export default DeviceSettings;

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 18, backgroundColor: '#F6F8FB' },
  iconWrap: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
  previewCopy: { flex: 1, gap: 2 },
  divider: { height: 1, backgroundColor: '#EEF1F5', marginVertical: 4 },
  meta: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: -6 },
  hint: { flex: 1 },
});
