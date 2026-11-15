/**
 * Smart Lock BLE Services Configuration
 * 
 * This file contains all BLE service and characteristic UUIDs
 * for the Smart Lock device. Update these values if the device
 * firmware changes.
 * 
 * UUID Format: Full 128-bit UUID is constructed as:
 * 0000XXXX-0000-1000-8000-00805f9b34fb
 * where XXXX is the 16-bit short UUID
 */

import { BleServicesConfig } from './types';

// Helper function to convert short UUID to full 128-bit UUID
export const toFullUUID = (shortUUID: string): string => {
  // Remove 0x prefix if present and ensure uppercase
  const cleanUUID = shortUUID.replace(/^0x/i, '').toUpperCase();
  return `0000${cleanUUID}-0000-1000-8000-00805F9B34FB`.toLowerCase();
};

// Short UUIDs for easy reference
export const SHORT_UUIDS = {
  // Services
  LOCK_CONTROL_SERVICE: '0xAAAA',
  CONFIGURATION_SERVICE: '0xBBBB',
  BATTERY_SERVICE: '0xCCCC',
  CALIBRATION_SERVICE: '0xDDDD',
  
  // Lock Control Characteristics
  LOCK_POSITION: '0xAA01',
  DOOR_STATE: '0xAA02',
  LOCK_CONTROL: '0xAA03',
  LOCKING_PROCESS_STATE: '0xAA04',
  
  // Configuration Characteristics
  DOOR_SENSOR_CONFIG: '0xBB01',
  UNLATCH_CONFIG: '0xBB02',
  UNLATCH_TIME: '0xBB03',
  WIFI_CONFIG: '0xBB04',
  WIFI_SSID: '0xBB05',
  WIFI_PASSWORD: '0xBB06',
  WIFI_CONNECTION_STATE: '0xBB07',
  PLATFORM_TOKEN: '0xBB08',
  BLE_DEVICE_NAME: '0xBB09',
  
  // Battery Characteristics
  BATTERY_LEVEL: '0xCC01',
  
  // Calibration Characteristics
  CALIBRATION_CONTROL: '0xDD01',
  LOCKING_MECHANISM_CALIBRATION: '0xDD02',
  DOOR_SENSOR_CALIBRATION: '0xDD03',
  CALIBRATION_PROCESS_STATE: '0xDD04',
} as const;

// Full 128-bit UUIDs
export const FULL_UUIDS = {
  // Services
  LOCK_CONTROL_SERVICE: toFullUUID(SHORT_UUIDS.LOCK_CONTROL_SERVICE),
  CONFIGURATION_SERVICE: toFullUUID(SHORT_UUIDS.CONFIGURATION_SERVICE),
  BATTERY_SERVICE: toFullUUID(SHORT_UUIDS.BATTERY_SERVICE),
  CALIBRATION_SERVICE: toFullUUID(SHORT_UUIDS.CALIBRATION_SERVICE),
  
  // Lock Control Characteristics
  LOCK_POSITION: toFullUUID(SHORT_UUIDS.LOCK_POSITION),
  DOOR_STATE: toFullUUID(SHORT_UUIDS.DOOR_STATE),
  LOCK_CONTROL: toFullUUID(SHORT_UUIDS.LOCK_CONTROL),
  LOCKING_PROCESS_STATE: toFullUUID(SHORT_UUIDS.LOCKING_PROCESS_STATE),
  
  // Configuration Characteristics
  DOOR_SENSOR_CONFIG: toFullUUID(SHORT_UUIDS.DOOR_SENSOR_CONFIG),
  DOOR_SENSOR_CONFIGURATION: toFullUUID(SHORT_UUIDS.DOOR_SENSOR_CONFIG), // Alias
  UNLATCH_CONFIG: toFullUUID(SHORT_UUIDS.UNLATCH_CONFIG),
  UNLATCH_CONFIGURATION: toFullUUID(SHORT_UUIDS.UNLATCH_CONFIG), // Alias
  UNLATCH_TIME: toFullUUID(SHORT_UUIDS.UNLATCH_TIME),
  WIFI_CONFIG: toFullUUID(SHORT_UUIDS.WIFI_CONFIG),
  WIFI_CONFIGURATION: toFullUUID(SHORT_UUIDS.WIFI_CONFIG), // Alias
  WIFI_SSID: toFullUUID(SHORT_UUIDS.WIFI_SSID),
  WIFI_PASSWORD: toFullUUID(SHORT_UUIDS.WIFI_PASSWORD),
  WIFI_CONNECTION_STATE: toFullUUID(SHORT_UUIDS.WIFI_CONNECTION_STATE),
  PLATFORM_TOKEN: toFullUUID(SHORT_UUIDS.PLATFORM_TOKEN),
  WIFI_TOKEN: toFullUUID(SHORT_UUIDS.PLATFORM_TOKEN), // Alias
  BLE_DEVICE_NAME: toFullUUID(SHORT_UUIDS.BLE_DEVICE_NAME),
  DEVICE_NAME: toFullUUID(SHORT_UUIDS.BLE_DEVICE_NAME), // Alias
  
  // Battery Characteristics
  BATTERY_LEVEL: toFullUUID(SHORT_UUIDS.BATTERY_LEVEL),
  
  // Calibration Characteristics
  CALIBRATION_CONTROL: toFullUUID(SHORT_UUIDS.CALIBRATION_CONTROL),
  LOCKING_MECHANISM_CALIBRATION: toFullUUID(SHORT_UUIDS.LOCKING_MECHANISM_CALIBRATION),
  LOCK_MECHANISM_CALIBRATION: toFullUUID(SHORT_UUIDS.LOCKING_MECHANISM_CALIBRATION), // Alias
  DOOR_SENSOR_CALIBRATION: toFullUUID(SHORT_UUIDS.DOOR_SENSOR_CALIBRATION),
  CALIBRATION_PROCESS_STATE: toFullUUID(SHORT_UUIDS.CALIBRATION_PROCESS_STATE),
} as const;

