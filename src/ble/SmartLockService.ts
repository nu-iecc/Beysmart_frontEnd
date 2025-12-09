/**
 * SmartLockService - High-level API for Smart Lock operations
 * 
 * Provides a clean, typed interface for all Smart Lock functionality.
 * Uses BluetoothManager for low-level BLE operations.
 */

import { FULL_UUIDS } from './bleConfig';
import {
  connectToDevice,
  disconnectFromDevice,
  getDiscoveredDevices,
  isConnected,
  readCharacteristic,
  scanForDevices,
  stopScan,
  subscribeToNotifications,
  unsubscribeFromNotifications,
  writeAndWaitForStateUpdate,
  writeCharacteristic
} from './bluetoothmanager';
import {
  BleDevice,
  CalibrationProcessState,
  CalibrationStep,
  DoorState,
  LockCommand,
  LockingProcessState,
  LockPosition,
  SmartLockState,
  WifiConnectionState,
} from './types';

/**
 * Event types for SmartLockService
 */
export type SmartLockEventType = 
  | 'lockPositionChanged'
  | 'doorStateChanged'
  | 'lockingProcessStateChanged'
  | 'batteryLevelChanged'
  | 'wifiStateChanged'
  | 'calibrationStateChanged'
  | 'connected'
  | 'disconnected'
  | 'error';

export type SmartLockEventCallback = (data: any) => void;

/**
 * SmartLockService - Singleton service for Smart Lock operations
 */
