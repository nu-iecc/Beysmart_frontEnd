import { Stack } from "expo-router";

export default function HomePageActionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MyDevices" options={{ headerShown: false }} />
    </Stack>
  );
}