// Complete BLE Services Configuration
export const BLE_SERVICES_CONFIG: BleServicesConfig = {
  services: {
    lockControl: {
      uuid: FULL_UUIDS.LOCK_CONTROL_SERVICE,
      name: 'Lock Control Service',
      characteristics: {
        lockPosition: {
          uuid: FULL_UUIDS.LOCK_POSITION,
          name: 'Lock Position',
          property: 'read-notify',
          description: 'Current state of the lock',
          options: {
            'CLP': 2,
            'CULP': 3,
            'JLP': 4,
            'JULP': 5,
          },
        },
        doorState: {
          uuid: FULL_UUIDS.DOOR_STATE,
          name: 'Door State',
          property: 'read',
          description: 'Status of the door sensor',
          options: {
            'Door is open': 2,
            'Door is closed': 3,
          },
        },
        lockControl: {
          uuid: FULL_UUIDS.LOCK_CONTROL,
          name: 'Lock Control',
          property: 'write',
          description: 'Send commands to lock or unlock',
          options: {
            'Lock': 2,
            'Unlock': 3,
          },
        },
        lockingProcessState: {
          uuid: FULL_UUIDS.LOCKING_PROCESS_STATE,
          name: 'Locking Process State',
          property: 'read-notify',
          description: 'State of the locking process after command',
          options: {
            'Locking Success': 2,
            'Locking Failed': 3,
            'Locking in Progress': 4,
          },
        },
      },
    },
    configuration: {
      uuid: FULL_UUIDS.CONFIGURATION_SERVICE,
      name: 'Configuration Service',
      characteristics: {
        doorSensorConfig: {
          uuid: FULL_UUIDS.DOOR_SENSOR_CONFIG,
          name: 'Door Sensor Configuration',
          property: 'write',
          description: 'Configure the door sensor',
          options: {
            'Use Door Sensor': 1,
            'Do not use Door Sensor': 0,
          },
        },
        unlatchConfig: {
          uuid: FULL_UUIDS.UNLATCH_CONFIG,
          name: 'Unlatch Configuration',
          property: 'write',
          description: 'Configure the unlatch',
          options: {
            'Activate Latching': 1,
            'Do not activate Latch': 0,
          },
        },
        unlatchTime: {
          uuid: FULL_UUIDS.UNLATCH_TIME,
          name: 'Unlatch Time',
          property: 'write',
          description: 'Configure the unlatch time in seconds',
          options: {
            '5 seconds': 5,
            '8 seconds': 8,
            '10 seconds': 10,
            '20 seconds': 20,
            '30 seconds': 30,
          },
        },
        wifiConfig: {
          uuid: FULL_UUIDS.WIFI_CONFIG,
          name: 'Wifi Configuration',
          property: 'write',
          description: 'Enable or disable wifi',
          options: {
            'Activate Wifi': 1,
            'Do not activate Wifi': 0,
          },
        },
        wifiSsid: {
          uuid: FULL_UUIDS.WIFI_SSID,
          name: 'Wifi SSID',
          property: 'write',
          description: 'Write the wifi SSID',
        },
        wifiPassword: {
          uuid: FULL_UUIDS.WIFI_PASSWORD,
          name: 'Wifi Password',
          property: 'write',
          description: 'Write the wifi password',
        },
        wifiConnectionState: {
          uuid: FULL_UUIDS.WIFI_CONNECTION_STATE,
          name: 'Wifi Connection State',
          property: 'read-notify',
          description: 'Check the state of Wifi',
          options: {
            'Wifi Connection Success': 2,
            'Wifi Connection Failed': 3,
            'Wifi Connection in Progress': 4,
            'Connected to Platform': 5,
          },
        },
        platformToken: {
          uuid: FULL_UUIDS.PLATFORM_TOKEN,
          name: 'Platform Token',
          property: 'write',
          description: 'Write the platform token',
        },
        bleDeviceName: {
          uuid: FULL_UUIDS.BLE_DEVICE_NAME,
          name: 'BLE Device Name',
          property: 'write',
          description: 'Write the BLE device name',
        },
      },
    },
    battery: {
      uuid: FULL_UUIDS.BATTERY_SERVICE,
      name: 'Battery Service',
      characteristics: {
        batteryLevel: {
          uuid: FULL_UUIDS.BATTERY_LEVEL,
          name: 'Battery Level',
          property: 'read',
          description: 'Current battery level of the smart lock',
          options: {
            'range': '0-100%',
          },
        },
      },
    },
    calibration: {
      uuid: FULL_UUIDS.CALIBRATION_SERVICE,
      name: 'Calibration Service',
      characteristics: {
        calibrationControl: {
          uuid: FULL_UUIDS.CALIBRATION_CONTROL,
          name: 'Calibration Control',
          property: 'write',
          description: 'Initiate the calibration process',
          options: {
            'Enter Calibration': 1,
          },
        },
        lockingMechanismCalibration: {
          uuid: FULL_UUIDS.LOCKING_MECHANISM_CALIBRATION,
          name: 'Locking Mechanism Calibration Sequence',
          property: 'write',
          description: 'Control locking mechanism calibration for lock positions',
          options: {
            'CLP': 2,
            'CULP': 3,
            'JLP': 4,
            'JULP': 5,
          },
        },
        doorSensorCalibration: {
          uuid: FULL_UUIDS.DOOR_SENSOR_CALIBRATION,
          name: 'Door Sensor Calibration Sequence',
          property: 'write',
          description: 'Control door sensor calibration for door positions',
          options: {
            'Door is widely open': 2,
            'Door is ajar': 3,
            'Door is closed': 4,
          },
        },
        calibrationProcessState: {
          uuid: FULL_UUIDS.CALIBRATION_PROCESS_STATE,
          name: 'Calibration Process State',
          property: 'read-notify',
          description: 'Current state of the calibration process',
          options: {
            'Calibration Success': 2,
            'Calibration Failed Encoder': 3,
            'Calibration Failed Door Sensor': 4,
            'Calibration Failed Trail': 5,
            'Calibration Failed Memory': 6,
            'Calibration in Progress': 7,
          },
        },
      },
    },
  },
};

// Export individual service configs for convenience
export const LOCK_CONTROL_SERVICE = BLE_SERVICES_CONFIG.services.lockControl;
export const CONFIGURATION_SERVICE = BLE_SERVICES_CONFIG.services.configuration;
export const BATTERY_SERVICE = BLE_SERVICES_CONFIG.services.battery;
export const CALIBRATION_SERVICE = BLE_SERVICES_CONFIG.services.calibration;