class SmartLockService {
  private static instance: SmartLockService;
  private eventListeners: Map<SmartLockEventType, Set<SmartLockEventCallback>> = new Map();
  private subscriptionIds: string[] = [];
  private currentState: SmartLockState = {
    lockPosition: LockPosition.UNKNOWN,
    doorState: DoorState.UNKNOWN,
    batteryLevel: 0,
    isConnected: false,
    lastUpdated: new Date(),
  };

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SmartLockService {
    if (!SmartLockService.instance) {
      SmartLockService.instance = new SmartLockService();
    }
    return SmartLockService.instance;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Add event listener
   */
  public on(event: SmartLockEventType, callback: SmartLockEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Remove event listener
   */
  public off(event: SmartLockEventType, callback: SmartLockEventCallback): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: SmartLockEventType, data: any): void {
    this.eventListeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  /**
   * Scan for Smart Lock devices
   */
  public async scanForLocks(
    onDeviceFound: (device: BleDevice) => void,
    timeout: number = 30000
  ): Promise<void> {
    await scanForDevices(onDeviceFound, timeout, 'Smart');
  }

  /**
   * Stop scanning
   */
  public async stopScanning(): Promise<void> {
    await stopScan();
  }

  /**
   * Connect to a Smart Lock device
   */
  public async connect(deviceId: string): Promise<boolean> {
    try {
      await connectToDevice(deviceId);
      
      // Setup state subscriptions
      await this.setupStateSubscriptions();
      
      // Read initial state
      await this.refreshState();
      
      this.currentState.isConnected = true;
      this.emit('connected', { deviceId });
      
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      this.emit('error', { type: 'connection', error });
      return false;
    }
  }

  /**
   * Disconnect from current device
   */
  public async disconnect(): Promise<void> {
    try {
      // Cleanup subscriptions
      await this.cleanupSubscriptions();
      
      await disconnectFromDevice();
      
      this.currentState.isConnected = false;
      this.emit('disconnected', {});
    } catch (error) {
      console.error('Disconnect failed:', error);
      this.emit('error', { type: 'disconnect', error });
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return isConnected();
  }

  /**
   * Get discovered devices
   */
  public getDiscoveredDevices(): BleDevice[] {
    return getDiscoveredDevices();
  }

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Setup subscriptions for state changes
   */
  private async setupStateSubscriptions(): Promise<void> {
    try {
      // Lock Position notifications
      const lockPosSubId = await subscribeToNotifications(
        FULL_UUIDS.LOCK_CONTROL_SERVICE,
        FULL_UUIDS.LOCK_POSITION,
        (data) => {
          const position = data.length > 0 ? data[0] as LockPosition : LockPosition.UNKNOWN;
          this.currentState.lockPosition = position;
          this.currentState.lastUpdated = new Date();
          this.emit('lockPositionChanged', { lockPosition: position });
        }
      );
      this.subscriptionIds.push(lockPosSubId);

      // Locking Process State notifications
      const lockProcessSubId = await subscribeToNotifications(
        FULL_UUIDS.LOCK_CONTROL_SERVICE,
        FULL_UUIDS.LOCKING_PROCESS_STATE,
        (data) => {
          const state = data.length > 0 ? data[0] as LockingProcessState : LockingProcessState.UNKNOWN;
          this.emit('lockingProcessStateChanged', { state });
        }
      );
      this.subscriptionIds.push(lockProcessSubId);

      console.log('✅ State subscriptions setup complete');
    } catch (error) {
      console.error('Failed to setup state subscriptions:', error);
    }
  }

  /**
   * Cleanup all subscriptions
   */
  private async cleanupSubscriptions(): Promise<void> {
    for (const subId of this.subscriptionIds) {
      try {
        await unsubscribeFromNotifications(subId);
      } catch (error) {
        console.error(`Failed to unsubscribe ${subId}:`, error);
      }
    }
    this.subscriptionIds = [];
  }

  /**
   * Refresh current state from device
   */
  public async refreshState(): Promise<SmartLockState> {
    try {
      // Read lock position
      const lockPosData = await readCharacteristic(
        FULL_UUIDS.LOCK_CONTROL_SERVICE,
        FULL_UUIDS.LOCK_POSITION
      );
      this.currentState.lockPosition = lockPosData.length > 0 
        ? lockPosData[0] as LockPosition 
        : LockPosition.UNKNOWN;

      // Read door state
      const doorStateData = await readCharacteristic(
        FULL_UUIDS.LOCK_CONTROL_SERVICE,
        FULL_UUIDS.DOOR_STATE
      );
      this.currentState.doorState = doorStateData.length > 0 
        ? doorStateData[0] as DoorState 
        : DoorState.UNKNOWN;

      // Read battery level
      const batteryData = await readCharacteristic(
        FULL_UUIDS.BATTERY_SERVICE,
        FULL_UUIDS.BATTERY_LEVEL
      );
      this.currentState.batteryLevel = batteryData.length > 0 ? batteryData[0] : 0;

      this.currentState.lastUpdated = new Date();
      this.currentState.isConnected = true;

      return { ...this.currentState };
    } catch (error) {
      console.error('Failed to refresh state:', error);
      this.emit('error', { type: 'refresh', error });
      throw error;
    }
  }

  /**
   * Get current state (cached)
   */
  public getState(): SmartLockState {
    return { ...this.currentState };
  }

  // ============================================================================
  // Lock Control Operations
  // ============================================================================

  /**
   * Lock the door
   */
  public async lock(): Promise<LockingProcessState> {
    return this.sendLockCommand(LockCommand.LOCK);
  }

  /**
   * Unlock the door
   */
  public async unlock(): Promise<LockingProcessState> {
    return this.sendLockCommand(LockCommand.UNLOCK);
  }

  /**
   * Send lock command and wait for result
   */
  private async sendLockCommand(command: LockCommand): Promise<LockingProcessState> {
    try {
      const response = await writeAndWaitForStateUpdate(
        FULL_UUIDS.LOCK_CONTROL_SERVICE,
        FULL_UUIDS.LOCK_CONTROL,
        FULL_UUIDS.LOCK_CONTROL_SERVICE,
        FULL_UUIDS.LOCKING_PROCESS_STATE,
        new Uint8Array([command]),
        LockingProcessState.SUCCESS,
        15000
      );

      const result = response.length > 0 
        ? response[0] as LockingProcessState 
        : LockingProcessState.UNKNOWN;

      // Refresh state after command
      await this.refreshState();

      return result;
    } catch (error) {
      console.error('Lock command failed:', error);
      this.emit('error', { type: 'lockCommand', error });
      return LockingProcessState.FAILED;
    }
  }

  /**
   * Get lock position name
   */
  public getLockPositionName(position: LockPosition): string {
    switch (position) {
      case LockPosition.CLOSED_LOCKED_POSITION: return 'Locked';
      case LockPosition.CLOSED_UNLOCKED_POSITION: return 'Unlocked';
      case LockPosition.JAMMED_LOCKED_POSITION: return 'Jammed (Locked)';
      case LockPosition.JAMMED_UNLOCKED_POSITION: return 'Jammed (Unlocked)';
      default: return 'Unknown';
    }
  }

  /**
   * Check if lock is in locked state
   */
  public isLocked(): boolean {
    return this.currentState.lockPosition === LockPosition.CLOSED_LOCKED_POSITION;
  }

  /**
   * Check if lock is jammed
   */
  public isJammed(): boolean {
    return this.currentState.lockPosition === LockPosition.JAMMED_LOCKED_POSITION ||
           this.currentState.lockPosition === LockPosition.JAMMED_UNLOCKED_POSITION;
  }

  // ============================================================================
  // Configuration Operations
  // ============================================================================

  /**
   * Configure door sensor sensitivity
   */
  public async configureDoorSensor(enabled: boolean): Promise<void> {
    await writeCharacteristic(
      FULL_UUIDS.CONFIGURATION_SERVICE,
      FULL_UUIDS.DOOR_SENSOR_CONFIGURATION,
      new Uint8Array([enabled ? 1 : 0])
    );
  }

  /**
   * Configure unlatch mode
   */
  public async configureUnlatchMode(enabled: boolean): Promise<void> {
    await writeCharacteristic(
      FULL_UUIDS.CONFIGURATION_SERVICE,
      FULL_UUIDS.UNLATCH_CONFIGURATION,
      new Uint8Array([enabled ? 1 : 0])
    );
  }

  /**
   * Set device name
   */
  public async setDeviceName(name: string): Promise<void> {
    await writeCharacteristic(
      FULL_UUIDS.CONFIGURATION_SERVICE,
      FULL_UUIDS.DEVICE_NAME,
      new TextEncoder().encode(name)
    );
  }

  /**
   * Get device name
   */
  public async getDeviceName(): Promise<string> {
    const data = await readCharacteristic(
      FULL_UUIDS.CONFIGURATION_SERVICE,
      FULL_UUIDS.DEVICE_NAME
    );
    return new TextDecoder().decode(data);
  }

  // ============================================================================
  // WiFi Configuration - Step by Step Flow
  // ============================================================================

  /**
   * STEP 1: Send WiFi credentials and wait for connection result via notification
   * The WIFI_CONNECTION_STATE (0xBB07) characteristic has notify functionality.
   * 
   * Flow:
   * 1. Subscribe to WIFI_CONNECTION_STATE notifications
   * 2. Write SSID to 0xBB05
   * 3. Write Password to 0xBB06
   * 4. Trigger connection via 0xBB04
   * 5. Wait for notification: SUCCESS (2), FAILED (3), or timeout
   * 
   * @param ssid - WiFi network SSID
   * @param password - WiFi network password
   * @param timeout - How long to wait for WiFi connection (default 30 seconds)
   * @returns WifiConnectionState - SUCCESS (2) or FAILED (3)
   */
  public async sendWifiCredentials(
    ssid: string,
    password: string,
    timeout: number = 30000
  ): Promise<WifiConnectionState> {
    return new Promise(async (resolve) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let subId: string | null = null;

      try {
        console.log('📡 Step 1: Subscribing to WiFi state notifications...');
        
        // Subscribe to WiFi connection state notifications FIRST
        subId = await subscribeToNotifications(
          FULL_UUIDS.CONFIGURATION_SERVICE,
          FULL_UUIDS.WIFI_CONNECTION_STATE,
          async (data) => {
            const state = data.length > 0 ? data[0] as WifiConnectionState : WifiConnectionState.DISCONNECTED;
            console.log('📡 WiFi state notification received:', state, this.getWifiStateName(state));
            
            this.emit('wifiStateChanged', { state });

            // Check for final states
            if (state === WifiConnectionState.SUCCESS) {
              console.log('✅ WiFi connected successfully!');
              if (timeoutId) clearTimeout(timeoutId);
              if (subId) {
                await unsubscribeFromNotifications(subId);
                subId = null;
              }
              resolve(WifiConnectionState.SUCCESS);
            } else if (state === WifiConnectionState.FAILED) {
              console.log('❌ WiFi connection failed!');
              if (timeoutId) clearTimeout(timeoutId);
              if (subId) {
                await unsubscribeFromNotifications(subId);
                subId = null;
              }
              resolve(WifiConnectionState.FAILED);
            } else if (state === WifiConnectionState.IN_PROGRESS) {
              console.log('⏳ WiFi connection in progress...');
              // Keep waiting for final state
            }
          }
        );
        this.subscriptionIds.push(subId);

        // Set timeout for WiFi connection
        timeoutId = setTimeout(async () => {
          console.log('⏰ WiFi connection timeout after', timeout, 'ms');
          if (subId) {
            await unsubscribeFromNotifications(subId);
            subId = null;
          }
          resolve(WifiConnectionState.FAILED);
        }, timeout);

        // Now write the credentials
        console.log('📡 Writing WiFi SSID:', ssid);
        await writeCharacteristic(
          FULL_UUIDS.CONFIGURATION_SERVICE,
          FULL_UUIDS.WIFI_SSID,
          new TextEncoder().encode(ssid)
        );

        console.log('📡 Writing WiFi Password...');
        await writeCharacteristic(
          FULL_UUIDS.CONFIGURATION_SERVICE,
          FULL_UUIDS.WIFI_PASSWORD,
          new TextEncoder().encode(password)
        );

        console.log('📡 Triggering WiFi connection...');
        await writeCharacteristic(
          FULL_UUIDS.CONFIGURATION_SERVICE,
          FULL_UUIDS.WIFI_CONFIGURATION,
          new Uint8Array([1]) // Enable/Connect command
        );

        console.log('⏳ Waiting for WiFi connection notification...');
        
      } catch (error: any) {
        console.error('❌ WiFi credentials send error:', error);
        if (timeoutId) clearTimeout(timeoutId);
        if (subId) {
          await unsubscribeFromNotifications(subId);
          subId = null;
        }
        this.emit('error', { type: 'wifiCredentials', error });
        resolve(WifiConnectionState.FAILED);
      }
    });
  }

  /**
   * Get human-readable WiFi state name
   */
  public getWifiStateName(state: WifiConnectionState): string {
    switch (state) {
      case WifiConnectionState.DISCONNECTED: return 'Disconnected';
      case WifiConnectionState.SUCCESS: return 'Connected to WiFi';
      case WifiConnectionState.FAILED: return 'Connection Failed';
      case WifiConnectionState.IN_PROGRESS: return 'Connecting...';
      case WifiConnectionState.CONNECTED_TO_PLATFORM: return 'Connected to Platform';
      default: return `Unknown (${state})`;
    }
  }

  /**
   * STEP 2: Send platform token after creating device on ThingsBoard
   * Call this after device is connected to WiFi and you have the token
   * 
   * @returns WifiConnectionState - CONNECTED_TO_PLATFORM (5) means success
   */
  public async sendPlatformToken(token: string): Promise<WifiConnectionState> {
    try {
      console.log('📡 Step 2: Writing Platform Token...');
      await writeCharacteristic(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_TOKEN,
        new TextEncoder().encode(token)
      );

      console.log('📡 Token sent, waiting for platform connection...');
      
      // Wait for device to connect to platform
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const state = await this.getWifiState();
      console.log('📡 Connection state after token:', state);
      
      return state;
    } catch (error) {
      console.error('Platform token failed:', error);
      this.emit('error', { type: 'platformToken', error });
      return WifiConnectionState.FAILED;
    }
  }

  /**
   * STEP 2 (Alternative): Send token and wait for notification
   * Use this for reliable confirmation that device connected to platform
   * 
   * @returns WifiConnectionState - waits until CONNECTED_TO_PLATFORM or timeout
   */
  public async sendPlatformTokenAndWait(
    token: string,
    timeout: number = 30000
  ): Promise<WifiConnectionState> {
    return new Promise(async (resolve) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let subId: string | null = null;

      try {
        // Subscribe to WiFi state changes first
        subId = await subscribeToNotifications(
          FULL_UUIDS.CONFIGURATION_SERVICE,
          FULL_UUIDS.WIFI_CONNECTION_STATE,
          async (data) => {
            const state = data.length > 0 ? data[0] as WifiConnectionState : WifiConnectionState.DISCONNECTED;
            console.log('📡 WiFi state notification:', state);
            
            this.emit('wifiStateChanged', { state });

            // Check if connected to platform
            if (state === WifiConnectionState.CONNECTED_TO_PLATFORM) {
              if (timeoutId) clearTimeout(timeoutId);
              if (subId) await unsubscribeFromNotifications(subId);
              resolve(WifiConnectionState.CONNECTED_TO_PLATFORM);
            } else if (state === WifiConnectionState.FAILED) {
              if (timeoutId) clearTimeout(timeoutId);
              if (subId) await unsubscribeFromNotifications(subId);
              resolve(WifiConnectionState.FAILED);
            }
          }
        );
        this.subscriptionIds.push(subId);

        // Set timeout
        timeoutId = setTimeout(async () => {
          console.log('📡 Platform connection timeout');
          if (subId) await unsubscribeFromNotifications(subId);
          resolve(WifiConnectionState.FAILED);
        }, timeout);

        // Write the token
        console.log('📡 Step 2: Writing Platform Token...');
        await writeCharacteristic(
          FULL_UUIDS.CONFIGURATION_SERVICE,
          FULL_UUIDS.WIFI_TOKEN,
          new TextEncoder().encode(token)
        );

      } catch (error) {
        console.error('Platform token with notification failed:', error);
        if (timeoutId) clearTimeout(timeoutId);
        if (subId) await unsubscribeFromNotifications(subId);
        resolve(WifiConnectionState.FAILED);
      }
    });
  }

  /**
   * Full setup flow helper - combines all steps
   * 1. Send WiFi credentials
   * 2. Wait for callback to create device and get token
   * 3. Send token
   * 4. Wait for platform connection
   * 5. Return ready for calibration
   */
  public async setupDeviceWithCallback(
    ssid: string,
    password: string,
    onWifiConnected: () => Promise<string>, // Callback to create device and return token
    timeout: number = 60000
  ): Promise<{ success: boolean; state: WifiConnectionState; error?: string }> {
    try {
      // Step 1: Send WiFi credentials
      console.log('🚀 Setup Step 1: Sending WiFi credentials...');
      const wifiState = await this.sendWifiCredentials(ssid, password);
      
      if (wifiState === WifiConnectionState.FAILED) {
        return { success: false, state: wifiState, error: 'Failed to connect to WiFi' };
      }

      // Step 2: Call the callback to create device and get token
      console.log('🚀 Setup Step 2: Creating device on platform...');
      const token = await onWifiConnected();
      
      if (!token) {
        return { success: false, state: WifiConnectionState.FAILED, error: 'Failed to get platform token' };
      }

      // Step 3: Send token and wait for platform connection
      console.log('🚀 Setup Step 3: Sending token and waiting for platform...');
      const finalState = await this.sendPlatformTokenAndWait(token, timeout);

      if (finalState === WifiConnectionState.CONNECTED_TO_PLATFORM) {
        console.log('✅ Device fully connected! Ready for calibration.');
        return { success: true, state: finalState };
      } else {
        return { success: false, state: finalState, error: 'Failed to connect to platform' };
      }
    } catch (error: any) {
      console.error('Setup failed:', error);
      return { success: false, state: WifiConnectionState.FAILED, error: error.message };
    }
  }

  /**
   * Legacy method - Configure WiFi with token in one call
   * Use sendWifiCredentials + sendPlatformToken for the new flow
   */
  public async configureWifi(
    ssid: string,
    password: string,
    token: string
  ): Promise<WifiConnectionState> {
    try {
      console.log('📡 Writing WiFi SSID...');
      await writeCharacteristic(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_SSID,
        new TextEncoder().encode(ssid)
      );

      console.log('📡 Writing WiFi Password...');
      await writeCharacteristic(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_PASSWORD,
        new TextEncoder().encode(password)
      );

      console.log('📡 Writing Platform Token...');
      await writeCharacteristic(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_TOKEN,
        new TextEncoder().encode(token)
      );

      console.log('📡 Triggering WiFi connection...');
      await writeCharacteristic(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_CONFIGURATION,
        new Uint8Array([1])
      );

      await new Promise(resolve => setTimeout(resolve, 2000));
      
      try {
        const state = await this.getWifiState();
        console.log('📡 WiFi connection state:', state);
        return state;
      } catch (readError) {
        console.log('📡 Could not read WiFi state, assuming success');
        return WifiConnectionState.IN_PROGRESS;
      }
    } catch (error) {
      console.error('WiFi configuration failed:', error);
      this.emit('error', { type: 'wifiConfig', error });
      return WifiConnectionState.FAILED;
    }
  }

  /**
   * Configure WiFi with notification-based response
   * Use this if your device supports notifications on WiFi state changes
   */
  public async configureWifiWithNotification(
    ssid: string,
    password: string,
    token: string,
    timeout: number = 30000
  ): Promise<WifiConnectionState> {
    try {
      // Write credentials first
      await writeCharacteristic(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_SSID,
        new TextEncoder().encode(ssid)
      );

      await writeCharacteristic(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_PASSWORD,
        new TextEncoder().encode(password)
      );

      await writeCharacteristic(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_TOKEN,
        new TextEncoder().encode(token)
      );

      // Subscribe to WiFi state changes
      const wifiSubId = await subscribeToNotifications(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_CONNECTION_STATE,
        (data) => {
          const state = data.length > 0 ? data[0] as WifiConnectionState : WifiConnectionState.DISCONNECTED;
          this.emit('wifiStateChanged', { state });
        }
      );
      this.subscriptionIds.push(wifiSubId);

      // Trigger connection and wait for state update
      const response = await writeAndWaitForStateUpdate(
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_CONFIGURATION,
        FULL_UUIDS.CONFIGURATION_SERVICE,
        FULL_UUIDS.WIFI_CONNECTION_STATE,
        new Uint8Array([1]), // Connect command
        undefined,
        timeout
      );

      return response.length > 0 ? response[0] as WifiConnectionState : WifiConnectionState.DISCONNECTED;
    } catch (error) {
      console.error('WiFi configuration with notification failed:', error);
      this.emit('error', { type: 'wifiConfig', error });
      return WifiConnectionState.FAILED;
    }
  }

  /**
   * Get WiFi connection state
   */
  public async getWifiState(): Promise<WifiConnectionState> {
    const data = await readCharacteristic(
      FULL_UUIDS.CONFIGURATION_SERVICE,
      FULL_UUIDS.WIFI_CONNECTION_STATE
    );
    return data.length > 0 ? data[0] as WifiConnectionState : WifiConnectionState.DISCONNECTED;
  }

  // ============================================================================
  // Calibration Operations
  // ============================================================================

  /**
   * Start calibration process
   */
  public async startCalibration(): Promise<boolean> {
    try {
      // Subscribe to calibration state
      const calSubId = await subscribeToNotifications(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.CALIBRATION_PROCESS_STATE,
        (data) => {
          const state = data.length > 0 ? data[0] as CalibrationProcessState : CalibrationProcessState.UNKNOWN;
          this.emit('calibrationStateChanged', { state });
        }
      );
      this.subscriptionIds.push(calSubId);

      // Start calibration
      await writeCharacteristic(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.CALIBRATION_CONTROL,
        new Uint8Array([CalibrationStep.START])
      );

      return true;
    } catch (error) {
      console.error('Calibration start failed:', error);
      this.emit('error', { type: 'calibration', error });
      return false;
    }
  }

  /**
   * Set lock mechanism calibration (closed position)
   */
  public async calibrateLockMechanism(): Promise<boolean> {
    try {
      await writeCharacteristic(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.LOCK_MECHANISM_CALIBRATION,
        new Uint8Array([CalibrationStep.SET_CLOSED_POSITION])
      );
      return true;
    } catch (error) {
      console.error('Lock mechanism calibration failed:', error);
      return false;
    }
  }

  /**
   * Set door sensor calibration
   */
  public async calibrateDoorSensor(): Promise<boolean> {
    try {
      await writeCharacteristic(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.DOOR_SENSOR_CALIBRATION,
        new Uint8Array([CalibrationStep.SET_DOOR_SENSOR])
      );
      return true;
    } catch (error) {
      console.error('Door sensor calibration failed:', error);
      return false;
    }
  }

  /**
   * Complete calibration
   */
  public async completeCalibration(): Promise<CalibrationProcessState> {
    try {
      const response = await writeAndWaitForStateUpdate(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.CALIBRATION_CONTROL,
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.CALIBRATION_PROCESS_STATE,
        new Uint8Array([CalibrationStep.COMPLETE]),
        CalibrationProcessState.SUCCESS,
        10000
      );

      return response.length > 0 ? response[0] as CalibrationProcessState : CalibrationProcessState.UNKNOWN;
    } catch (error) {
      console.error('Calibration complete failed:', error);
      return CalibrationProcessState.FAILED;
    }
  }

  /**
   * Cancel calibration
   */
  public async cancelCalibration(): Promise<void> {
    await writeCharacteristic(
      FULL_UUIDS.CALIBRATION_SERVICE,
      FULL_UUIDS.CALIBRATION_CONTROL,
      new Uint8Array([CalibrationStep.CANCEL])
    );
  }

  // ============================================================================
  // Battery Operations
  // ============================================================================

  /**
   * Get battery level
   */
  public async getBatteryLevel(): Promise<number> {
    const data = await readCharacteristic(
      FULL_UUIDS.BATTERY_SERVICE,
      FULL_UUIDS.BATTERY_LEVEL
    );
    this.currentState.batteryLevel = data.length > 0 ? data[0] : 0;
    return this.currentState.batteryLevel;
  }

  /**
   * Get battery status text
   */
  public getBatteryStatus(): string {
    const level = this.currentState.batteryLevel;
    if (level > 75) return 'Excellent';
    if (level > 50) return 'Good';
    if (level > 25) return 'Low';
    if (level > 10) return 'Very Low';
    return 'Critical';
  }
}

// Export singleton instance
export const smartLockService = SmartLockService.getInstance();
export default smartLockService;
