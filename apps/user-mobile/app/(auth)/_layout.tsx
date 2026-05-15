import React from 'react';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.white },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" options={{ gestureEnabled: false }} />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
