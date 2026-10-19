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
  setDisconnectionCallback,
  stopScan,
  subscribeToNotifications,
  writeAndWaitForStateUpdate,
  writeCharacteristic
} from './bluetoothmanager';
import {
  BleDevice,
  CalibrationProcessState,
  DoorState,
  LockCommand,
  LockingProcessState,
  LockPosition,
  SmartLockState,
  WifiConnectionState
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
  | 'initialStateLoaded'
  | 'error';

export type SmartLockEventCallback = (data: any) => void;

/**
 * SmartLockService - Singleton service for Smart Lock operations
 */
class SmartLockService {
  private static instance: SmartLockService;
  private eventListeners: Map<SmartLockEventType, Set<SmartLockEventCallback>> = new Map();
  private subscriptionIds: string[] = [];
  private hasLockPositionSubscription: boolean = false; // Track if 0xAA01 is subscribed
  private hasBatterySubscription: boolean = false; // Track if 0xCC01 is subscribed
  private currentState: SmartLockState = {
    lockPosition: LockPosition.UNKNOWN,
    doorState: DoorState.UNKNOWN,
    batteryLevel: 0,
    isConnected: false,
    lastUpdated: new Date(),
  };

  private constructor() {
    // Register callback to handle unexpected disconnections from bluetoothmanager
    setDisconnectionCallback(() => {
      console.log('🔔 SmartLockService: Received disconnection notification from BLE layer');
      this.currentState.isConnected = false;
      this.emit('disconnected', {});
    });
  }

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
      
      console.log('📖 Step 1: Reading initial lock state from device...');
      // FIRST: Read initial state from the device (0xAA01, 0xAA02, 0xCC01)
      await this.refreshState();
      
      console.log('🔔 Step 2: Setting up lock position subscription (0xAA01)...');
      // THEN: Setup state subscriptions for real-time updates
      await this.setupStateSubscriptions();
      
      this.currentState.isConnected = true;
      
      // Emit initial state loaded event
      console.log('✅ Connection complete. Initial state:', 
        this.currentState.lockPosition === LockPosition.CLOSED_LOCKED_POSITION ? 'LOCKED' : 'UNLOCKED');
      this.emit('connected', { deviceId });
      this.emit('initialStateLoaded', { state: { ...this.currentState } });
      
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
   * Subscribes to Lock Position (0xAA01) and Battery Level (0xCC01) for real-time updates
   * Process State (0xAA04) is subscribed only when sending lock/unlock commands
   */
  public async setupStateSubscriptions(): Promise<void> {
    try {
      // Check if we already have lock position subscription active
      if (this.hasLockPositionSubscription && this.hasBatterySubscription) {
        console.log('✅ Lock Position and Battery subscriptions already active, skipping setup');
        return;
      }

      // Lock Position notifications (0xAA01) - ALWAYS subscribed for real-time lock state
      if (!this.hasLockPositionSubscription) {
        const lockPosSubId = await subscribeToNotifications(
          FULL_UUIDS.LOCK_CONTROL_SERVICE,
          FULL_UUIDS.LOCK_POSITION,
          (data) => {
            const position = data.length > 0 ? data[0] as LockPosition : LockPosition.UNKNOWN;
            console.log(`🔐 [0xAA01 - LOCK POSITION] notification: ${position} (2=LOCKED, 3=UNLOCKED, 4=JAMMED_LOCKED, 5=JAMMED_UNLOCKED)`);
            this.currentState.lockPosition = position;
            this.currentState.lastUpdated = new Date();
            console.log(`📢 Emitting lockPositionChanged event with position: ${position}`);
            this.emit('lockPositionChanged', { lockPosition: position });
          }
        );
        this.subscriptionIds.push(lockPosSubId);
        this.hasLockPositionSubscription = true;
        console.log('✅ Lock Position subscription setup complete (0xAA01)');
      }

      // Battery Level notifications (0xCC01) - subscribed for real-time battery updates
      if (!this.hasBatterySubscription) {
        const batterySubId = await subscribeToNotifications(
          FULL_UUIDS.BATTERY_SERVICE,
          FULL_UUIDS.BATTERY_LEVEL,
          (data) => {
            const level = data.length > 0 ? data[0] : 0;
            console.log(`🔋 [0xCC01 - BATTERY LEVEL] notification: ${level}% (raw data: [${Array.from(data).join(', ')}])`);
            this.currentState.batteryLevel = level;
            this.currentState.lastUpdated = new Date();
            console.log(`📢 Emitting batteryLevelChanged event with level: ${level}%`);
            this.emit('batteryLevelChanged', { batteryLevel: level });
          }
        );
        this.subscriptionIds.push(batterySubId);
        this.hasBatterySubscription = true;
        console.log('✅ Battery Level subscription setup complete (0xCC01)');
      }

      console.log('ℹ️  Process State (0xAA04) will be subscribed only during lock/unlock operations');
    } catch (error) {
    this.hasBatterySubscription = false; // Reset flag
      console.error('Failed to setup state subscriptions:', error);
    }
  }

  /**
   * Check if lock position subscriptions are active
   */
  public hasActiveSubscriptions(): boolean {
    return this.subscriptionIds.length > 0;
  }

  /**
   * Cleanup all subscriptions
   */
  private async cleanupSubscriptions(): Promise<void> {
    // Just clear the subscription IDs array without calling unsubscribe
    // The disconnect will automatically invalidate all subscriptions
    // Calling .remove() before disconnect causes native crashes
    console.log(`🔕 Clearing ${this.subscriptionIds.length} subscription ID(s)`);
    this.subscriptionIds = [];
    this.hasLockPositionSubscription = false; // Reset flag
  }

  /**
   * Clear calibration subscriptions after calibration completes
   * This allows lock position subscriptions to be set up when navigating to lock screen
   */
  public clearCalibrationSubscriptions(): void {
    console.log(`🔕 Clearing calibration subscriptions (had ${this.subscriptionIds.length})`);
    this.subscriptionIds = [];
  }

  /**
   * Refresh current state from device
   */
  public async refreshState(): Promise<SmartLockState> {
    try {
      console.log('📖 Reading lock position from 0xAA01...');
      // Read lock position
      const lockPosData = await readCharacteristic(
        FULL_UUIDS.LOCK_CONTROL_SERVICE,
        FULL_UUIDS.LOCK_POSITION
      );
      this.currentState.lockPosition = lockPosData.length > 0 
        ? lockPosData[0] as LockPosition 
        : LockPosition.UNKNOWN;
      
      console.log(`✅ Initial lock position: ${this.currentState.lockPosition} (2=LOCKED, 3=UNLOCKED)`);

      console.log('📖 Reading door state from 0xAA02...');
      // Read door state
      const doorStateData = await readCharacteristic(
        FULL_UUIDS.LOCK_CONTROL_SERVICE,
        FULL_UUIDS.DOOR_STATE
      );
      this.currentState.doorState = doorStateData.length > 0 
        ? doorStateData[0] as DoorState 
        : DoorState.UNKNOWN;

      console.log('📖 Reading battery level from 0xCC01...');
      // Read battery level
      const batteryData = await readCharacteristic(
        FULL_UUIDS.BATTERY_SERVICE,
        FULL_UUIDS.BATTERY_LEVEL
      );
      this.currentState.batteryLevel = batteryData.length > 0 ? batteryData[0] : 0;
      console.log(`🔋 Battery level from device: ${this.currentState.batteryLevel}% (raw: [${Array.from(batteryData).join(', ')}])`);

      this.currentState.lastUpdated = new Date();
      this.currentState.isConnected = true;

      console.log(`✅ State refresh complete. Battery: ${this.currentState.batteryLevel}%`);
      
      // Emit initialStateLoaded event so UI can update
      this.emit('initialStateLoaded', { state: { ...this.currentState } });
      
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
   * Send lock command
   * The lock position changes will come via 0xAA01 notifications
   */
  private async sendLockCommand(command: LockCommand): Promise<LockingProcessState> {
    try {
      console.log(`🔒 Sending lock command: ${command === LockCommand.LOCK ? 'LOCK (2)' : 'UNLOCK (3)'}`);
      
      // Send the lock/unlock command to 0xAA03
      await writeCharacteristic(
        FULL_UUIDS.LOCK_CONTROL_SERVICE,
        FULL_UUIDS.LOCK_CONTROL,
        new Uint8Array([command])
      );

      console.log(`✅ Lock command sent to 0xAA03 - waiting for position update from 0xAA01`);
      
      // The actual state change will be detected via lockPositionChanged event from 0xAA01
      // Just return success - the UI will update when it receives the position notification
      return LockingProcessState.SUCCESS;
      
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
      let resolved = false;

      // Safe resolve helper - prevents double resolution
      // NOTE: We do NOT unsubscribe here because react-native-ble-plx has a native bug
      // that crashes when canceling subscriptions. The subscription will be cleaned up
      // when the device disconnects or BLE manager is destroyed.
      const safeResolve = (state: WifiConnectionState) => {
        if (resolved) return;
        resolved = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        console.log('📡 WiFi connection result:', state);
        resolve(state);
      };

      try {
        console.log('📡 Step 1: Subscribing to WiFi state notifications...');
        
        // Subscribe to WiFi connection state notifications FIRST
        const subId = await subscribeToNotifications(
          FULL_UUIDS.CONFIGURATION_SERVICE,
          FULL_UUIDS.WIFI_CONNECTION_STATE,
          (data) => {
            if (resolved) return; // Ignore if already resolved
            
            const state = data.length > 0 ? data[0] as WifiConnectionState : WifiConnectionState.DISCONNECTED;
            console.log('📡 WiFi state notification received:', state, this.getWifiStateName(state));
            
            this.emit('wifiStateChanged', { state });

            // Check for final states
            if (state === WifiConnectionState.SUCCESS) {
              console.log('✅ WiFi connected successfully!');
              safeResolve(WifiConnectionState.SUCCESS);
            } else if (state === WifiConnectionState.FAILED) {
              console.log('❌ WiFi connection failed!');
              safeResolve(WifiConnectionState.FAILED);
            } else if (state === WifiConnectionState.IN_PROGRESS) {
              console.log('⏳ WiFi connection in progress...');
              // Keep waiting for final state
            }
          }
        );
        this.subscriptionIds.push(subId);

        // Set timeout for WiFi connection
        timeoutId = setTimeout(() => {
          console.log('⏰ WiFi connection timeout after', timeout, 'ms');
          safeResolve(WifiConnectionState.FAILED);
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
        this.emit('error', { type: 'wifiCredentials', error });
        safeResolve(WifiConnectionState.FAILED);
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
      let resolved = false;

      // Safe resolve helper - prevents double resolution
      // NOTE: We do NOT unsubscribe here because react-native-ble-plx has a native bug
      // that crashes when canceling subscriptions. The subscription will be cleaned up
      // when the device disconnects or BLE manager is destroyed.
      const safeResolve = (state: WifiConnectionState) => {
        if (resolved) return;
        resolved = true;
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        console.log('📡 Platform connection result:', state);
        resolve(state);
      };

      try {
        // Subscribe to WiFi state changes first
        const subId = await subscribeToNotifications(
          FULL_UUIDS.CONFIGURATION_SERVICE,
          FULL_UUIDS.WIFI_CONNECTION_STATE,
          (data) => {
            if (resolved) return; // Ignore if already resolved
            
            const state = data.length > 0 ? data[0] as WifiConnectionState : WifiConnectionState.DISCONNECTED;
            console.log('📡 WiFi state notification:', state);
            
            this.emit('wifiStateChanged', { state });

            // Check if connected to platform
            if (state === WifiConnectionState.CONNECTED_TO_PLATFORM) {
              safeResolve(WifiConnectionState.CONNECTED_TO_PLATFORM);
            } else if (state === WifiConnectionState.FAILED) {
              safeResolve(WifiConnectionState.FAILED);
            }
          }
        );
        this.subscriptionIds.push(subId);

        // Set timeout
        timeoutId = setTimeout(() => {
          console.log('📡 Platform connection timeout');
          safeResolve(WifiConnectionState.FAILED);
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
        safeResolve(WifiConnectionState.FAILED);
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
   * Step 1: Enter calibration mode and subscribe to state changes
   * Write 1 to 0xDD01 (Calibration Control) to enter calibration mode
   */
  public async enterCalibrationMode(): Promise<boolean> {
    try {
      console.log('📝 Step 1: Entering calibration mode...');
      
      // Subscribe to calibration state (0xDD04) to receive status updates
      const calSubId = await subscribeToNotifications(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.CALIBRATION_PROCESS_STATE,
        (data) => {
          const state = data.length > 0 ? data[0] as CalibrationProcessState : CalibrationProcessState.UNKNOWN;
          console.log('🔔 Calibration state changed:', state);
          this.emit('calibrationStateChanged', { state });
        }
      );
      this.subscriptionIds.push(calSubId);

      // Write 1 to 0xDD01 to enter calibration mode (this kicks off the process)
      console.log('✍️ Writing 1 to 0xDD01 to enter calibration mode...');
      await writeCharacteristic(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.CALIBRATION_CONTROL,
        new Uint8Array([1]) // Enter Calibration = 1
      );

      console.log('✅ Calibration mode entered, subscribed to state updates');
      return true;
    } catch (error) {
      console.error('❌ Failed to enter calibration mode:', error);
      this.emit('error', { type: 'calibration', error });
      return false;
    }
  }

  /**
   * Step 2: Calibrate lock mechanism positions
   * Write to 0xDD02 (Locking Mechanism Calibration Sequence)
   * Values: CLP = 2, CULP = 3, JLP = 4, JULP = 5
   */
  public async calibrateLockPosition(position: 2 | 3 | 4 | 5): Promise<boolean> {
    try {
      const positionNames = { 2: 'CLP (Locked)', 3: 'CULP (Unlocked)', 4: 'JLP (Jammed Locked)', 5: 'JULP (Jammed Unlocked)' };
      console.log(`📝 Calibrating lock position: ${positionNames[position]}`);
      
      await writeCharacteristic(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.LOCKING_MECHANISM_CALIBRATION,
        new Uint8Array([position])
      );
      
      console.log(`✅ Lock position ${positionNames[position]} calibrated`);
      return true;
    } catch (error) {
      console.error('❌ Lock position calibration failed:', error);
      this.emit('error', { type: 'calibration', error });
      return false;
    }
  }

  /**
   * Step 3: Calibrate door sensor positions
   * Write to 0xDD03 (Door Sensor Calibration Sequence)
   * Values: widely open = 2, ajar = 3, closed = 4
   */
  public async calibrateDoorPosition(position: 2 | 3 | 4): Promise<boolean> {
    try {
      const positionNames = { 2: 'Widely Open', 3: 'Ajar', 4: 'Closed' };
      console.log(`📝 Calibrating door position: ${positionNames[position]}`);
      
      await writeCharacteristic(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.DOOR_SENSOR_CALIBRATION,
        new Uint8Array([position])
      );
      
      console.log(`✅ Door position ${positionNames[position]} calibrated`);
      return true;
    } catch (error) {
      console.error('❌ Door position calibration failed:', error);
      this.emit('error', { type: 'calibration', error });
      return false;
    }
  }

  /**
   * Step 4: Wait for calibration process state
   * Subscribe to 0xDD04 (Calibration Process State) and wait for result
   * Success = 2, Failed states = 3-6, In Progress = 7
   * 
   * Returns a promise that resolves when calibration completes or fails
   */
  public async readCalibrationState(): Promise<CalibrationProcessState> {
    try {
      console.log('📖 Reading calibration state from 0xDD04...');
      const stateData = await readCharacteristic(
        FULL_UUIDS.CALIBRATION_SERVICE,
        FULL_UUIDS.CALIBRATION_PROCESS_STATE
      );
      const state = stateData.length > 0 ? stateData[0] as CalibrationProcessState : CalibrationProcessState.UNKNOWN;
      console.log('📊 Current calibration state:', state);
      return state;
    } catch (error) {
      console.error('❌ Failed to read calibration state:', error);
      return CalibrationProcessState.UNKNOWN;
    }
  }

  /**
   * Step 5: Wait for calibration process state via notifications
   * Subscribe to 0xDD04 (Calibration Process State) and wait for result
   * Success = 2, Failed states = 3-6, In Progress = 7
   * 
   * Returns a promise that resolves when calibration completes or fails
   */
  public async waitForCalibrationResult(timeoutMs: number = 60000): Promise<CalibrationProcessState> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Calibration timeout'));
      }, timeoutMs);

      const stateListener = async (data: { state: CalibrationProcessState }) => {
        console.log('🔔 Calibration state update:', data.state);
        
        // Check if calibration completed (success or any failure)
        if (data.state === CalibrationProcessState.SUCCESS) {
          console.log('✅ Calibration completed successfully!');
          cleanup();
          // Trust the notification value - don't read again as state can change quickly
          resolve(CalibrationProcessState.SUCCESS);
        } else if (
          data.state === CalibrationProcessState.FAILED_ENCODER ||
          data.state === CalibrationProcessState.FAILED_DOOR_SENSOR ||
          data.state === CalibrationProcessState.FAILED_TRAIL ||
          data.state === CalibrationProcessState.FAILED_MEMORY
        ) {
          console.log('❌ Calibration failed with state:', data.state);
          cleanup();
          // Trust the notification value for failure as well
          resolve(data.state);
        }
        // If IN_PROGRESS (7), continue waiting
      };

      const cleanup = () => {
        clearTimeout(timeout);
        this.off('calibrationStateChanged', stateListener);
      };

      this.on('calibrationStateChanged', stateListener);
    });
  }

  /**
   * Complete full calibration flow
   * Convenience method that performs all steps
   */
  public async performFullCalibration(
    lockPositions: (2 | 3 | 4 | 5)[],
    doorPositions: (2 | 3 | 4)[]
  ): Promise<CalibrationProcessState> {
    try {
      // Step 1: Enter calibration mode
      const entered = await this.enterCalibrationMode();
      if (!entered) {
        throw new Error('Failed to enter calibration mode');
      }

      // Step 2: Calibrate lock positions
      for (const position of lockPositions) {
        const success = await this.calibrateLockPosition(position);
        if (!success) {
          throw new Error(`Failed to calibrate lock position ${position}`);
        }
        // Small delay between commands
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 3: Calibrate door positions
      for (const position of doorPositions) {
        const success = await this.calibrateDoorPosition(position);
        if (!success) {
          throw new Error(`Failed to calibrate door position ${position}`);
        }
        // Small delay between commands
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Step 4: Wait for result
      console.log('⏳ Waiting for calibration to complete...');
      const result = await this.waitForCalibrationResult(60000);
      
      return result;
    } catch (error) {
      console.error('❌ Calibration flow failed:', error);
      this.emit('error', { type: 'calibration', error });
      return CalibrationProcessState.FAILED;
    }
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
