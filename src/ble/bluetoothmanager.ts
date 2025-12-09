/**
 * BluetoothManager - Enhanced BLE Manager with Notification Support
 * 
 * Uses react-native-ble-plx for reliable BLE communication.
 * Implements proper notification handling for Smart Lock devices.
 */

import { Buffer } from 'buffer';
import { Permission, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { FULL_UUIDS, toFullUUID } from './bleConfig';
import { BleDevice, DoorState, LockPosition, SmartLockState, WifiConnectionState } from './types';

// Singleton BLE Manager instance
let bleManagerInstance: BleManager | null = null;

const getBleManager = (): BleManager => {
  if (!bleManagerInstance) {
    bleManagerInstance = new BleManager();
  }
  return bleManagerInstance;
};

// Store discovered devices
const discoveredDevices: Map<string, BleDevice> = new Map();

// Store active notification subscriptions
const activeSubscriptions: Map<string, Subscription> = new Map();

// Connected device reference
let connectedDevice: Device | null = null;

// Scan subscription reference
let scanSubscription: Subscription | null = null;

/**
 * Request Bluetooth permissions for Android
 */
export const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  try {
    const apiLevel = Platform.Version;
    console.log(`📱 Android API Level: ${apiLevel}`);

    if (apiLevel >= 31) {
      // Android 12+ (API 31+)
      const permissions: Permission[] = [
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      console.log('📋 Permissions (API >= 31):', results);

      const allGranted = Object.values(results).every(
        (result) => result === PermissionsAndroid.RESULTS.GRANTED
      );

      if (!allGranted) {
        console.warn('⚠️ Not all Bluetooth permissions granted');
      }

      return allGranted;
    } else {
      // Android 11 and below
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'This app needs location access to scan for Bluetooth devices.',
          buttonPositive: 'OK',
          buttonNegative: 'Cancel',
        }
      );

      console.log('📋 Location permission:', granted);
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  } catch (error) {
    console.error('❌ Permission request error:', error);
    return false;
  }
};

/**
 * Check if Bluetooth is enabled
 */
export const isBluetoothEnabled = async (): Promise<boolean> => {
  try {
    const manager = getBleManager();
    const state = await manager.state();
    console.log(`🔵 Current Bluetooth state: ${state}`);
    return state === 'PoweredOn';
  } catch (error) {
    console.error('❌ Error checking Bluetooth state:', error);
    return false;
  }
};

/**
 * Enable Bluetooth (Android only)
 */
export const enableBluetooth = async (): Promise<boolean> => {
  try {
    const manager = getBleManager();
    
    // Wait for state to be ready
    return new Promise((resolve) => {
      const subscription = manager.onStateChange((state) => {
        console.log(`🔵 Bluetooth state changed: ${state}`);
        if (state === 'PoweredOn') {
          subscription.remove();
          resolve(true);
        }
      }, true);

      // Timeout after 10 seconds
      setTimeout(() => {
        subscription.remove();
        resolve(false);
      }, 10000);
    });
  } catch (error) {
    console.error('❌ Error enabling Bluetooth:', error);
    return false;
  }
};

/**
 * Scan for BLE devices
 * @param onDeviceFound Callback when a device is found
 * @param timeout Scan timeout in milliseconds (default: 30000)
 * @param nameFilter Optional filter to only return devices with matching name prefix
 */
