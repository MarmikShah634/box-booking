import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFont } from '@/hooks/useFont';
import { useAuthStore } from '@/store/auth';
import { getItem, StorageKeys } from '@/lib/storage';
import { Colors } from '@/constants/theme';

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { accessToken, hydrated, setAuth, setHydrated } = useAuthStore();

  useEffect(() => {
    async function hydrate() {
      try {
        const token = await getItem(StorageKeys.ACCESS_TOKEN);
        const adminRaw = await getItem(StorageKeys.ADMIN_DATA);
        if (token && adminRaw) {
          const admin = JSON.parse(adminRaw) as { id: string; email: string };
          setAuth(token, admin);
        }
      } finally {
        setHydrated(true);
      }
    }
    void hydrate();
  }, [setAuth, setHydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const inAuth = segments[0] === '(auth)';
    if (!accessToken && !inAuth) {
      router.replace('/(auth)/login');
    } else if (accessToken && inAuth) {
      router.replace('/(tabs)');
    }
  }, [hydrated, accessToken, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const fontsLoaded = useFont();

  if (!fontsLoaded) {
    return <View style={styles.splash} />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <AuthGate>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="owners/[id]"
              options={{
                headerShown: true,
                title: 'Owner Detail',
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: { fontFamily: 'Outfit_600SemiBold' },
                headerBackTitle: 'Back',
              }}
            />
            <Stack.Screen
              name="users/[id]"
              options={{
                headerShown: true,
                title: 'User Detail',
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.textPrimary,
                headerTitleStyle: { fontFamily: 'Outfit_600SemiBold' },
                headerBackTitle: 'Back',
              }}
            />
          </Stack>
        </AuthGate>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  splash: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
});
