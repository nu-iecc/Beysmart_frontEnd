/**
 * BLE Types and Interfaces
 * 
 * This file contains all TypeScript types for BLE communication
 * with the Smart Lock device.
 */

// ============================================================================
// Device Types
// ============================================================================

export interface BleDevice {
  id: string;
  name: string;
  rssi: number;
  isConnectable?: boolean;
  serviceUUIDs?: string[];
  advertising?: BleAdvertisingData;
}

export interface BleAdvertisingData {
  localName?: string;
  serviceUUIDs?: string[];
  manufacturerData?: string;
}

// ============================================================================
// Lock Control Service (0xAAAA)
// ============================================================================

export enum LockPosition {
  UNKNOWN = 0,
  CLP = 2,   // Closed Lock Position (Locked)
  CULP = 3,  // Closed Unlatch Position (Unlocked)
  JLP = 4,   // Jammed Lock Position
  JULP = 5,  // Jammed Unlatch Position
  // Aliases for readability
  CLOSED_LOCKED_POSITION = 2,
  CLOSED_UNLOCKED_POSITION = 3,
  JAMMED_LOCKED_POSITION = 4,
  JAMMED_UNLOCKED_POSITION = 5,
}

export enum DoorState {
  UNKNOWN = 0,
  OPEN = 2,
  CLOSED = 3,
}

export enum LockCommand {
  LOCK = 2,
  UNLOCK = 3,
}

export enum LockingProcessState {
  UNKNOWN = 0,
  SUCCESS = 2,
  FAILED = 3,
  IN_PROGRESS = 4,
}

// ============================================================================
// Configuration Service (0xBBBB)
// ============================================================================

export enum DoorSensorConfig {
  DISABLED = 0,
  ENABLED = 1,
}

export enum UnlatchConfig {
  DISABLED = 0,
  ENABLED = 1,
}

export type UnlatchTime = 5 | 8 | 10 | 20 | 30;

export enum WifiConfig {
  DISABLED = 0,
  ENABLED = 1,
}

export enum WifiConnectionState {
  DISCONNECTED = 0,
  SUCCESS = 2,
  FAILED = 3,
  IN_PROGRESS = 4,
  CONNECTED_TO_PLATFORM = 5,
}

// ============================================================================
// Battery Service (0xCCCC)
// ============================================================================

export type BatteryLevel = number; // 0-100%

// ============================================================================
// Calibration Service (0xDDDD)
// ============================================================================

export enum CalibrationCommand {
  ENTER_CALIBRATION = 1,
}

export enum CalibrationLockPosition {
  CLP = 2,   // Closed Lock Position
  CULP = 3,  // Closed Unlatch Position
  JLP = 4,   // Jammed Lock Position
  JULP = 5,  // Jammed Unlatch Position
}

export enum CalibrationDoorPosition {
  WIDELY_OPEN = 2,
  AJAR = 3,
  CLOSED = 4,
}

export enum CalibrationProcessState {
  UNKNOWN = 0,
  SUCCESS = 2,
  FAILED_ENCODER = 3,
  FAILED_DOOR_SENSOR = 4,
  FAILED_TRAIL = 5,
  FAILED_MEMORY = 6,
  IN_PROGRESS = 7,
  // Alias
  FAILED = 3,
}

export enum CalibrationStep {
  START = 1,
  SET_CLOSED_POSITION = 2,
  SET_OPEN_POSITION = 3,
  SET_DOOR_SENSOR = 4,
  COMPLETE = 5,
  CANCEL = 6,
}

// ============================================================================
// Characteristic Property Types
// ============================================================================

export type CharacteristicProperty = 'read' | 'write' | 'notify' | 'read-notify' | 'write-notify';

export interface CharacteristicConfig {
  uuid: string;
  name: string;
  property: CharacteristicProperty;
  description: string;
  options?: Record<string, number | string>;
}

export interface ServiceConfig {
  uuid: string;
  name: string;
  characteristics: Record<string, CharacteristicConfig>;
}

export interface BleServicesConfig {
  services: Record<string, ServiceConfig>;
}

// ============================================================================
// Notification Callback Types
// ============================================================================

export type NotificationCallback<T> = (value: T) => void;

export interface NotificationSubscription {
  characteristicUUID: string;
  remove: () => void;
}

// ============================================================================
// Smart Lock State
// ============================================================================

export interface SmartLockState {
  lockPosition: LockPosition | null;
  doorState: DoorState | null;
  lockingProcessState?: LockingProcessState | null;
  wifiConnectionState?: WifiConnectionState | null;
  calibrationState?: CalibrationProcessState | null;
  batteryLevel: number;
  isConnected: boolean;
  lastUpdated?: Date;
}

// ============================================================================
// Command Response Types
// ============================================================================

export interface CommandResult {
  success: boolean;
  error?: string;
}

export interface ReadResult<T> {
  success: boolean;
  value?: T;
  error?: string;
}
