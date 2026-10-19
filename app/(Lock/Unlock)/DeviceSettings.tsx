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
  const [newDeviceName, setNewDeviceName] = useState(deviceName);
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.navBarBackground }}>
        <View
          style={{
            backgroundColor: colors.navBarBackground,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <TouchableOpacity
              onPress={handleBack}
              accessibilityLabel="Go back"
              accessibilityHint="Return to lock control screen"
              style={{ padding: Spacing.xs, marginRight: Spacing.sm }}
            >
              <BackArrow width={24} height={24} color={LockColors?.menu.background} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Typography
                variant="h3"
                color={LockColors?.menu.background}
                style={{ fontSize: 16, fontWeight: '600' }}
              >
                Device Settings
              </Typography>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: Spacing.xl }}>
            <Typography variant="body" color={colors.secondaryText}>
              Loading settings...
            </Typography>
          </View>
        ) : (
          <>
            {/* Device Name Section */}
            <View style={{ marginTop: Spacing.lg }}>
              <Typography
                variant="caption"
                color={colors.secondaryText}
                style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, fontWeight: '600', textTransform: 'uppercase' }}
              >
                Device Information
              </Typography>
              <SettingsItem
                title="Device Name"
                subtitle={deviceName}
                onPress={() => {
                  setNewDeviceName(deviceName);
                  setShowRenameModal(true);
                }}
                rightElement={
                  <Typography variant="caption" color={colors.primary.base} style={{ fontWeight: '600' }}>
                    Edit
                  </Typography>
                }
              />
              <SettingsItem
                title="Location"
                subtitle={homeName}
              />
            </View>

            {/* Device Configuration Section */}
            <View style={{ marginTop: Spacing.lg }}>
              <Typography
                variant="caption"
                color={colors.secondaryText}
                style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, fontWeight: '600', textTransform: 'uppercase' }}
              >
                Configuration
              </Typography>
              <SettingsItem
                title="Door Sensor"
                subtitle={doorSensorEnabled ? 'Enabled' : 'Disabled'}
                disabled={isSaving || !smartLockService.isConnected()}
                rightElement={
                  <Switch
                    value={doorSensorEnabled}
                    onValueChange={handleDoorSensorToggle}
                    disabled={isSaving || !smartLockService.isConnected()}
                    trackColor={{ false: colors.disabled, true: colors.success }}
                    thumbColor={doorSensorEnabled ? colors.primary.base : colors.disabled}
                  />
                }
              />
              <SettingsItem
                title="Latch Configuration"
                subtitle={latchEnabled ? 'Latch active' : 'Latch inactive'}
                disabled={isSaving || !smartLockService.isConnected()}
                rightElement={
                  <Switch
                    value={latchEnabled}
                    onValueChange={handleLatchToggle}
                    disabled={isSaving || !smartLockService.isConnected()}
                    trackColor={{ false: colors.disabled, true: colors.success }}
                    thumbColor={latchEnabled ? colors.primary.base : colors.disabled}
                  />
                }
              />
            </View>

            {/* Help Text */}
            {!smartLockService.isConnected() && (
              <View
                style={{
                  backgroundColor: colors.background,
                  marginHorizontal: Spacing.md,
                  marginTop: Spacing.lg,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  borderRadius: 8,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.info,
                }}
              >
                <Typography variant="caption" color={colors.info} style={{ fontSize: 12 }}>
                  Connect to your device to modify these settings.
                </Typography>
              </View>
            )}

            {/* Danger Zone Section */}
            <View style={{ marginTop: Spacing.xl }}>
              <Typography
                variant="caption"
                color={colors.error}
                style={{ paddingHorizontal: Spacing.md, marginBottom: Spacing.sm, fontWeight: '600', textTransform: 'uppercase' }}
              >
                Danger Zone
              </Typography>
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
                activeOpacity={0.7}
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
                    color={colors.error}
                    style={{ fontWeight: '600' }}
                  >
                    Delete Device
                  </Typography>
                  <Typography variant="caption" color={colors.secondaryText} style={{ fontSize: 12, marginTop: 4 }}>
                    Permanently remove this device from your account
                  </Typography>
                </View>
                <Typography variant="body" color={colors.error} style={{ fontSize: 20, fontWeight: '300' }}>
                  ›
                </Typography>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {/* Rename Modal */}
      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRenameModal(false)}
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
            }}
          >
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg }}>
              <Typography variant="h3" color="#000000" style={{ fontSize: 18, fontWeight: '600' }}>
                Rename Device
              </Typography>
              <TouchableOpacity onPress={() => setShowRenameModal(false)} style={{ padding: Spacing.xs }}>
                <Typography variant="h3" color="#666666" style={{ fontSize: 24 }}>×</Typography>
              </TouchableOpacity>
            </View>

            {/* Input Field */}
            <TextInput
              value={newDeviceName}
              onChangeText={setNewDeviceName}
              placeholder="Enter device name"
              placeholderTextColor={colors.disabled}
              maxLength={50}
              style={{
                backgroundColor: colors.background,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                marginBottom: Spacing.lg,
                color: colors.text,
                fontSize: 14,
              }}
              editable={!isSaving}
            />

            {/* Character count */}
            <Typography
              variant="caption"
              color={colors.secondaryText}
              style={{ fontSize: 11, marginBottom: Spacing.md, textAlign: 'right' }}
            >
              {newDeviceName.length}/50
            </Typography>

            {/* Action Buttons */}
            <View style={{ gap: Spacing.md }}>
              <TouchableOpacity
                onPress={handleRenameDevice}
                disabled={isSaving || !newDeviceName.trim()}
                activeOpacity={0.7}
                style={{
                  backgroundColor: newDeviceName.trim() ? colors.primary.base : colors.disabled,
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
                  {isSaving ? 'Saving...' : 'Save'}
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowRenameModal(false)}
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

      {/* Delete Confirmation Modal */}
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
              This action cannot be undone. The device "{deviceName}" will be permanently removed from your account.
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
    </View>
  );
};

export default DeviceSettings;