export const scanForDevices = async (
  onDeviceFound: (device: BleDevice) => void,
  timeout: number = 30000,
  nameFilter: string = 'Smart'
): Promise<void> => {
  const manager = getBleManager();
  
  // Clear previous discoveries
  discoveredDevices.clear();

  // Request permissions first
  const hasPermissions = await requestBluetoothPermissions();
  if (!hasPermissions) {
    console.error('❌ Bluetooth permissions not granted');
    throw new Error('Bluetooth permissions required');
  }

  // Check if Bluetooth is enabled
  const btEnabled = await isBluetoothEnabled();
  console.log(`🔵 Bluetooth enabled: ${btEnabled}`);
  
  if (!btEnabled) {
    console.log('🔄 Attempting to enable Bluetooth...');
    const enabled = await enableBluetooth();
    if (!enabled) {
      console.error('❌ Failed to enable Bluetooth');
      throw new Error('Bluetooth is not enabled');
    }
  }

  // Stop any existing scan
  await stopScan();

  return new Promise((resolve, reject) => {
    console.log('🔍 Starting BLE scan with react-native-ble-plx...');

    try {
      manager.startDeviceScan(
        null, // No service UUID filter
        {
          allowDuplicates: false,
          scanMode: 2, // Low latency
          callbackType: 1, // All matches
        },
        (error, device) => {
          if (error) {
            console.error('❌ Scan error:', error);
            return;
          }

          if (device) {
            const bleDevice: BleDevice = {
              id: device.id,
              name: device.name || 'Unknown',
              rssi: device.rssi || -100,
              isConnectable: device.isConnectable ?? false,
              serviceUUIDs: device.serviceUUIDs || undefined,
            };

            console.log(`📡 BLE Device Found:`, JSON.stringify(bleDevice));

            // Filter by name if specified
            if (nameFilter && device.name?.toLowerCase().includes(nameFilter.toLowerCase())) {
              console.log(`✅ Smart device detected: ${device.name}`);
              
              if (!discoveredDevices.has(device.id)) {
                discoveredDevices.set(device.id, bleDevice);
                console.log(`Found device: ${bleDevice.name} ${bleDevice.id}`);
                onDeviceFound(bleDevice);
              }
            }
          }
        }
      );

      console.log('✅ BLE scan started successfully');

      // Set timeout for scan
      setTimeout(async () => {
        console.log('⏰ Scan timeout reached, stopping scan...');
        await stopScan();
        console.log(`🛑 BLE scan stopped. Found ${discoveredDevices.size} devices`);
        resolve();
      }, timeout);

    } catch (err) {
      console.error('❌ Failed to start scan:', err);
      reject(err);
    }
  });
};

/**
 * Stop BLE scanning
 */
export const stopScan = async (): Promise<void> => {
  try {
    const manager = getBleManager();
    manager.stopDeviceScan();
    
    if (scanSubscription) {
      scanSubscription.remove();
      scanSubscription = null;
    }
  } catch (error) {
    console.error('❌ Error stopping scan:', error);
  }
};

/**
 * Connect to a BLE device
 * @param deviceId The device ID to connect to
 */
export const connectToDevice = async (deviceId: string): Promise<Device> => {
  const manager = getBleManager();
  
  console.log(`🔗 Connecting to device: ${deviceId}`);

  try {
    // Stop scanning before connecting
    await stopScan();

    // Connect to device with timeout
    const device = await manager.connectToDevice(deviceId, {
      timeout: 10000,
      autoConnect: false,
    });

    console.log(`✅ Connected to: ${device.name || deviceId}`);

    // Discover all services and characteristics
    await device.discoverAllServicesAndCharacteristics();
    console.log('📋 Services and characteristics discovered');

    connectedDevice = device;

    // Setup disconnection listener
    device.onDisconnected((error, disconnectedDevice) => {
      console.log(`🔌 Disconnected from: ${disconnectedDevice?.name || deviceId}`);
      if (error) {
        console.error('Disconnect error:', error);
      }
      connectedDevice = null;
      // Clean up all subscriptions
      cleanupAllSubscriptions();
    });

    return device;
  } catch (error) {
    console.error(`❌ Connection error:`, error);
    throw error;
  }
};

/**
 * Disconnect from current device
 */
export const disconnectFromDevice = async (): Promise<void> => {
  if (connectedDevice) {
    try {
      await connectedDevice.cancelConnection();
      console.log('✅ Disconnected successfully');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    } finally {
      connectedDevice = null;
      cleanupAllSubscriptions();
    }
  }
};

