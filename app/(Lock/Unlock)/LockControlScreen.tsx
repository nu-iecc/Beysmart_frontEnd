import { getMediaUrl } from '@/constants/api';
import { colors } from '@/design-system/colors/colors';
import { BackArrow } from '@/design-system/icons';
// Import icons that work from barrel
import {
    BluetoothIcon,
    Door,
    Invite,
    SettingsIcon,
} from '@/design-system/icons/filled';
// Import icons directly that don't work from barrel
import ActivityLog from '@/design-system/icons/filled/ActivityLog';
import Battery from '@/design-system/icons/filled/Battery';
import Locked from '@/design-system/icons/filled/Locked';
import OpenedDoor from '@/design-system/icons/filled/OpenedDoor';
import Unlocked from '@/design-system/icons/filled/Unlocked';
import Wifi from '@/design-system/icons/filled/Wifi';
import { Spacing } from '@/design-system/Layout/spacing';
import {
    LockAnimationConstants,
    LockColors,
    LockControlConstants,
    LockDimensions,
} from '@/design-system/Lock/Constants';
import { BottomNavigation } from '@/design-system/Navigation/BottomNavigation';
import { Typography } from '@/design-system/typography/typography';
import { LockingProcessState, LockPosition, smartLockService } from '@/src/ble';
import { isBluetoothEnabled } from '@/src/ble/bluetoothmanager';
import apiClient from '@/utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Easing,
    Linking,
    Modal,
    PermissionsAndroid,
    Platform,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

// Animated Circle component for the progress ring
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface UserData {
  first_name?: string;
  profile_picture?: string;
}

