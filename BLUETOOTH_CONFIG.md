# Bluetooth Configuration Guide

## Overview
This document explains how to configure the Bluetooth UUIDs for your smart lock devices to work with the Beysmart app.

## What You Need From Your Hardware Team

Your ESP32/hardware developer needs to provide you with:
1. **Service UUID** - The main service identifier for your device
2. **WiFi Characteristic UUID** - The characteristic for sending WiFi credentials
3. **Token Characteristic UUID** - The characteristic for sending ThingsBoard device token

## Where to Update UUIDs

### 1. WiFi Credentials (AddDevice6.tsx)
File: `app/(devices)/AddDevice6.tsx`

```typescript
// Lines 28-29
const WIFI_SERVICE_UUID = "YOUR-SERVICE-UUID-HERE";
const WIFI_CHARACTERISTIC_UUID = "YOUR-WIFI-CHARACTERISTIC-UUID-HERE";
```

### 2. Device Token (AddDevice9.tsx)
File: `app/(devices)/AddDevice9.tsx`

```typescript
// Lines 29-30
const TOKEN_SERVICE_UUID = "YOUR-SERVICE-UUID-HERE"; 
const TOKEN_CHARACTERISTIC_UUID = "YOUR-TOKEN-CHARACTERISTIC-UUID-HERE";
```

**Note:** Service UUID might be the same for both WiFi and Token, but characteristics should be different.

## Data Format Sent via Bluetooth

### WiFi Credentials
```json
{
  "ssid": "WiFi-Network-Name",
  "password": "wifi-password",
  "timestamp": 1234567890
}
```

### ThingsBoard Token
```json
{
  "token": "A1B2C3D4E5F6G7H8I9J0...",
  "server": "mqtt.thingsboard.cloud",
  "port": 1883,
  "timestamp": 1234567890
}
```

## How Your Device Should Handle These

### On WiFi Characteristic Write:
1. Parse JSON payload
2. Extract `ssid` and `password`
3. Connect to WiFi using these credentials
4. Send confirmation back (optional)

### On Token Characteristic Write:
1. Parse JSON payload
2. Extract `token`, `server`, and `port`
3. Store in device memory (EEPROM/Flash)
4. Use token to connect to ThingsBoard MQTT broker
5. Send telemetry using this token for authentication

## Example ESP32 Code Structure

```cpp
// WiFi Characteristic Callback
void onWiFiWrite(BLECharacteristic* pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    // Parse JSON
    // Connect to WiFi
}

// Token Characteristic Callback
void onTokenWrite(BLECharacteristic* pCharacteristic) {
    std::string value = pCharacteristic->getValue();
    // Parse JSON
    // Store token in EEPROM
    // Connect to ThingsBoard
}
```

## Testing Without Hardware

You can test the app flow by:
1. Comment out the BLE sending code temporarily
2. Use mock success responses
3. Test the UI flow and backend integration

## Troubleshooting

### "Failed to send WiFi credentials"
- Check UUIDs match your device
- Ensure device is still connected
- Check device has the correct characteristic

### "Failed to send device token"
- Same as above
- Verify token is being passed from backend correctly

### Connection Drops
- BLE connections can be fragile
- Consider adding reconnection logic
- Test with device very close to phone

## Security Notes

1. **WiFi Password**: Sent over BLE - ensure your device encrypts this
2. **ThingsBoard Token**: Treat like a password - store securely on device
3. **BLE Pairing**: Consider implementing BLE bonding for added security

## Need Help?

Contact your hardware team with:
- This document
- The JSON formats above
- Request for Service and Characteristic UUIDs