/**
 * Read a characteristic value
 * @param serviceUUID The service UUID (16-bit or full)
 * @param characteristicUUID The characteristic UUID (16-bit or full)
 */
export const readCharacteristic = async (
  serviceUUID: string,
  characteristicUUID: string
): Promise<Uint8Array> => {
  if (!connectedDevice) {
    throw new Error('Not connected to a device');
  }

  const fullServiceUUID = serviceUUID.length === 4 || serviceUUID.length === 6 
    ? toFullUUID(serviceUUID) 
    : serviceUUID;
    
  const fullCharUUID = characteristicUUID.length === 4 || characteristicUUID.length === 6
    ? toFullUUID(characteristicUUID)
    : characteristicUUID;

  console.log(`📖 Reading characteristic: ${fullCharUUID} from service: ${fullServiceUUID}`);

  try {
    const characteristic = await connectedDevice.readCharacteristicForService(
      fullServiceUUID,
      fullCharUUID
    );

    if (characteristic.value) {
      const data = Buffer.from(characteristic.value, 'base64');
      console.log(`📖 Read value:`, Array.from(data));
      return new Uint8Array(data);
    }

    return new Uint8Array();
  } catch (error) {
    console.error(`❌ Read error:`, error);
    throw error;
  }
};

/**
 * Write a characteristic value
 * @param serviceUUID The service UUID (16-bit or full)
 * @param characteristicUUID The characteristic UUID (16-bit or full)
 * @param data The data to write
 * @param withResponse Whether to use write with response (default: true)
 */
export const writeCharacteristic = async (
  serviceUUID: string,
  characteristicUUID: string,
  data: Uint8Array,
  withResponse: boolean = true
): Promise<void> => {
  if (!connectedDevice) {
    throw new Error('Not connected to a device');
  }

  const fullServiceUUID = serviceUUID.length === 4 || serviceUUID.length === 6
    ? toFullUUID(serviceUUID)
    : serviceUUID;
    
  const fullCharUUID = characteristicUUID.length === 4 || characteristicUUID.length === 6
    ? toFullUUID(characteristicUUID)
    : characteristicUUID;

  const base64Value = Buffer.from(data).toString('base64');

  console.log(`✏️ Writing to characteristic: ${fullCharUUID}, data:`, Array.from(data));

  try {
    if (withResponse) {
      await connectedDevice.writeCharacteristicWithResponseForService(
        fullServiceUUID,
        fullCharUUID,
        base64Value
      );
    } else {
      await connectedDevice.writeCharacteristicWithoutResponseForService(
        fullServiceUUID,
        fullCharUUID,
        base64Value
      );
    }
    console.log(`✅ Write successful`);
  } catch (error) {
    console.error(`❌ Write error:`, error);
    throw error;
  }
};

/**
 * Subscribe to notifications for a characteristic
 * @param serviceUUID The service UUID (16-bit or full)
 * @param characteristicUUID The characteristic UUID (16-bit or full)
 * @param onNotification Callback when notification is received
 * @returns Subscription ID for unsubscribing
 */
export const subscribeToNotifications = async (
  serviceUUID: string,
  characteristicUUID: string,
  onNotification: (data: Uint8Array) => void
): Promise<string> => {
  if (!connectedDevice) {
    throw new Error('Not connected to a device');
  }

  const fullServiceUUID = serviceUUID.length === 4 || serviceUUID.length === 6
    ? toFullUUID(serviceUUID)
    : serviceUUID;
    
  const fullCharUUID = characteristicUUID.length === 4 || characteristicUUID.length === 6
    ? toFullUUID(characteristicUUID)
    : characteristicUUID;

  const subscriptionId = `${fullServiceUUID}:${fullCharUUID}`;

  // Unsubscribe if already subscribed
  await unsubscribeFromNotifications(subscriptionId);

  console.log(`🔔 Subscribing to notifications: ${fullCharUUID}`);

  try {
    const subscription = connectedDevice.monitorCharacteristicForService(
      fullServiceUUID,
      fullCharUUID,
      (error, characteristic) => {
        if (error) {
          console.error(`❌ Notification error:`, error);
          return;
        }

        if (characteristic?.value) {
          const data = Buffer.from(characteristic.value, 'base64');
          console.log(`🔔 Notification received:`, Array.from(data));
          onNotification(new Uint8Array(data));
        }
      }
    );

    activeSubscriptions.set(subscriptionId, subscription);
    console.log(`✅ Subscribed to notifications: ${subscriptionId}`);

    return subscriptionId;
  } catch (error) {
    console.error(`❌ Subscribe error:`, error);
    throw error;
  }
};

