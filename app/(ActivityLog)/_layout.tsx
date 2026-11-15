import { Stack } from 'expo-router';
import React from 'react';

export default function ActivityLogLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActivityLog" />
    </Stack>
  );
}
