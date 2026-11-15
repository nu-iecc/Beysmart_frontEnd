import { Stack } from 'expo-router';
import React from 'react';

export default function RoomGroupLayout() {
  return (
    <Stack>
      <Stack.Screen name="AddRoom" options={{ headerShown: false }} />
      <Stack.Screen name="AddRoomDone" options={{ headerShown: false }} />
    </Stack>
  );
}