/**
 * Unsubscribe from notifications
 * @param subscriptionId The subscription ID returned from subscribeToNotifications
 */
export const unsubscribeFromNotifications = async (subscriptionId: string): Promise<void> => {
  const subscription = activeSubscriptions.get(subscriptionId);
  if (subscription) {
    subscription.remove();
    activeSubscriptions.delete(subscriptionId);
    console.log(`🔕 Unsubscribed from: ${subscriptionId}`);
  }
};

/**
 * Cleanup all active subscriptions
 */
const cleanupAllSubscriptions = (): void => {
  activeSubscriptions.forEach((subscription, id) => {
    subscription.remove();
    console.log(`🔕 Cleaned up subscription: ${id}`);
  });
  activeSubscriptions.clear();
};

/**
 * Write to a characteristic and wait for a notification response
 * @param serviceUUID The service UUID for writing
 * @param writeCharUUID The characteristic UUID to write to
 * @param notifyServiceUUID The service UUID for notification (usually same as write service)
 * @param notifyCharUUID The characteristic UUID to receive notification from
 * @param data The data to write
 * @param timeout Timeout in milliseconds (default: 10000)
 */
export const writeAndWaitForNotification = async (
  serviceUUID: string,
  writeCharUUID: string,
  notifyServiceUUID: string,
  notifyCharUUID: string,
  data: Uint8Array,
  timeout: number = 10000
): Promise<Uint8Array> => {
  return new Promise(async (resolve, reject) => {
    let subscriptionId: string | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      // Subscribe to notifications first
      subscriptionId = await subscribeToNotifications(
        notifyServiceUUID,
        notifyCharUUID,
        async (response) => {
          // Clear timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          // Unsubscribe
          if (subscriptionId) {
            await unsubscribeFromNotifications(subscriptionId);
          }

          resolve(response);
        }
      );

      // Set timeout
      timeoutId = setTimeout(async () => {
        if (subscriptionId) {
          await unsubscribeFromNotifications(subscriptionId);
        }
        reject(new Error(`Notification timeout after ${timeout}ms`));
      }, timeout);

      // Write data
      await writeCharacteristic(serviceUUID, writeCharUUID, data);

    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (subscriptionId) {
        await unsubscribeFromNotifications(subscriptionId);
      }
      reject(error);
    }
  });
};

/**
 * Write to a characteristic and wait for notification on a state characteristic
 * Useful for lock control operations that update state via notification
 */
