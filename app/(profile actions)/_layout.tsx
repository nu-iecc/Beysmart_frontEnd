import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile" />
      <Stack.Screen name="myHomes" />
      <Stack.Screen name="AccountSettings" />
      <Stack.Screen name="enterpassword" />
      <Stack.Screen name="Help&support" />
      
    </Stack>
  );
}
