import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { useAuthStore, useIsAuthenticated } from '@/store/auth';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Shadow,
  Spacing,
} from '@/constants/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface MenuItem {
  icon: IoniconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function InitialsAvatar({ name, phone }: { name: string | null; phone: string }) {
  const initials = name
    ? name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : phone.slice(-2);

  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>
        <EmptyState
          icon="person-circle-outline"
          title="You're not logged in"
          description="Log in to access your profile, manage bookings, and view your activity."
          ctaLabel="Login"
          onCta={() => router.push('/(auth)/login')}
        />
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems: MenuItem[] = [
    {
      icon: 'create-outline',
      label: 'Edit Profile',
      onPress: () => router.push('/me/profile-edit'),
    },
    {
      icon: 'star-outline',
      label: 'My Reviews',
      onPress: () => {
        // TODO: Navigate to reviews screen
      },
    },
    {
      icon: 'download-outline',
      label: 'Export Data',
      onPress: () => {
        Alert.alert('Export Data', 'Your data export will be emailed to you shortly.');
      },
    },
    {
      icon: 'log-out-outline',
      label: 'Logout',
      onPress: handleLogout,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Profile</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <InitialsAvatar name={user.name} phone={user.phone} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user.name ?? 'No name set'}
            </Text>
            <Text style={styles.profilePhone}>{user.phone}</Text>
            {user.email ? (
              <Text style={styles.profileEmail}>{user.email}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={() => router.push('/me/profile-edit')}
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </Pressable>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Venues</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.menuCard}>
          {menuItems.map((item, idx) => (
            <React.Fragment key={item.label}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  item.onPress();
                }}
                style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
              >
                <View
                  style={[
                    styles.menuIconWrapper,
                    item.destructive && styles.menuIconDestructive,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={item.destructive ? Colors.error : Colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.menuLabel,
                    item.destructive && styles.menuLabelDestructive,
                  ]}
                >
                  {item.label}
                </Text>
                {!item.destructive ? (
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.zinc400}
                    style={styles.menuChevron}
                  />
                ) : null}
              </Pressable>
              {idx < menuItems.length - 1 ? (
                <View style={styles.menuDivider} />
              ) : null}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.version}>BoxCricket v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.zinc50,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  pageHeader: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  pageTitle: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  profileCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: Colors.zinc900,
  },
  profilePhone: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    ...Shadow.sm,
    marginBottom: Spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.zinc100,
  },
  menuCard: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    ...Shadow.sm,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  menuItemPressed: {
    backgroundColor: Colors.zinc50,
  },
  menuIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDestructive: {
    backgroundColor: '#fef2f2',
  },
  menuLabel: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.zinc800,
  },
  menuLabelDestructive: {
    color: Colors.error,
  },
  menuChevron: {
    marginLeft: 'auto',
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.zinc100,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  version: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
    marginTop: Spacing.sm,
  },
});