export const writeAndWaitForStateUpdate = async (
  writeServiceUUID: string,
  writeCharUUID: string,
  stateServiceUUID: string,
  stateCharUUID: string,
  command: Uint8Array,
  expectedValue?: number,
  timeout: number = 15000
): Promise<Uint8Array> => {
  return new Promise(async (resolve, reject) => {
    let subscriptionId: string | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      subscriptionId = await subscribeToNotifications(
        stateServiceUUID,
        stateCharUUID,
        async (response) => {
          // If expected value specified, check if it matches
          if (expectedValue !== undefined) {
            if (response.length > 0 && response[0] === expectedValue) {
              if (timeoutId) clearTimeout(timeoutId);
              if (subscriptionId) await unsubscribeFromNotifications(subscriptionId);
              resolve(response);
            }
            // Continue waiting if not matching
          } else {
            // No expected value, resolve immediately
            if (timeoutId) clearTimeout(timeoutId);
            if (subscriptionId) await unsubscribeFromNotifications(subscriptionId);
            resolve(response);
          }
        }
      );

      timeoutId = setTimeout(async () => {
        if (subscriptionId) await unsubscribeFromNotifications(subscriptionId);
        reject(new Error(`State update timeout after ${timeout}ms`));
      }, timeout);

      await writeCharacteristic(writeServiceUUID, writeCharUUID, command);

    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
      if (subscriptionId) await unsubscribeFromNotifications(subscriptionId);
      reject(error);
    }
  });
};

// ============================================================================
// Smart Lock Specific Operations
// ============================================================================

/**
 * Read the current lock position
 */
export const readLockPosition = async (): Promise<LockPosition> => {
  const data = await readCharacteristic(
    FULL_UUIDS.LOCK_CONTROL_SERVICE,
    FULL_UUIDS.LOCK_POSITION
  );
  return data.length > 0 ? data[0] as LockPosition : LockPosition.UNKNOWN;
};

/**
 * Read the current door state
 */
export const readDoorState = async (): Promise<DoorState> => {
  const data = await readCharacteristic(
    FULL_UUIDS.LOCK_CONTROL_SERVICE,
    FULL_UUIDS.DOOR_STATE
  );
  return data.length > 0 ? data[0] as DoorState : DoorState.UNKNOWN;
};

/**
 * Read battery level (0-100)
 */
export const readBatteryLevel = async (): Promise<number> => {
  const data = await readCharacteristic(
    FULL_UUIDS.BATTERY_SERVICE,
    FULL_UUIDS.BATTERY_LEVEL
  );
  return data.length > 0 ? data[0] : 0;
};

/**
 * Send lock command and wait for result
 * @param lock true to lock, false to unlock
 */
export const sendLockCommand = async (lock: boolean): Promise<boolean> => {
  const command = new Uint8Array([lock ? 2 : 3]); // 2 = Lock, 3 = Unlock

  try {
    const response = await writeAndWaitForStateUpdate(
      FULL_UUIDS.LOCK_CONTROL_SERVICE,
      FULL_UUIDS.LOCK_CONTROL,
      FULL_UUIDS.LOCK_CONTROL_SERVICE,
      FULL_UUIDS.LOCKING_PROCESS_STATE,
      command,
      2, // Expected: Success = 2
      15000
    );

    return response.length > 0 && response[0] === 2; // Success
  } catch (error) {
    console.error('Lock command failed:', error);
    return false;
  }
};

/**
 * Configure WiFi credentials
 */
export const configureWifi = async (
  ssid: string,
  password: string,
  token: string
): Promise<WifiConnectionState> => {
  // Write SSID
  await writeCharacteristic(
    FULL_UUIDS.CONFIGURATION_SERVICE,
    FULL_UUIDS.WIFI_SSID,
    new TextEncoder().encode(ssid)
  );

  // Write Password
  await writeCharacteristic(
    FULL_UUIDS.CONFIGURATION_SERVICE,
    FULL_UUIDS.WIFI_PASSWORD,
    new TextEncoder().encode(password)
  );

  // Write Token
  await writeCharacteristic(
    FULL_UUIDS.CONFIGURATION_SERVICE,
    FULL_UUIDS.WIFI_TOKEN,
    new TextEncoder().encode(token)
  );

  // Trigger connection and wait for result
  const response = await writeAndWaitForStateUpdate(
    FULL_UUIDS.CONFIGURATION_SERVICE,
    FULL_UUIDS.WIFI_CONFIGURATION,
    FULL_UUIDS.CONFIGURATION_SERVICE,
    FULL_UUIDS.WIFI_CONNECTION_STATE,
    new Uint8Array([1]), // Connect command
    undefined, // Accept any state
    30000 // 30 second timeout for WiFi
  );

  return response.length > 0 ? response[0] as WifiConnectionState : WifiConnectionState.DISCONNECTED;
};

