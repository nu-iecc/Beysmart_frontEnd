import SetupScreen from '@/components/SetupScreen';
import { setupStyles } from '@/components/SetupScreen';
import { AppButton } from '@/design-system/Buttons/Buttons';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import ProfilePage from '../(profile actions)/Profile';
import { getMediaUrl } from '../../constants/api';
import { colors } from '../../design-system/colors/colors';
import { BackArrow } from '../../design-system/icons';
import { Beylock, Beyplug, Beysense, Beyswitch, BluetoothIcon } from '../../design-system/icons/filled/';
import { Spacing } from '../../design-system/Layout/spacing';
import { BottomNavigation } from '../../design-system/Navigation/BottomNavigation';
import { Typography } from '../../design-system/typography/typography';
// Metro config handles BLE mocking when DISABLE_BLE=true
import bluetoothManager from '../../src/ble';

// BLE Device interface - matches the interface from bluetoothManager
interface BleDevice {
  id: string;
  name: string;
  rssi: number;
  advertising: any;
}
interface ScannedDevice {
  id: string;
  name: string;
  isConnectable: boolean;
  icon: any;
}

const AddDevice4 = () => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [scannedDevices, setScannedDevices] = useState<ScannedDevice[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

  // Map device names to appropriate icons
  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    if (name.includes('lock') || name.includes('beylock')) return Beylock;
    if (name.includes('plug') || name.includes('beyplug')) return Beyplug;
    if (name.includes('sense') || name.includes('beysense')) return Beysense;
    if (name.includes('switch') || name.includes('beyswitch')) return Beyswitch;
    return BluetoothIcon; // Default icon
  };

  // Load user data for profile
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          setUser({
            first_name: userData.first_name || undefined,
            profile_picture: getMediaUrl(userData.profile_picture)
          });
          setUserEmail(userData.email || '');
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  // Start scanning when component mounts
  useEffect(() => {
    startBluetoothScanning();
    return () => {
      // Cleanup: stop scanning when component unmounts
      // NOTE: Do NOT call destroyBleManager() here! It causes crashes during navigation
      // when the device is still connected. The device should stay connected through
      // the entire calibration flow.
      console.log('🔕 AddDevice4 unmounting - NOT destroying BLE manager');
    };
  }, []);

  const startBluetoothScanning = async () => {
    try {
      setIsScanning(true);
      setScannedDevices([]);
      setShowDeviceList(false);

      let scanTimeout: ReturnType<typeof setTimeout> | null = null;
      let foundSmartDevice = false;

      await bluetoothManager.scanForDevices((device: import("../../src/ble/types").BleDevice) => {
        console.log('Found device:', device.name, device.id);

        // Only add devices that have names (the bluetooth manager already filters for named devices)
        if (device.name) {
          const newDevice: ScannedDevice = {
            id: device.id,
            name: device.name,
            isConnectable: true, // Assume connectable since manager returns valid BLE devices
            icon: getDeviceIcon(device.name)
          };

          setScannedDevices(prevDevices => {
            // Check if device already exists
            const exists = prevDevices.some(d => d.id === device.id);
            if (!exists) {
              return [...prevDevices, newDevice];
            }
            return prevDevices;
          });

          // Stop scanning immediately if device name contains "Smart"
          if (device.name.toLowerCase().includes('smart') && !foundSmartDevice) {
            foundSmartDevice = true;
            console.log('Found Smart device, stopping scan...');
            if (scanTimeout) clearTimeout(scanTimeout);
            bluetoothManager.stopScan();
            setIsScanning(false);
            setShowDeviceList(true);
          }
        }
      });

      // Stop scanning after 2 seconds if no Smart device found
      scanTimeout = setTimeout(() => {
        if (!foundSmartDevice) {
          console.log('Scan timeout (2s), stopping...');
          bluetoothManager.stopScan();
          setIsScanning(false);
          setShowDeviceList(true);
        }
      }, 2000);

    } catch (error) {
      console.error('Bluetooth scanning error:', error);
      setBluetoothEnabled(false);
      setShowBluetoothModal(true);
      setIsScanning(false);
    }
  };

  const handleBack = () => router.back();

  const handleDeviceSelect = (deviceType: string) => {
    setSelectedDevice(deviceType);
  };

  const handleConnect = async (deviceId: string, deviceName: string) => {
    try {
      setIsConnecting(true);
      const device = await bluetoothManager.connectToDevice(deviceId);

      if (device) {
        // Store the BLE device ID for later use when creating device in backend
        await AsyncStorage.setItem('bleDeviceId', deviceId);
        await AsyncStorage.setItem('bleDeviceName', deviceName);
        console.log('Stored BLE Device ID:', deviceId);
        console.log('Stored BLE Device Name:', deviceName);

        Alert.alert(
          'Success!',
          `Connected to ${device.name}`,
          [
            {
              text: 'Continue',
              // Skip WiFi credentials screen, go directly to device pairing success
              onPress: () => router.push('/(devices)/AddDevice7')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to connect to the device. Please try again.');
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert('Error', 'Failed to connect to the device. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartScanning = () => {
    startBluetoothScanning();
  };

  const handleTurnOnBluetooth = () => {
    setShowBluetoothModal(false);
    setBluetoothEnabled(true);
    // Start scanning again after user enables Bluetooth
    startBluetoothScanning();
  };

  const handleCancelBluetooth = () => {
    setShowBluetoothModal(false);
    setIsScanning(false);
    setShowDeviceList(true);
  };

  const handleSwipeGesture = (event: PanGestureHandlerGestureEvent) => {
    const { translationY, velocityY } = event.nativeEvent;

    // Check if it's a hard swipe DOWN
    if (translationY > 100 && velocityY > 500) {
      // Restart scanning
      startBluetoothScanning();
    }
  };

  const handleTabPress = (key: string) => {
    switch (key) {
      case 'home':
        router.push('/(app)/home');
        break;
      case 'devices':
        router.push('/(HomePage_actions)/MyDevices' as any);
        break;
      case 'energy':
        router.push('/(app)/home');
        break;
      case 'profile':
        setShowProfile(true);
        break;
    }
  };


  const bottomNavItems = [
    { key: 'home', label: 'Home', icon: null },
    { key: 'devices', label: 'Devices', icon: null },
    { key: 'energy', label: 'Energy', icon: null },
    { key: 'profile', label: 'Profile', icon: null },
  ];

  return (
    <SetupScreen
      step={3}
      title="Pair your lock"
      subtitle="Keep your phone close to the lock with Bluetooth on."
      busy={isConnecting}
      refreshControl={<RefreshControl refreshing={false} onRefresh={startBluetoothScanning} tintColor={colors.disabled} />}
      footer={showDeviceList && !isScanning
        ? <AppButton variant="secondaryMedium" title="Scan again" onPress={startBluetoothScanning} disabled={isConnecting} />
        : undefined}
    >
      {isScanning && (
        <View style={[setupStyles.card, styles.state]}>
          <View style={styles.pulse}>
            <BluetoothIcon width={28} height={28} color={colors.completedstep} />
          </View>
          <Typography variant="h3" color={colors.text}>Looking for nearby locks…</Typography>
          <Typography variant="caption" color={colors.disabled} style={styles.center}>
            Make sure the lock is powered on. This takes about 10 seconds.
          </Typography>
          <ActivityIndicator color={colors.navBarBackground} style={styles.spinner} />
        </View>
      )}

      {/* Devices found while scanning show up immediately */}
      {(isScanning || showDeviceList) && scannedDevices.length > 0 && (
        <Typography variant="caption" color={colors.disabled} style={setupStyles.sectionLabel}>
          {scannedDevices.length === 1 ? '1 device found' : `${scannedDevices.length} devices found`}
        </Typography>
      )}

      {scannedDevices.map((device) => {
        const Icon = device.icon;
        const isThis = isConnecting && selectedDevice === device.id;
        const disabled = !device.isConnectable || isConnecting;
        return (
          <View key={device.id} style={[setupStyles.row, disabled && !isThis && styles.dim]}>
            <View style={[setupStyles.iconTile, styles.deviceTile]}>
              <Icon width={24} height={24} color={colors.completedstep} />
            </View>
            <View style={styles.copy}>
              <Typography variant="h3" color={colors.text} numberOfLines={1}>{device.name}</Typography>
            </View>
            <TouchableOpacity
              style={[styles.connect, disabled && styles.connectDisabled]}
              onPress={() => { handleDeviceSelect(device.id); void handleConnect(device.id, device.name); }}
              disabled={disabled}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Connect to ${device.name}`}
            >
              {isThis
                ? <ActivityIndicator size="small" color={colors.text} />
                : <Typography variant="caption" color={colors.text} style={styles.connectText}>Connect</Typography>}
            </TouchableOpacity>
          </View>
        );
      })}

      {showDeviceList && !isScanning && scannedDevices.length === 0 && (
        <View style={[setupStyles.card, styles.state]}>
          <View style={[styles.pulse, styles.emptyIcon]}>
            <Ionicons name="search" size={26} color={colors.disabled} />
          </View>
          <Typography variant="h3" color={colors.text}>No locks found</Typography>
          <Typography variant="caption" color={colors.disabled} style={styles.center}>
            Check that the lock is powered on and within a few metres, then scan again.
          </Typography>
        </View>
      )}

      {/* Bluetooth Permission Sheet */}
      <Modal visible={showBluetoothModal} transparent animationType="slide" onRequestClose={handleCancelBluetooth}>
        <View style={styles.overlay}>
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.handle} />
            <View style={[styles.pulse, styles.sheetIcon]}>
              <BluetoothIcon width={30} height={30} color={colors.completedstep} />
            </View>
            <Typography variant="h2" color={colors.text} style={styles.center}>Turn on Bluetooth</Typography>
            <Typography variant="body" color={colors.disabled} style={styles.center}>
              Bluetooth is needed to pair with your lock. Turn it on in your phone’s settings, then try again.
            </Typography>
            <View style={styles.sheetActions}>
              <AppButton variant="primaryLarge" title="Try again" onPress={handleTurnOnBluetooth} />
              <AppButton variant="secondaryMedium" title="Cancel" onPress={handleCancelBluetooth} />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SetupScreen>
  );
};

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: colors.navBarBackground,
  },
header: {
    backgroundColor: colors.navBarBackground,
    height: 120,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
  },
headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
headerTitle: {
    textAlign: 'left' as const,
    fontSize: 16,
    fontWeight: '600' as const,
  },
stepIndicator: {
    fontSize: 14,
  },
content: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: Spacing.md,
  },
deviceList: {
    gap: Spacing.md,
  },
deviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    borderWidth: 1,
    borderColor: colors.border,
  },
deviceInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: Spacing.md,
  },
deviceDetails: {
    flex: 1,
  },
deviceName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
  },
instructionText: {
    textAlign: 'center' as const,
    marginTop: Spacing.xl,
    fontSize: 14,
    lineHeight: 20,
  },
connectButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minWidth: 60,
  },
connectButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
scanningContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
scanningText: {
    marginTop: Spacing.md,
    fontSize: 16,
    textAlign: 'center' as const,
  },
modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
    alignItems: 'stretch' as const,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
bluetoothModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: Spacing.md,
    paddingTop: Spacing.lg,
    width: '100%' as any,
    alignItems: 'center' as const,
  },
modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    width: '100%' as any,
    marginBottom: Spacing.lg,
  },
modalTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
closeButton: {
    padding: Spacing.xs,
  },
bluetoothIconContainer: {
    marginBottom: Spacing.md,
  },
bluetoothIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
bluetoothTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    marginBottom: Spacing.xs,
    textAlign: 'center' as const,
  },
bluetoothDescription: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center' as const,
    marginBottom: Spacing.lg,
  },
modalButtons: {
    width: '100%' as any,
    gap: Spacing.md,
  },
turnOnButton: {
    backgroundColor: colors.primary.darker,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
turnOnButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
cancelButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
noDevicesContainer: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.md,
  },
noDevicesText: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
rescanButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary.base,
  },
rescanButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
state: { alignItems: 'center', paddingVertical: 32, gap: 8 },
pulse: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DCEBFF', marginBottom: 8 },
emptyIcon: { backgroundColor: colors.iconBackground },
spinner: { marginTop: 12 },
center: { textAlign: 'center' },
copy: { flex: 1, gap: 4 },
dim: { opacity: 0.5 },
deviceTile: { backgroundColor: '#DCEBFF' },
connect: { minWidth: 88, height: 36, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary.base },
connectDisabled: { backgroundColor: colors.primary.lightest },
connectText: { fontFamily: 'InterBold' },
overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.5)' },
sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 16, alignItems: 'center', gap: 10 },
handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 12 },
sheetIcon: { width: 72, height: 72, borderRadius: 36 },
sheetActions: { alignSelf: 'stretch', gap: 10, marginTop: 14 }
});

export default AddDevice4;
