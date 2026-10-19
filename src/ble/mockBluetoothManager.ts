/**
 * Mock Bluetooth Manager for Expo Go Testing
 * 
 * This mock allows the app to run in Expo Go without BLE dependencies.
 * All methods are no-ops that return safe default values.
 */

interface BleDevice {
  id: string;
  name: string;
  rssi: number;
  advertising: any;
}

class MockBluetoothManager {
  private connectedDevice: BleDevice | null = null;
  private isScanning: boolean = false;

  constructor() {
    console.log("🧪 Mock BLE Manager initialized (BLE disabled for testing)");
  }

  async requestPermissions(): Promise<void> {
    console.log("🧪 [MOCK] Permissions requested");
  }

  async isBluetoothEnabled(): Promise<boolean> {
    console.log("🧪 [MOCK] Bluetooth check");
    return false;
  }

  async scanForDevices(onDeviceFound: (device: BleDevice) => void): Promise<void> {
    console.log("🧪 [MOCK] Scan started (no devices will be found)");
  }

  async connectToDevice(deviceId: string): Promise<BleDevice | null> {
    console.log("🧪 [MOCK] Connect attempted:", deviceId);
    return null;
  }

  getConnectedDevice(): BleDevice | null {
    return this.connectedDevice;
  }

  async retrieveServices(deviceId: string): Promise<any> {
    console.log("🧪 [MOCK] Services retrieved");
    return null;
  }

  async writeToCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string,
    data: number[]
  ): Promise<void> {
    console.log("🧪 [MOCK] Write to characteristic");
  }

  async sendWiFiCredentials(
    deviceId: string,
    ssid: string,
    password: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<boolean> {
    console.log("🧪 [MOCK] WiFi credentials sent");
    return false;
  }

  async sendDeviceToken(
    deviceId: string,
    token: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<boolean> {
    console.log("🧪 [MOCK] Device token sent");
    return false;
  }

  async readFromCharacteristic(
    deviceId: string,
    serviceUUID: string,
    characteristicUUID: string
  ): Promise<number[] | null> {
    console.log("🧪 [MOCK] Read from characteristic");
    return null;
  }

  async disconnect(): Promise<void> {
    console.log("🧪 [MOCK] Disconnected");
    this.connectedDevice = null;
  }

  async stopScanning(): Promise<void> {
    console.log("🧪 [MOCK] Scan stopped");
    this.isScanning = false;
  }

  destroy(): void {
    console.log("🧪 [MOCK] Cleanup");
  }
}

export default new MockBluetoothManager();

