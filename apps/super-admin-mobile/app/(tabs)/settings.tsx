import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { Shimmer } from '@/components/ui/Shimmer';
import { ErrorState } from '@/components/ui/EmptyState';
import { superAdminApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface PlatformSettings {
  commissionRate: number;
  activeCities: number;
  platformName: string;
  supportEmail?: string;
}

interface SettingsResponse {
  settings: PlatformSettings;
}

function SettingRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={18} color={Colors.textSecondary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={[styles.settingValue, valueColor ? { color: valueColor } : null]}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { admin, clearAuth } = useAuthStore();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchSettings = useCallback(async () => {
    setError(null);
    const result = await superAdminApi<SettingsResponse>(
      '/api/v1/super-admin/platform-settings'
    );
    if (result.ok) {
      setSettings(result.data.settings);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchSettings();
      setLoading(false);
    })();
  }, [fetchSettings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSettings();
    setRefreshing(false);
  }, [fetchSettings]);

  function handleLogout() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from the super admin panel?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await clearAuth();
            setLoggingOut(false);
          },
        },
      ]
    );
  }

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerArea}>
          <Text style={styles.screenTitle}>Settings</Text>
        </View>
        <ErrorState message={error} onRetry={() => { setLoading(true); void fetchSettings().then(() => setLoading(false)); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.headerArea}>
          <Text style={styles.screenTitle}>Settings</Text>
        </View>

        {/* Admin Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.profileRole}>Super Administrator</Text>
            <Text style={styles.profileEmail}>{admin?.email ?? '—'}</Text>
          </View>
        </View>

        {/* Platform Settings */}
        <Text style={styles.sectionTitle}>Platform Configuration</Text>
        <View style={styles.card}>
          {loading ? (
            <>
              <Shimmer height={48} borderRadius={Radius.sm} style={styles.shimmerRow} />
              <Shimmer height={48} borderRadius={Radius.sm} style={styles.shimmerRow} />
              <Shimmer height={48} borderRadius={Radius.sm} />
            </>
          ) : settings ? (
            <>
              <SettingRow
                icon="cash-outline"
                label="Commission Rate"
                value={`${settings.commissionRate}%`}
                valueColor={Colors.emerald}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="location-outline"
                label="Active Cities"
                value={settings.activeCities.toString()}
              />
              <View style={styles.divider} />
              <SettingRow
                icon="globe-outline"
                label="Platform Name"
                value={settings.platformName}
              />
              {settings.supportEmail ? (
                <>
                  <View style={styles.divider} />
                  <SettingRow
                    icon="mail-outline"
                    label="Support Email"
                    value={settings.supportEmail}
                  />
                </>
              ) : null}
            </>
          ) : null}
        </View>

        {/* App Info */}
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.card}>
          <SettingRow icon="phone-portrait-outline" label="App Version" value="1.0.0" />
          <View style={styles.divider} />
          <SettingRow icon="server-outline" label="Environment" value={process.env.EXPO_PUBLIC_API_URL ?? 'localhost:3001'} />
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.dangerRow}>
            <View>
              <Text style={styles.dangerLabel}>Sign Out</Text>
              <Text style={styles.dangerSub}>You will need to sign in again</Text>
            </View>
            <Button
              label={loggingOut ? 'Signing out...' : 'Sign Out'}
              onPress={handleLogout}
              variant="danger"
              loading={loggingOut}
              style={styles.logoutButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  headerArea: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  profileRole: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  dangerTitle: {
    color: Colors.error,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  dangerCard: {
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  shimmerRow: {
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textMuted,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  settingValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceAlt,
    marginLeft: Spacing.lg + 36,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  dangerLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dangerSub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
  logoutButton: {
    paddingHorizontal: Spacing.md,
    minWidth: 100,
  },
});
