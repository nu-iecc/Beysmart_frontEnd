import { Stack } from "expo-router";

export default function LockUnlockLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LockControlScreen" options={{ headerShown: false }} />
      <Stack.Screen name="DeviceSettings" options={{ headerShown: false }} />
    </Stack>
  );
}