const LockControlScreen: React.FC = () => {
  const params = useLocalSearchParams();
  // Device name and home name from navigation params (from database)
  const deviceName = params.deviceName as string;
  const homeName = params.homeName as string;
  const deviceId = params.deviceId as string;
  const bleDeviceId = params.bleDeviceId as string; // BLE MAC address for direct connection

  // State
  const [isLocked, setIsLocked] = useState<boolean | null>(null); // null = not loaded yet
  const [isConnected, setIsConnected] = useState<boolean>(smartLockService.isConnected());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isDoorClosed, setIsDoorClosed] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [deviceBleId, setDeviceBleId] = useState<string | null>(bleDeviceId || null); // Store BLE ID from DB

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Refs
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLockedRef = useRef<boolean | null>(null);
  const isMountedGlobal = useRef(true); // Global mounted flag to prevent state updates after unmount
  
  // Track pending lock action for activity logging
  // We only log success when lockPositionChanged confirms the actual state change
  const pendingActionRef = useRef<{ action: 'lock' | 'unlock'; preActionLocked: boolean } | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // Helper function to log lock/unlock activities to backend
  const logLockActivity = useCallback(async (
    action: 'lock' | 'unlock' | 'log_failed_attempt',
    accessMethod: string = 'bluetooth',
    description?: string
  ) => {
    if (!deviceId) {
      console.warn('⚠️ Cannot log activity: no deviceId');
      return;
    }

    try {
      const endpoint = `home/devices/${deviceId}/${action}/`;
      const body = {
        access_method: accessMethod,
        ...(description && { description }),
      };
      
      console.log(`📝 Logging ${action} activity to backend...`, body);
      const response = await apiClient.post(endpoint, body);
      console.log(`✅ Activity logged:`, response.data);
    } catch (error: any) {
      console.error(`❌ Failed to log ${action} activity:`, error.message);
    }
  }, [deviceId]);

  // Circle calculations
  const circleSize = LockAnimationConstants.OUTER_CIRCLE_SIZE;
  const strokeWidth = LockAnimationConstants.PROGRESS_STROKE_WIDTH;
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      
      // Clear any pending timers
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      
      // Disconnect from device
      if (smartLockService.isConnected()) {
        console.log('🔌 Disconnecting from device on unmount...');
        smartLockService.disconnect().catch((error) => {
          console.error('❌ Error disconnecting on unmount:', error);
        });
      }
    };
  }, []);

  // Request Bluetooth permissions on Android
  useEffect(() => {
    const requestBluetoothPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const androidVersion = Platform.Version;
          
          if (androidVersion >= 31) {
            // Android 12+ (API 31+) - Request new Bluetooth permissions
            const granted = await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
              PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            ]);

            if (
              granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
              granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
            ) {
              console.log('✅ Bluetooth permissions granted');
            } else {
              console.warn('⚠️ Bluetooth permissions denied');
              Alert.alert(
                'Bluetooth Permission Required',
                'This app needs Bluetooth permissions to control your smart lock. Please grant the permissions in Settings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]
              );
            }
          } else {
            // Android 11 and below - Request location permissions
            const granted = await PermissionsAndroid.requestMultiple([
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);

            if (granted['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED) {
              console.log('✅ Location permission granted for Bluetooth');
            } else {
              console.warn('⚠️ Location permission denied');
              Alert.alert(
                'Location Permission Required',
                'This app needs location permission to scan for Bluetooth devices. Please grant the permission in Settings.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Open Settings', onPress: () => Linking.openSettings() },
                ]
              );
            }
          }
        } catch (error) {
          console.error('❌ Error requesting Bluetooth permissions:', error);
        }
      }
    };

    requestBluetoothPermissions();
  }, []);

  // Fetch device BLE ID from API if not in params
  useEffect(() => {
    const fetchDeviceBleId = async () => {
      // If we already have BLE ID from params, no need to fetch
      if (deviceBleId) {
        console.log('✅ Using BLE device ID from params:', deviceBleId);
        return;
      }

      // If no deviceId to query with, skip
      if (!deviceId) {
        console.warn('⚠️ No deviceId available to fetch BLE ID');
        return;
      }

      try {
        console.log('📡 Fetching device details from API for deviceId:', deviceId);
        const response = await apiClient.get(`home/devices/${deviceId}/`);
        const deviceData = response.data;

        if (deviceData.ble_device_id) {
          console.log('✅ Retrieved BLE device ID from API:', deviceData.ble_device_id);
          setDeviceBleId(deviceData.ble_device_id);
        } else {
          console.warn('⚠️ Device exists but has no ble_device_id field in database');
        }
      } catch (error: any) {
        console.error('❌ Failed to fetch device BLE ID:', error.message);
      }
    };

    fetchDeviceBleId();
  }, [deviceId, deviceBleId]);

  // Auto-connect to device on mount
  useEffect(() => {
    let isMounted = true;

    const autoConnectToDevice = async () => {
      // If we don't have BLE ID yet but we have deviceId, wait for API fetch to complete
      if (!deviceBleId && deviceId && !bleDeviceId) {
        console.log('⏳ Waiting for BLE device ID to be fetched from API...');
        return;
      }

      // Check if already connected (e.g., coming from calibration)
      if (smartLockService.isConnected()) {
        console.log('✅ Already connected to device');
        setIsConnected(true);
        
        // Always set up lock position subscriptions when coming to lock screen
        // This is safe to call even if some subscriptions exist (e.g., from calibration)
        // The method clears existing subscriptions first to avoid duplicates
        console.log('🔔 Setting up lock position subscriptions...');
        await smartLockService.setupStateSubscriptions();
        
        // Still need to read initial state since we just arrived at this screen
        console.log('📖 Reading current lock state...');
        try {
          await smartLockService.refreshState();
          setIsLoadingState(false);
          console.log('✅ Initial state loaded for already-connected device');
        } catch (error) {
          console.error('❌ Failed to read initial state:', error);
          setIsLoadingState(false);
        }
        return;
      }

      // Check if Bluetooth is enabled
      const btEnabled = await isBluetoothEnabled();
      if (!btEnabled) {
        console.log('⚠️ Bluetooth is OFF, showing prompt');
        setShowBluetoothModal(true);
        return;
      }

      setIsConnecting(true);
      console.log('🔍 Attempting to connect to device...');

      try {
        // Check if we have BLE device ID
        if (!deviceBleId) {
          console.error('❌ No BLE device ID available for connection');
          const errorMsg = 'Device ID is required for connection. Please re-pair the device.';
          Alert.alert('Connection Error', errorMsg);
          setIsConnecting(false);
          return;
        }
        
        // Connect directly using BLE device ID (MAC address)
        console.log('📡 Connecting to device using BLE ID:', deviceBleId);
        const connected = await smartLockService.connect(deviceBleId);
        
        if (connected && isMounted) {
          console.log('✅ Auto-connected successfully');
          setIsConnected(true);
          setIsLoadingState(false);
          setReconnectAttempts(0);
        } else if (isMounted) {
          console.log('⚠️ Failed to connect to device');
          Alert.alert(
            'Connection Failed',
            'Could not connect to the device. Please make sure the device is powered on and nearby.',
            [{ text: 'OK' }]
          );
        }
      } catch (error: any) {
        console.error('❌ Auto-connect failed:', error);
        if (isMounted) {
          Alert.alert(
            'Connection Error',
            error.message || 'Failed to connect to device. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } finally {
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    autoConnectToDevice();

    // Cleanup: disconnect when leaving the screen
    return () => {
      isMounted = false;
      isMountedGlobal.current = false; // Prevent any state updates after unmount
      
      // Disconnect from device when unmounting
      if (smartLockService.isConnected()) {
        console.log('🔌 Disconnecting from device (screen unmount)...');
        smartLockService.disconnect().catch((error) => {
          console.error('❌ Disconnect error on unmount:', error);
        });
      }
    };
  }, [deviceName, bleDeviceId, deviceBleId, deviceId]);

  // Monitor BLE connection state and auto-retry on disconnect
  useEffect(() => {
    let isMounted = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const attemptReconnect = async () => {
      if (!isMounted || isConnecting) return;

      console.log(`🔄 Auto-reconnect attempt ${reconnectAttempts + 1}...`);
      setIsConnecting(true);
      setReconnectAttempts(prev => prev + 1);

      try {
        // Try BLE device ID if available
        if (deviceBleId) {
          console.log('📡 Reconnecting using BLE ID:', deviceBleId);
          const connected = await smartLockService.connect(deviceBleId);
          
          if (connected && isMounted) {
            console.log('✅ Reconnected successfully using BLE ID');
            setIsConnected(true);
            setReconnectAttempts(0);
            return;
          } else {
            console.warn('⚠️ Reconnect with BLE ID failed');
          }
        } else {
          console.error('❌ No BLE device ID available for reconnection');
        }
      } catch (error) {
        console.error('❌ Reconnect failed:', error);
      } finally {
        if (isMounted) {
          setIsConnecting(false);
        }
      }
    };

    const updateConnectionState = () => {
      if (isMounted) {
        const connected = smartLockService.isConnected();
        const wasConnected = isConnected;
        setIsConnected(connected);

        // If we just got disconnected and we're still on this screen, try to reconnect
        if (wasConnected && !connected && reconnectAttempts < 5) {
          console.log('⚠️ Connection lost, will attempt to reconnect in 3s...');
          retryTimer = setTimeout(() => {
            attemptReconnect();
          }, 3000);
        }
      }
    };

    // Check initial state
    updateConnectionState();

    // Listen for connection/disconnection events
    const unsubConnected = smartLockService.on('connected', updateConnectionState);
    const unsubDisconnected = smartLockService.on('disconnected', updateConnectionState);
    const unsubError = smartLockService.on('error', updateConnectionState);

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
      unsubConnected();
      unsubDisconnected();
      unsubError();
    };
  }, [isConnected, isConnecting, reconnectAttempts]); // Removed deviceName - it's from route params and won't change

  // Listen to lock state changes from device
  useEffect(() => {
    let isMounted = true;

    // Listen for initial state loaded event (after connection reads from device)
    const unsubInitialState = smartLockService.on('initialStateLoaded', (data) => {
      if (isMounted) {
        const state = data.state;
        // Consider both CLP (2) and JLP (4) as LOCKED
        // Consider both CULP (3) and JULP (5) as UNLOCKED
        const locked = state.lockPosition === LockPosition.CLOSED_LOCKED_POSITION || 
                      state.lockPosition === LockPosition.JAMMED_LOCKED_POSITION;
        setIsLocked(locked);
        isLockedRef.current = locked;
        setIsDoorClosed(state.doorState !== 2); // 2 = OPEN
        setBatteryLevel(state.batteryLevel);
        setIsLoadingState(false);
        console.log('✅ Initial lock state loaded from device:', locked ? 'LOCKED' : 'UNLOCKED', `(position: ${state.lockPosition})`);
      }
    });

    // Listen for lock position changes from device - update immediately
    const unsubLockPos = smartLockService.on('lockPositionChanged', (data) => {
      if (isMounted) {
        const position = data.lockPosition;
        // CLP (2) or JLP (4) = LOCKED
        // CULP (3) or JULP (5) = UNLOCKED
        const locked = position === LockPosition.CLOSED_LOCKED_POSITION || 
                      position === LockPosition.JAMMED_LOCKED_POSITION;
        
        console.log('🔒 Lock position changed:', locked ? 'LOCKED' : 'UNLOCKED', `(value: ${position})`);
        
        // Check if we have a pending action to log
        const pending = pendingActionRef.current;
        if (pending) {
          const expectedLocked = pending.action === 'lock';
          const stateActuallyChanged = locked !== pending.preActionLocked;
          const changedToExpectedState = locked === expectedLocked;
          
          console.log(`📝 Pending action: ${pending.action}, pre-state: ${pending.preActionLocked ? 'LOCKED' : 'UNLOCKED'}, current: ${locked ? 'LOCKED' : 'UNLOCKED'}`);
          console.log(`📝 State changed: ${stateActuallyChanged}, changed to expected: ${changedToExpectedState}`);
          
          if (stateActuallyChanged && changedToExpectedState) {
            // SUCCESS: Lock actually changed to the expected state
            console.log(`✅ Lock actually ${pending.action}ed - logging success`);
            logLockActivity(pending.action, 'bluetooth');
          } else if (!stateActuallyChanged) {
            // FAILED: State didn't change at all
            console.log(`❌ Lock state didn't change - logging failed attempt`);
            logLockActivity('log_failed_attempt', 'bluetooth', `Attempted to ${pending.action} but lock state remained ${locked ? 'locked' : 'unlocked'}`);
          }
          // Note: If state changed but not to expected (weird edge case), we don't log
          
          // Clear pending action
          pendingActionRef.current = null;
        }
        
        // Update both state and ref immediately
        setIsLocked(locked);
        isLockedRef.current = locked;
        setIsLoadingState(false);
        setIsTransitioning(false);
      }
    });

    // Listen for locking process state to handle command feedback
    const unsubLockProcess = smartLockService.on('lockingProcessStateChanged', (data) => {
      if (isMounted) {
        console.log('🔄 Locking process state:', data.state, '(2=SUCCESS, 3=FAILED, 4=IN_PROGRESS)');
        
        const pending = pendingActionRef.current;
        
        if (data.state === LockingProcessState.SUCCESS && pending) {
          // SUCCESS notification received - the lock will change position
          console.log('✅ Lock operation SUCCESS notification received');
          // Keep waiting for position change to confirm and log
          // Don't clear pending action yet - let position change handle logging
        } else if (data.state === LockingProcessState.FAILED) {
          console.log('❌ Lock operation FAILED notification received');
          setIsTransitioning(false);
          
          // Log the failure immediately based on the status attribute
          if (pending) {
            logLockActivity('log_failed_attempt', 'bluetooth', `Lock ${pending.action} failed - device reported failure`);
            pendingActionRef.current = null;
          }
        } else if (data.state === LockingProcessState.IN_PROGRESS) {
          console.log('⏳ Lock operation IN_PROGRESS');
          // Keep transitioning state
        }
      }
    });

    // Listen for door state changes
    const unsubDoor = smartLockService.on('doorStateChanged', (data) => {
      if (isMounted) {
        setIsDoorClosed(data.doorState !== 2);
      }
    });

    // Listen for battery level changes
    const unsubBattery = smartLockService.on('batteryLevelChanged', (data) => {
      if (isMounted) {
        setBatteryLevel(data.batteryLevel);
      }
    });

    return () => {
      isMounted = false;
      unsubInitialState();
      unsubLockPos();
      unsubLockProcess();
      unsubDoor();
      unsubBattery();
    };
  }, []);

  // Pulse animation for the lock button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: LockAnimationConstants.PULSE_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: LockAnimationConstants.PULSE_DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  // Handle press in (start holding)
  const handlePressIn = useCallback(() => {
    if (isTransitioning || !isConnected || isLoadingState || isLocked === null) return;

    setIsHolding(true);

    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: LockAnimationConstants.HOLD_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Scale down slightly when pressed
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    // Set timer for hold completion
    holdTimer.current = setTimeout(() => {
      handleHoldComplete();
    }, LockAnimationConstants.HOLD_DURATION);
  }, [isConnected, isTransitioning, isLoadingState, progressAnim, scaleAnim]);

  // Handle press out (stop holding)
  const handlePressOut = useCallback(() => {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }

    setIsHolding(false);

    // Reset progress animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();

    // Reset scale
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [progressAnim, scaleAnim]);

  // Handle hold completion - send actual BLE command
  const handleHoldComplete = useCallback(async () => {
    setIsHolding(false);
    setIsTransitioning(true);

    // Reset progress
    progressAnim.setValue(0);

    // Reset scale with a bounce effect
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 3,
      useNativeDriver: true,
    }).start();

    // Send actual lock/unlock command to device
    try {
      // Use ref to get the CURRENT lock state (not stale closure value)
      const currentlyLocked = isLockedRef.current;
      const actionType = currentlyLocked ? 'unlock' : 'lock';
      console.log(`🔐 Current lock state (from ref): ${currentlyLocked ? 'LOCKED' : 'UNLOCKED'}, sending ${actionType.toUpperCase()} command`);
      
      const result = currentlyLocked 
        ? await smartLockService.unlock()
        : await smartLockService.lock();

      console.log('🔐 Lock command result:', result);

      if (result === LockingProcessState.SUCCESS || result === LockingProcessState.IN_PROGRESS) {
        console.log('✅ Lock command written successfully - waiting for status and position change confirmation...');
        // Wait for lockingProcessStateChanged or lockPositionChanged events
        // Store the pending action so the event handlers can log it
        pendingActionRef.current = {
          action: actionType,
          preActionLocked: currentlyLocked ?? false,
        };
        
        // State will be updated via lockingProcessStateChanged or lockPositionChanged events
      } else if (result === LockingProcessState.FAILED) {
        console.error('❌ Lock command write failed immediately');
        // Log failed attempt to backend - BLE write itself failed
        await logLockActivity('log_failed_attempt', 'bluetooth', `Failed to write ${actionType} command to device`);
        setIsTransitioning(false);
      }
      // IN_PROGRESS and other states handled by lockingProcessStateChanged and lockPositionChanged subscriptions
    } catch (error: any) {
      console.error('❌ Lock command error:', error);
      // Log failed attempt to backend
      const currentlyLocked = isLockedRef.current;
      const actionType = currentlyLocked ? 'unlock' : 'lock';
      await logLockActivity('log_failed_attempt', 'bluetooth', `Error during ${actionType}: ${error.message || 'Unknown error'}`);
      setIsTransitioning(false);
    }
  }, [isLocked, progressAnim, scaleAnim, logLockActivity]);

  // Handle back navigation
  const isNavigatingBack = useRef(false);
  
  const handleBack = async () => {
    // Prevent multiple calls
    if (isNavigatingBack.current) {
      console.log('⚠️ Back navigation already in progress, ignoring...');
      return;
    }
    
    isNavigatingBack.current = true;
    isMountedGlobal.current = false; // Prevent any state updates during navigation
    
    try {
      console.log('🔙 Back button pressed, cleaning up...');
      
      // Clear any pending timers
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      
      // Disconnect from device if connected
      if (smartLockService.isConnected()) {
        console.log('🔌 Disconnecting from device...');
        await smartLockService.disconnect();
        console.log('✅ Disconnected successfully');
      }
      
      // Small delay to ensure disconnect completes
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Navigate back
      router.back();
    } catch (error) {
      console.error('❌ Error during back navigation cleanup:', error);
      // Still navigate back even if cleanup fails
      router.back();
    }
  };

  // Handle Bluetooth modal actions
  const handleTurnOnBluetooth = async () => {
    setShowBluetoothModal(false);
    console.log('🔵 Opening Bluetooth settings...');
    
    // Open Bluetooth settings directly
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('App-Prefs:Bluetooth');
      } else {
        await Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS');
      }
      
      // Monitor for Bluetooth being enabled and auto-retry connection
      const checkInterval = setInterval(async () => {
        const btEnabled = await isBluetoothEnabled();
        if (btEnabled) {
          clearInterval(checkInterval);
          console.log('✅ Bluetooth enabled, retrying connection...');
          
          if (deviceBleId) {
            setIsConnecting(true);
            try {
              const connected = await smartLockService.connect(deviceBleId);
              if (connected) {
                console.log('✅ Connected after Bluetooth enabled');
                setIsConnected(true);
              }
            } catch (error) {
              console.error('❌ Connection failed after Bluetooth enabled:', error);
            } finally {
              setIsConnecting(false);
            }
          }
        }
      }, 1000);
      
      // Stop checking after 30 seconds
      setTimeout(() => clearInterval(checkInterval), 30000);
    } catch (error) {
      console.error('❌ Failed to open Bluetooth settings:', error);
    }
  };

  const handleCancelBluetooth = () => {
    setShowBluetoothModal(false);
  };

  // Handle manual reconnect
  const handleReconnect = async () => {
    if (isConnecting) return;
    
    if (!deviceBleId) {
      Alert.alert(
        'Connection Error',
        'Device ID is not available. Please re-pair the device.',
        [{ text: 'OK' }]
      );
      return;
    }

    console.log('🔄 Manual reconnect requested');
    setReconnectAttempts(0); // Reset attempts on manual retry
    setIsConnecting(true);

    try {
      // Connect directly using BLE device ID
      console.log('📡 Manual reconnect using BLE ID:', deviceBleId);
      const connected = await smartLockService.connect(deviceBleId);
      
      if (connected) {
        console.log('✅ Manually reconnected successfully');
        setIsConnected(true);
        // State will be loaded via initialStateLoaded event from connect()
      } else {
        Alert.alert(
          'Connection Failed',
          'Could not connect to the device. Please make sure the device is powered on and nearby.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('❌ Manual reconnect failed:', error);
      Alert.alert(
        'Connection Error',
        error.message || 'Failed to connect to device. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsConnecting(false);
    }
  };

  // Handle menu item press - placeholders for now
  const handleActivityLog = () => {
    router.push({
      pathname: '/(ActivityLog)/ActivityLog' as any,
      params: {
        deviceId,
        deviceName,
        isConnected: isConnected ? 'true' : 'false',
      },
    });
  };

  const handleInviteFamily = () => {
    // TODO: Navigate to invite screen
  };

  const handleSettings = () => {
    router.push({
      pathname: '/(Lock/Unlock)/DeviceSettings' as any,
      params: {
        deviceId,
        deviceName,
        homeName,
      },
    });
  };

  // Get current colors based on connection and lock state
  const currentColors = !isConnected 
    ? LockColors.disconnected 
    : isLocked 
      ? LockColors.locked 
      : LockColors.unlocked;

  // Interpolate progress for the ring
  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  // Menu Item Component
  const MenuItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    onPress: () => void;
    accessibilityLabel: string;
    accessibilityHint: string;
  }> = ({ icon, label, onPress, accessibilityLabel, accessibilityHint }) => (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: LockDimensions.menuItem.paddingHorizontal,
        height: LockDimensions.menuItem.height,
        borderBottomWidth: LockDimensions.menuItem.borderBottomWidth,
        borderBottomColor: LockColors.menu.border,
        backgroundColor: colors.surface,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {icon}
        <Typography
          variant="body"
          color={LockColors.menu.text}
          style={{ marginLeft: Spacing.md }}
        >
          {label}
        </Typography>
      </View>
      <Typography
        variant="body"
        color={LockColors.menu.chevron}
        style={{ fontSize: 24, fontWeight: '300' }}
      >
        ›
      </Typography>
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
              accessibilityLabel={LockControlConstants.backButtonAccessibilityLabel}
              accessibilityHint={LockControlConstants.backButtonAccessibilityHint}
              style={{ padding: Spacing.xs, marginRight: Spacing.sm }}
            >
              <BackArrow width={24} height={24} color={LockColors.header.icon} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Typography
                variant="h3"
                color={LockColors.header.text}
                style={{ fontSize: 16, fontWeight: '600' }}
              >
                {deviceName} - {homeName}
              </Typography>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Status Icons Row - Below Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          backgroundColor: colors.background,
        }}
      >
        {/* Battery indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Battery width={20} height={14} color="#8B9A5B" />
          <Typography
            variant="caption"
            color={colors.text}
            style={{ marginLeft: 4, fontSize: 11 }}
          >
            {batteryLevel}%
          </Typography>
        </View>
        {/* Bluetooth and WiFi */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: LockDimensions.statusIcon.spacing,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <BluetoothIcon
              width={LockDimensions.statusIcon.size}
              height={LockDimensions.statusIcon.size}
              color={isConnecting ? colors.info : (isConnected ? colors.success : colors.error)}
            />
            <Typography
              variant="caption"
              color={isConnecting ? colors.info : (isConnected ? colors.success : colors.error)}
              style={{ fontWeight: '600' }}
            >
              {isConnecting ? 'Connecting...' : (isConnected ? 'Connected' : 'Disconnected')}
            </Typography>
          </View>
          <Wifi
            width={LockDimensions.statusIcon.size}
            height={LockDimensions.statusIcon.size}
            color={colors.disabled}
          />
        </View>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1 }}>
        {/* Lock Button Container */}
        <View
          style={{
            alignItems: 'center',
            paddingVertical: LockDimensions.lockContainer.paddingVertical,
          }}
        >
          <TouchableWithoutFeedback
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityLabel={LockControlConstants.lockButtonAccessibilityLabel}
            accessibilityHint={LockControlConstants.lockButtonAccessibilityHint}
          >
            <Animated.View
              style={{
                width: LockAnimationConstants.OUTER_CIRCLE_SIZE,
                height: LockAnimationConstants.OUTER_CIRCLE_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
              }}
            >
              {/* Progress Ring */}
              <Svg
                width={circleSize}
                height={circleSize}
                style={{ position: 'absolute' }}
              >
                {/* Background circle */}
                <Circle
                  cx={circleSize / 2}
                  cy={circleSize / 2}
                  r={radius}
                  stroke={currentColors.background}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  opacity={0.3}
                />
                {/* Progress circle */}
                {isHolding && (
                  <AnimatedCircle
                    cx={circleSize / 2}
                    cy={circleSize / 2}
                    r={radius}
                    stroke={colors.surface}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${circleSize / 2}, ${circleSize / 2}`}
                  />
                )}
              </Svg>

              {/* Inner Circle with Lock State */}
              <View
                style={{
                  width: LockAnimationConstants.INNER_CIRCLE_SIZE,
                  height: LockAnimationConstants.INNER_CIRCLE_SIZE,
                  borderRadius: LockAnimationConstants.INNER_CIRCLE_SIZE / 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: currentColors.background,
                }}
              >
                {isConnected ? (
                  <>
                    {isLoadingState || isLocked === null ? (
                      /* Loading state - show connecting/loading message */
                      <Typography
                        variant="h2"
                        color={currentColors.text}
                        style={{ fontSize: 18, fontWeight: '600' }}
                      >
                        Loading...
                      </Typography>
                    ) : (
                      <>
                        {/* Door and Lock Icons from Design System */}
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          {/* Door Icon - closed when locked, opened when unlocked */}
                          {isLocked ? (
                            <Door width={28} height={32} color={currentColors.text} />
                          ) : (
                            <OpenedDoor width={28} height={32} color={currentColors.text} />
                          )}
                          {/* Lock Icon - locked or unlocked */}
                          {isLocked ? (
                            <Locked width={24} height={28} color={currentColors.text} />
                          ) : (
                            <Unlocked width={24} height={28} color={currentColors.text} />
                          )}
                        </View>

                        {/* Lock State Text */}
                        <Typography
                          variant="h2"
                          color={currentColors.text}
                          style={{ fontSize: 20, fontWeight: '600' }}
                        >
                          {isTransitioning
                            ? isLocked
                              ? LockControlConstants.unlocking
                              : LockControlConstants.locking
                            : isLocked
                            ? LockControlConstants.locked
                            : LockControlConstants.unlocked}
                        </Typography>

                        {/* Door State */}
                        <Typography
                          variant="caption"
                          color={currentColors.text}
                          style={{ marginTop: 4, opacity: 0.9 }}
                        >
                          {isDoorClosed ? LockControlConstants.doorClosed : LockControlConstants.doorOpen}
                        </Typography>
                      </>
                    )}
                  </>
                ) : (
                  /* Disconnected State */
                  <Typography
                    variant="h2"
                    color={currentColors.text}
                    style={{ fontSize: 18, fontWeight: '600' }}
                  >
                    {LockControlConstants.disconnected}
                  </Typography>
                )}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>

          {/* Hold Instruction */}
          <Typography
            variant="caption"
            color={colors.secondaryText}
            style={{ marginTop: Spacing.lg, textAlign: 'center', paddingHorizontal: Spacing.xl }}
          >
            {!isConnected 
              ? LockControlConstants.connectToUse
              : isLocked 
                ? LockControlConstants.holdToUnlock 
                : LockControlConstants.holdToLock}
          </Typography>

          {/* Reconnect Button when disconnected */}
          {(() => {
            const shouldShow = !isConnected && !isConnecting;
            console.log('🔘 Reconnect button visible?', shouldShow, '| isConnected:', isConnected, '| isConnecting:', isConnecting);
            return shouldShow ? (
              <TouchableOpacity
                style={{
                  marginTop: Spacing.lg,
                  paddingVertical: Spacing.sm,
                  paddingHorizontal: Spacing.xl,
                  backgroundColor: colors.primary.base,
                  borderRadius: 8,
                }}
                onPress={handleReconnect}
              >
                <Typography
                  variant="body"
                  color={colors.text}
                  style={{ fontWeight: '600', textAlign: 'center' }}
                >
                  Reconnect
                </Typography>
              </TouchableOpacity>
            ) : null;
          })()}
        </View>

        {/* Menu Items */}
        <View style={{ backgroundColor: colors.surface, marginTop: Spacing.xl }}>
          {/* Activity Log */}
          <MenuItem
            icon={<ActivityLog width={24} height={18} fill={LockColors.menu.icon} />}
            label={LockControlConstants.activityLog}
            onPress={handleActivityLog}
            accessibilityLabel={LockControlConstants.activityLogAccessibilityLabel}
            accessibilityHint={LockControlConstants.activityLogAccessibilityHint}
          />

          {/* Invite Family and Friends */}
          <MenuItem
            icon={<Invite width={24} height={20} color={LockColors.menu.icon} />}
            label={LockControlConstants.inviteFamilyFriends}
            onPress={handleInviteFamily}
            accessibilityLabel={LockControlConstants.inviteFamilyAccessibilityLabel}
            accessibilityHint={LockControlConstants.inviteFamilyAccessibilityHint}
          />

          {/* Settings */}
          <MenuItem
            icon={<SettingsIcon size={24} color={LockColors.menu.icon} />}
            label={LockControlConstants.settings}
            onPress={handleSettings}
            accessibilityLabel={LockControlConstants.settingsAccessibilityLabel}
            accessibilityHint={LockControlConstants.settingsAccessibilityHint}
          />
        </View>
      </View>

      {/* Bluetooth Modal - Using calibration style */}
      <Modal
        visible={showBluetoothModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelBluetooth}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end', alignItems: 'stretch' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.md, paddingTop: Spacing.lg, width: '100%', alignItems: 'center' }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: Spacing.lg }}>
              <Typography variant="h3" color="#000000" style={{ fontSize: 18, fontWeight: '600' }}>
                Bluetooth Access
              </Typography>
              <TouchableOpacity onPress={handleCancelBluetooth} style={{ padding: Spacing.xs }}>
                <Typography variant="h3" color="#666666" style={{ fontSize: 24 }}>×</Typography>
              </TouchableOpacity>
            </View>

            {/* Bluetooth Icon */}
            <View style={{ marginBottom: Spacing.md }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
                <BluetoothIcon width={32} height={32} color={colors.completedstep} />
              </View>
            </View>

            {/* Modal Content */}
            <Typography variant="h2" color="#000000" style={{ fontSize: 20, fontWeight: '600', marginBottom: Spacing.xs, textAlign: 'center' }}>
              Bluetooth Required
            </Typography>
            <Typography variant="body" color="#666666" style={{ fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: Spacing.lg }}>
              To access your smart lock, please turn on Bluetooth.
            </Typography>

            {/* Action Buttons */}
            <View style={{ width: '100%', gap: Spacing.md }}>
              <TouchableOpacity
                style={{ backgroundColor: colors.primary.darker, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: 12, alignItems: 'center' }}
                onPress={handleTurnOnBluetooth}
              >
                <Typography variant="body" color={colors.text} style={{ fontSize: 16, fontWeight: '600' }}>
                  Turn On Bluetooth
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#F5F5F5', paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg, borderRadius: 12, alignItems: 'center' }}
                onPress={handleCancelBluetooth}
              >
                <Typography variant="body" color="#000000" style={{ fontSize: 16, fontWeight: '600' }}>
                  Cancel
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <BottomNavigation
        items={[
          { key: 'home', label: 'Home', icon: null },
          { key: 'devices', label: 'Devices', icon: null },
          { key: 'energy', label: 'Energy', icon: null },
          { key: 'profile', label: 'Profile', icon: null },
        ]}
        activeKey="devices"
        profile_picture={user?.profile_picture}
        onTabPress={(key: string) => {
          if (key === 'home') {
            router.push('/(app)/home');
          } else if (key === 'devices') {
            router.push('/(HomePage_actions)/MyDevices' as never);
          } else if (key === 'energy') {
            router.push('/(app)/home');
          } else if (key === 'profile') {
            router.push('/(profile actions)/Profile' as never);
          }
        }}
      />
    </View>
  );
};

export default LockControlScreen;
