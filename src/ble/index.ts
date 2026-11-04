/**
 * BLE Module Index
 * 
 * Central export point for all BLE-related functionality.
 * 
 * Metro config (metro.config.js) handles BLE mocking:
 * - DISABLE_BLE=true → This file gets redirected to mockBluetoothManager (Expo Go)
 * - DISABLE_BLE=false → This file exports the real bluetoothmanager (EAS builds)
 */

// Types
export * from './types';

// Configuration
export { BLE_SERVICES_CONFIG, FULL_UUIDS, SHORT_UUIDS, toFullUUID } from './bleConfig';

// Low-level Bluetooth Manager (default export for backward compatibility)
export { default } from './bluetoothmanager';

// Named exports from Bluetooth Manager
export {
    configureWifi, connectToDevice, destroyBleManager, disconnectFromDevice, enableBluetooth, getConnectedDevice, getDiscoveredDevices, isBluetoothEnabled, isConnected, readBatteryLevel, readCharacteristic, readDoorState, readLockPosition, readSmartLockState, requestBluetoothPermissions, scanForDevices, sendLockCommand, startCalibration, stopScan, subscribeToLockState, subscribeToNotifications,
    unsubscribeFromNotifications,
    writeAndWaitForNotification,
    writeAndWaitForStateUpdate, writeCharacteristic
} from './bluetoothmanager';

// High-level Smart Lock Service
export { smartLockService } from './SmartLockService';

