import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize } from '@/constants/theme';

type IoniconsName = keyof typeof Ionicons.glyphMap;

function tabIcon(focused: boolean, name: IoniconsName, focusedName: IoniconsName) {
  return (
    <Ionicons
      name={focused ? focusedName : name}
      size={24}
      color={focused ? Colors.primary : Colors.textMuted}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.surfaceAlt,
          borderTopWidth: 1,
          paddingTop: 4,
          height: 60,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontFamily: FontFamily.medium,
          fontSize: FontSize.xs,
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) =>
            tabIcon(focused, 'grid-outline', 'grid'),
        }}
      />
      <Tabs.Screen
        name="owners"
        options={{
          title: 'Owners',
          tabBarIcon: ({ focused }) =>
            tabIcon(focused, 'business-outline', 'business'),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ focused }) =>
            tabIcon(focused, 'people-outline', 'people'),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ focused }) =>
            tabIcon(focused, 'calendar-outline', 'calendar'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) =>
            tabIcon(focused, 'settings-outline', 'settings'),
        }}
      />
    </Tabs>
  );
}
