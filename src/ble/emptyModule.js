/**
 * Empty module to replace native BLE modules in Expo Go
 * This prevents native module errors when testing without BLE
 */

// Mock BleManager (react-native-ble-manager)
const mockBleManager = {
  start: () => Promise.resolve(),
  scan: () => Promise.resolve(),
  stopScan: () => Promise.resolve(),
  connect: () => Promise.resolve(),
  disconnect: () => Promise.resolve(),
  checkState: () => Promise.resolve('off'),
  retrieveServices: () => Promise.resolve({}),
  read: () => Promise.resolve([]),
  write: () => Promise.resolve(),
  getConnectedPeripherals: () => Promise.resolve([]),
};

// Mock BleManager class (react-native-ble-plx style)
class BleManager {
  constructor() {}
  startDeviceScan() {}
  stopDeviceScan() {}
  connectToDevice() { return Promise.resolve(null); }
  destroy() {}
}

// Mock Device class
class Device {
  constructor() {
    this.id = '';
    this.name = null;
    this.rssi = null;
    this.isConnectable = null;
  }
}

// Export both default and named exports to handle different import styles
module.exports = mockBleManager;
module.exports.default = mockBleManager;
module.exports.BleManager = BleManager;
module.exports.Device = Device;

// Also support ES module style imports
module.exports.__esModule = true;

