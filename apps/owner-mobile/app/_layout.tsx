import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useOutfitFonts } from '@/hooks/useFont';
import { useAuthStore } from '@/store/auth';
import { Colors } from '@/constants/theme';

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { accessToken, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!accessToken && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (accessToken && inAuthGroup) {
      router.replace('/(tabs)');
    } else if (accessToken && !inTabsGroup && !inAuthGroup) {
      // on deep link pages, fine
    }
  }, [accessToken, isHydrated, segments, router]);

  return null;
}

export default function RootLayout() {
  const { fontsLoaded, fontError } = useOutfitFonts();
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if ((!fontsLoaded && fontError === null) || !isHydrated) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthGate />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="bookings/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Booking Detail',
              headerTintColor: Colors.zinc900,
              headerStyle: { backgroundColor: Colors.zinc50 },
              headerTitleStyle: { fontFamily: 'Outfit_600SemiBold', fontSize: 17 },
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="venues/[id]"
            options={{
              headerShown: true,
              headerTitle: 'Venue Detail',
              headerTintColor: Colors.zinc900,
              headerStyle: { backgroundColor: Colors.zinc50 },
              headerTitleStyle: { fontFamily: 'Outfit_600SemiBold', fontSize: 17 },
              animation: 'slide_from_right',
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
});
