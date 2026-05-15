import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize } from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  name: IoniconName;
  focusedName: IoniconName;
  color: string;
  focused: boolean;
  size: number;
}

function TabIcon({ name, focusedName, color, focused, size }: TabIconProps) {
  return <Ionicons name={focused ? focusedName : name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.zinc400,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="home-outline"
              focusedName="home"
              color={color}
              focused={focused}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="calendar-outline"
              focusedName="calendar"
              color={color}
              focused={focused}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="person-outline"
              focusedName="person"
              color={color}
              focused={focused}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopColor: Colors.zinc100,
    borderTopWidth: 1,
    paddingTop: 4,
    height: Platform.OS === 'ios' ? 84 : 64,
  },
  tabLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    marginBottom: Platform.OS === 'ios' ? 0 : 4,
  },
});
