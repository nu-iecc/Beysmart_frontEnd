import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import 'react-native-reanimated';

import { ToastProvider } from '@/components/Toast';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [loaded] = useFonts({
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterBold: Inter_700Bold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Qebram: require('../assets/fonts/qebram-gxp51.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <ToastProvider>
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: 960, alignSelf: 'center' }}>
      <Stack>
        {/* Main index screen */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Show auth screens */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        {/* Show main app screens */}
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
        {/* Show tabs screens */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Home flow screens */}
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
        {/* Room flow screens */}
        <Stack.Screen name="(room)" options={{ headerShown: false }} />
        {/* Profile flow screens */}
        <Stack.Screen name="(profile actions)" options={{ headerShown: false }} />
        {/* Devices flow screens */}
        <Stack.Screen name="(devices)" options={{ headerShown: false }} />
        
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
      </View>
      </View>
      </ToastProvider>
    </ThemeProvider>
  );
}
