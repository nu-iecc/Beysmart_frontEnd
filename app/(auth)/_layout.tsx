import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="loginpage" />
      <Stack.Screen name="emaillogin" />
      <Stack.Screen name="phonelogin" />
      <Stack.Screen name="verifycode" />
      <Stack.Screen name="index" />
      <Stack.Screen name="resetpassword" />
      <Stack.Screen name="resetbyemail" />
      <Stack.Screen name="resetbyphone" />
      <Stack.Screen name="newpassword" />
      <Stack.Screen name="Resetcomplete" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="Complete-Registeration" />
    </Stack>
  );
}