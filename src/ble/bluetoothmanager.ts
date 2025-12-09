import * as ExpoDevice from "expo-device";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import { BleManager as BleManagerPlx, Device, State } from "react-native-ble-plx";

interface BleDevice {
  id: string;
  name: string;
  rssi: number;
  advertising: any;
}

// Create a single instance of BleManager from ble-plx
const bleManagerPlx = new BleManagerPlx();

console.log("🔧 Using react-native-ble-plx for BLE scanning");

class BluetoothManager {
  private connectedDevice: BleDevice | null = null;
  private connectedPlxDevice: Device | null = null;
  private isScanning: boolean = false;

  constructor() {
    // Monitor Bluetooth state
    bleManagerPlx.onStateChange((state) => {
      console.log("🔵 Bluetooth state changed:", state);
    }, true);
    console.log("✅ BLE Manager (ble-plx) initialized");
  }

  // ✅ Request permissions (Android only)
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === "android" && (ExpoDevice.platformApiLevel ?? 0) < 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        console.log("📋 Permissions (API < 31):", granted);
        return granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
      } else if (Platform.OS === "android" && (ExpoDevice.platformApiLevel ?? 0) >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        console.log("📋 Permissions (API >= 31):", granted);
        const allGranted = 
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
          granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
        return allGranted;
      }
      return true; // iOS doesn't need runtime permissions
    } catch (error) {
      console.error("❌ Permission request failed:", error);
      return false;
    }
  }

  // ✅ Check if Bluetooth is enabled
  async isBluetoothEnabled(): Promise<boolean> {
    try {
      const state = await bleManagerPlx.state();
      console.log("🔵 Current Bluetooth state:", state);
      return state === State.PoweredOn;
    } catch (error) {
      console.error("Error checking Bluetooth state:", error);
      return false;
    }
  }

  // ✅ Scan for nearby devices using react-native-ble-plx
  async scanForDevices(onDeviceFound: (device: BleDevice) => void): Promise<void> {
    try {
      const permissionsGranted = await this.requestPermissions();
      if (!permissionsGranted) {
        console.error("❌ BLE permissions not granted!");
        Alert.alert("Permissions Required", "Please grant Bluetooth and Location permissions to scan for devices.");
        return;
      }

      const isEnabled = await this.isBluetoothEnabled();
      console.log("🔵 Bluetooth enabled:", isEnabled);
      if (!isEnabled) {
        Alert.alert("Bluetooth Required", "Please enable Bluetooth to scan for devices.");
        return;
      }

      if (this.isScanning) {
        console.log("Already scanning...");
        return;
      }

      this.isScanning = true;
      console.log("🔍 Starting BLE scan with react-native-ble-plx...");

      const discoveredDevices = new Set<string>();

      // Start scanning with ble-plx
      bleManagerPlx.startDeviceScan(
        null, // No service UUID filter - scan for all devices
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            console.error("❌ Scan error:", error.message);
            return;
          }

          if (device) {
            // Log ALL devices found
            console.log("📡 BLE Device Found:", JSON.stringify({
              id: device.id,
              name: device.name || device.localName || "Unknown",
              rssi: device.rssi,
              isConnectable: device.isConnectable,
            }));

            const deviceName = device.name || device.localName || "";

            // Only show devices with "Smart" in the name (case-insensitive)
            if (deviceName.toLowerCase().includes("smart")) {
              console.log("✅ Smart device detected:", deviceName);
              
              // Avoid duplicates
              if (!discoveredDevices.has(device.id)) {
                discoveredDevices.add(device.id);
                
                onDeviceFound({
                  id: device.id,
                  name: deviceName,
                  rssi: device.rssi || 0,
                  advertising: {
                    localName: device.localName,
                    serviceUUIDs: device.serviceUUIDs,
                    manufacturerData: device.manufacturerData,
                  },
                });
              }
            }
          }
        }
      );

      console.log("✅ BLE scan started successfully");

      // Stop scanning after 15 seconds
      setTimeout(() => {
        if (this.isScanning) {
          console.log("⏰ Scan timeout reached, stopping scan...");
          bleManagerPlx.stopDeviceScan();
          this.isScanning = false;
          console.log("🛑 BLE scan stopped. Found", discoveredDevices.size, "devices");
        }
      }, 15000);
    } catch (error) {
      console.error("BLE scanning error:", error);
      Alert.alert("Error", "Bluetooth scanning failed. Please try again.");
      this.isScanning = false;
    }
  }

  // ✅ Connect to a device
  async connectToDevice(deviceId: string): Promise<BleDevice | null> {
    try {
      console.log("🔗 Connecting to device:", deviceId);

      // Stop scanning before connecting
      bleManagerPlx.stopDeviceScan();
      this.isScanning = false;

      const device = await bleManagerPlx.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      
      this.connectedPlxDevice = device;
      this.connectedDevice = {
        id: device.id,
        name: device.name || device.localName || "Unknown Device",
        rssi: device.rssi || 0,
        advertising: {
          localName: device.localName,
          serviceUUIDs: device.serviceUUIDs,
        },
      };

      console.log("✅ Connected to:", this.connectedDevice.name);
      return this.connectedDevice;
    } catch (error) {
      console.error("Connection error:", error);
      Alert.alert("Error", "Failed to connect to the device. Please try again.");
      return null;
    }
  }

  // ✅ Get connected device
  getConnectedDevice(): BleDevice | null {
    return this.connectedDevice;
  }

  // ✅ Retrieve services and characteristics from a connected device
  async retrieveServices(deviceId: string): Promise<any> {
    try {
      console.log("📋 Retrieving services for device:", deviceId);
      if (!this.connectedPlxDevice) {
        throw new Error("No device connected");
      }
      const services = await this.connectedPlxDevice.services();
      console.log("✅ Services retrieved:", services.map(s => s.uuid));
      return { services };
    } catch (error) {
      console.error("Error retrieving services:", error);
      throw error;
    }
  }

  // ✅ Write data to a characteristic
  async writeToCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: number[]
  ): Promise<void> {
    try {
      console.log(`📤 Writing to characteristic: ${characteristicUUID}`);
      if (!this.connectedPlxDevice) {
        throw new Error("No device connected");
      }
      
      // Convert number array to base64
      const base64Data = btoa(String.fromCharCode(...data));
      
      await this.connectedPlxDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        base64Data
      );
      console.log("✅ Data written successfully");
    } catch (error) {
      console.error("Error writing to characteristic:", error);
      throw error;
    }
  }

  // ✅ Send WiFi credentials to device
  async sendWiFiCredentials(
    deviceId: string,
    ssid: string,
    password: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<boolean> {
    try {
      console.log("📡 Sending WiFi credentials to device...");
      
      // Create JSON payload
      const payload = JSON.stringify({
        ssid: ssid,
        password: password,
        timestamp: Date.now()
      });
      
      // Convert string to byte array
      const data = Array.from(payload).map(char => char.charCodeAt(0));
      
      await this.writeToCharacteristic(deviceId, serviceUUID, characteristicUUID, data);
      console.log("✅ WiFi credentials sent successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to send WiFi credentials:", error);
      return false;
    }
  }

  // ✅ Send ThingsBoard device token to device
  async sendDeviceToken(
    deviceId: string,
    token: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<boolean> {
    try {
      console.log("🔐 Sending device token to device...");
      
      // Create JSON payload
      const payload = JSON.stringify({
        token: token,
        server: "mqtt.thingsboard.cloud",
        port: 1883,
        timestamp: Date.now()
      });
      
      // Convert string to byte array
      const data = Array.from(payload).map(char => char.charCodeAt(0));
      
      await this.writeToCharacteristic(deviceId, serviceUUID, characteristicUUID, data);
      console.log("✅ Device token sent successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to send device token:", error);
      return false;
    }
  }

  // ✅ Read data from a characteristic
  async readFromCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<number[] | null> {
    try {
      console.log(`📥 Reading from characteristic: ${characteristicUUID}`);
      if (!this.connectedPlxDevice) {
        throw new Error("No device connected");
      }
      
      const characteristic = await this.connectedPlxDevice.readCharacteristicForService(
        serviceUUID,
        characteristicUUID
      );
      
      if (characteristic.value) {
        // Convert base64 to number array
        const decoded = atob(characteristic.value);
        const data = Array.from(decoded).map(char => char.charCodeAt(0));
        console.log("✅ Data read successfully:", data);
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error reading from characteristic:", error);
      return null;
    }
  }

  // ✅ Disconnect from device
  async disconnect(): Promise<void> {
    if (this.connectedPlxDevice) {
      try {
        await bleManagerPlx.cancelDeviceConnection(this.connectedPlxDevice.id);
        console.log("🔌 Disconnected from:", this.connectedDevice?.name);
        this.connectedDevice = null;
        this.connectedPlxDevice = null;
      } catch (error) {
        console.error("Disconnect error:", error);
      }
    }
  }

  // ✅ Stop scanning
  async stopScanning(): Promise<void> {
    if (this.isScanning) {
      try {
        bleManagerPlx.stopDeviceScan();
        this.isScanning = false;
        console.log("🛑 BLE scan stopped");
      } catch (error) {
        console.error("Error stopping scan:", error);
      }
    }
  }

  // ✅ Cleanup
  destroy(): void {
    this.stopScanning();
    this.disconnect();
  }
}

export default new BluetoothManager();
