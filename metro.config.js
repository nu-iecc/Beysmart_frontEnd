const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/**
 * BLE Mocking Configuration
 * 
 * Set DISABLE_BLE to control BLE module loading:
 * - true  = Mock BLE (for Expo Go testing on iPhone)
 * - false = Real BLE (for EAS builds on Android)
 * 
 * ⚠️ IMPORTANT: Set to FALSE before running `eas build`!
 */
const DISABLE_BLE = false ;  // Set to true for Expo Go testing

const config = getDefaultConfig(__dirname);

if (DISABLE_BLE) {
  console.log('🧪 [Metro] BLE DISABLED - Using mock modules for Expo Go testing');
  
  const originalResolveRequest = config.resolver.resolveRequest;
  
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Mock native BLE packages
    const bleNativeModules = [
      'react-native-ble-plx',
      'react-native-ble-manager', 
      'react-native-permissions',
    ];
    
    if (bleNativeModules.some(mod => moduleName === mod || moduleName.startsWith(mod + '/'))) {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'src/ble/emptyModule.js'),
      };
    }
    
    // Redirect src/ble (index) to mock
    if (moduleName.endsWith('src/ble') || moduleName.endsWith('src/ble/index')) {
      return {
        type: 'sourceFile', 
        filePath: path.resolve(__dirname, 'src/ble/mockBluetoothManager.ts'),
      };
    }
    
    // Redirect bluetoothmanager.ts to mock
    if (moduleName.includes('bluetoothmanager') && !moduleName.includes('mock')) {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'src/ble/mockBluetoothManager.ts'),
      };
    }
    
    // Default resolution
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
} else {
  console.log('📱 [Metro] BLE ENABLED - Using real modules for EAS build');
}

module.exports = config;