/**
 * Start calibration process
 */
export const startCalibration = async (): Promise<boolean> => {
  try {
    // Subscribe to calibration process state
    const subscriptionId = await subscribeToNotifications(
      FULL_UUIDS.CALIBRATION_SERVICE,
      FULL_UUIDS.CALIBRATION_PROCESS_STATE,
      (data) => {
        console.log('Calibration state update:', data[0]);
      }
    );

    // Start calibration
    await writeCharacteristic(
      FULL_UUIDS.CALIBRATION_SERVICE,
      FULL_UUIDS.CALIBRATION_CONTROL,
      new Uint8Array([1]) // Start
    );

    return true;
  } catch (error) {
    console.error('Calibration start failed:', error);
    return false;
  }
};

/**
 * Read full smart lock state
 */
export const readSmartLockState = async (): Promise<SmartLockState> => {
  const [lockPosition, doorState, batteryLevel] = await Promise.all([
    readLockPosition(),
    readDoorState(),
    readBatteryLevel(),
  ]);

  return {
    lockPosition,
    doorState,
    batteryLevel,
    isConnected: connectedDevice !== null,
    lastUpdated: new Date(),
  };
};

/**
 * Subscribe to lock state changes
 */
export const subscribeToLockState = async (
  onStateChange: (state: Partial<SmartLockState>) => void
): Promise<string[]> => {
  const subscriptionIds: string[] = [];

  // Subscribe to lock position
  const lockPosSubId = await subscribeToNotifications(
    FULL_UUIDS.LOCK_CONTROL_SERVICE,
    FULL_UUIDS.LOCK_POSITION,
    (data) => {
      onStateChange({
        lockPosition: data.length > 0 ? data[0] as LockPosition : LockPosition.UNKNOWN,
        lastUpdated: new Date(),
      });
    }
  );
  subscriptionIds.push(lockPosSubId);

  // Subscribe to locking process state
  const lockProcessSubId = await subscribeToNotifications(
    FULL_UUIDS.LOCK_CONTROL_SERVICE,
    FULL_UUIDS.LOCKING_PROCESS_STATE,
    (data) => {
      console.log('Locking process state:', data[0]);
    }
  );
  subscriptionIds.push(lockProcessSubId);

  return subscriptionIds;
};

/**
 * Get discovered devices
 */
export const getDiscoveredDevices = (): BleDevice[] => {
  return Array.from(discoveredDevices.values());
};

/**
 * Check if currently connected
 */
export const isConnected = (): boolean => {
  return connectedDevice !== null;
};

/**
 * Get connected device
 */
export const getConnectedDevice = (): Device | null => {
  return connectedDevice;
};

/**
 * Destroy BLE Manager instance (cleanup)
 */
export const destroyBleManager = (): void => {
  cleanupAllSubscriptions();
  
  if (bleManagerInstance) {
    bleManagerInstance.destroy();
    bleManagerInstance = null;
  }
  
  connectedDevice = null;
  discoveredDevices.clear();
  
  console.log('🗑️ BLE Manager destroyed');
};

// Export default object for convenience
export default {
  requestBluetoothPermissions,
  isBluetoothEnabled,
  enableBluetooth,
  scanForDevices,
  stopScan,
  connectToDevice,
  disconnectFromDevice,
  readCharacteristic,
  writeCharacteristic,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  writeAndWaitForNotification,
  writeAndWaitForStateUpdate,
  readLockPosition,
  readDoorState,
  readBatteryLevel,
  sendLockCommand,
  configureWifi,
  startCalibration,
  readSmartLockState,
  subscribeToLockState,
  getDiscoveredDevices,
  isConnected,
  getConnectedDevice,
  destroyBleManager,
};
