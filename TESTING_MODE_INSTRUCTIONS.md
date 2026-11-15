# 🧪 Testing Mode Instructions (BLE Disabled for Expo Go)

## ⚡ Quick Start

### **To ENABLE Testing Mode (for Expo Go on iPhone):**

1. Open `constants/featureFlags.ts`
2. Change line 17 from:
   ```typescript
   DISABLE_BLE_FOR_TESTING: false,
   ```
   to:
   ```typescript
   DISABLE_BLE_FOR_TESTING: true,
   ```
3. Save the file
4. Run: `npx expo start`
5. Scan QR code with your iPhone in Expo Go

✅ **Your app will now run in Expo Go without BLE crashes!**

---

### **To DISABLE Testing Mode (back to normal for EAS builds):**

1. Open `constants/featureFlags.ts`
2. Change line 17 from:
   ```typescript
   DISABLE_BLE_FOR_TESTING: true,
   ```
   to:
   ```typescript
   DISABLE_BLE_FOR_TESTING: false,
   ```
3. Save the file
4. Done! Your app is back to production mode

✅ **All BLE functionality restored. EAS builds will work normally.**

---

## 📁 Files Changed

The following files were modified to support this feature:

### ✨ New Files (can be kept permanently):
- `constants/featureFlags.ts` - Feature flag configuration
- `src/ble/mockBluetoothManager.ts` - Mock BLE manager for testing
- `src/ble/index.ts` - Conditional export based on flag

### 🔄 Modified Files:
- `app/(devices)/AddDevice4.tsx` - Updated import path
- `app/(devices)/AddDevice6.tsx` - Updated import path
- `app/(devices)/AddDevice9.tsx` - Updated import path

### ✅ Unchanged Files:
- `src/ble/bluetoothmanager.ts` - **NOT MODIFIED** (original stays intact)

---

## 🚀 How It Works

1. **When flag is `false` (default/production):**
   - App uses `src/ble/bluetoothmanager.ts` (real BLE)
   - All BLE features work normally
   - EAS builds work perfectly

2. **When flag is `true` (testing):**
   - App uses `src/ble/mockBluetoothManager.ts` (mock BLE)
   - No BLE dependencies loaded
   - App runs in Expo Go
   - BLE features are stubbed (safe no-ops)

---

## ⚠️ Important Notes

### Before EAS Build:
- ✅ **ALWAYS set flag to `false`** in `featureFlags.ts`
- ✅ Check git status to make sure flag is false
- ✅ Verify API URL is back to Railway production

### Before Committing to Git:
- ✅ Set flag to `false`
- ✅ Keep the new files (they're safe in production)
- ✅ The import changes are permanent (they work in both modes)

### Testing Locally:
- ✅ Can freely toggle the flag
- ✅ No need to rebuild or reinstall
- ✅ Just restart Expo dev server

---

## 🔄 To Completely Revert (if needed):

If you ever want to completely remove this system:

1. Delete these files:
   ```bash
   rm constants/featureFlags.ts
   rm src/ble/mockBluetoothManager.ts
   rm src/ble/index.ts
   rm TESTING_MODE_INSTRUCTIONS.md
   ```

2. Restore original imports in:
   - `app/(devices)/AddDevice4.tsx`
   - `app/(devices)/AddDevice6.tsx`
   - `app/(devices)/AddDevice9.tsx`
   
   Change from:
   ```typescript
   import bluetoothManager from '../../src/ble';
   ```
   
   Back to:
   ```typescript
   import bluetoothManager from '../../src/ble/bluetoothmanager';
   ```

3. Done! Everything back to original.

---

## 🎯 Summary

| Mode | Flag Value | Use Case | BLE Works? | Expo Go? |
|------|-----------|----------|------------|----------|
| **Production** | `false` | EAS builds, development | ✅ Yes | ❌ No |
| **Testing** | `true` | Test OTP in Expo Go | ❌ Mocked | ✅ Yes |

---

**Made with 💙 by AI - Toggle safely, build confidently!**

