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
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBadge, StatusVariant } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Shimmer } from '@/components/ui/Shimmer';
import { ErrorState } from '@/components/ui/EmptyState';
import { superAdminApi } from '@/lib/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface UserDetail {
  id: string;
  phone: string;
  name: string;
  email?: string;
  bookingCount: number;
  joinedAt: string;
  status: StatusVariant;
  lastBookingAt?: string;
}

interface UserDetailResponse {
  user: UserDetail;
}

interface ActionResponse {
  success: boolean;
  user: { status: StatusVariant };
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color={Colors.textSecondary} />
      </View>
      <View style={styles.detailInfo}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!id) return;
    setError(null);
    const result = await superAdminApi<UserDetailResponse>(`/api/v1/super-admin/users/${id}`);
    if (result.ok) {
      setUser(result.data.user);
    } else {
      setError(result.error);
    }
  }, [id]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchUser();
      setLoading(false);
    })();
  }, [fetchUser]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  }, [fetchUser]);

  async function performAction(
    action: 'block' | 'unblock',
    confirmTitle: string,
    confirmMessage: string
  ) {
    return new Promise<void>((resolve) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert(confirmTitle, confirmMessage, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
        {
          text: 'Confirm',
          style: action === 'block' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(action);
            const result = await superAdminApi<ActionResponse>(
              `/api/v1/super-admin/users/${id}/${action}`,
              { method: 'POST' }
            );
            setActionLoading(null);
            if (result.ok) {
              setUser((prev) =>
                prev ? { ...prev, status: result.data.user.status } : prev
              );
            } else {
              Alert.alert('Action Failed', result.error);
            }
            resolve();
          },
        },
      ]);
    });
  }

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            void fetchUser().then(() => setLoading(false));
          }}
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Shimmer height={28} width="60%" borderRadius={Radius.sm} style={{ marginBottom: 8 }} />
            <Shimmer height={16} width="70%" borderRadius={Radius.sm} style={{ marginBottom: 4 }} />
            <Shimmer height={24} width={100} borderRadius={Radius.full} />
          </View>
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <Shimmer height={40} borderRadius={Radius.sm} style={{ marginBottom: 8 }} />
            <Shimmer height={40} borderRadius={Radius.sm} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!user) return null;

  const isBlocked = user.status === 'blocked';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
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
        {/* Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={28} color={Colors.textSecondary} />
          </View>
          <View style={styles.userMeta}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userPhone}>{user.phone}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge status={user.status} />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{user.bookingCount}</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={[styles.statCard, styles.statCardRight]}>
            <Text style={styles.statValue}>
              {new Date(user.joinedAt).toLocaleDateString('en-IN', {
                month: 'short',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>

        {/* Details */}
        <Text style={styles.sectionTitle}>Contact Information</Text>
        <View style={styles.card}>
          <DetailRow icon="call-outline" label="Phone" value={user.phone} />
          {user.email ? (
            <>
              <View style={styles.divider} />
              <DetailRow icon="mail-outline" label="Email" value={user.email} />
            </>
          ) : null}
          <View style={styles.divider} />
          <DetailRow
            icon="calendar-outline"
            label="Joined On"
            value={new Date(user.joinedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
          {user.lastBookingAt ? (
            <>
              <View style={styles.divider} />
              <DetailRow
                icon="time-outline"
                label="Last Booking"
                value={new Date(user.lastBookingAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              />
            </>
          ) : null}
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsCard}>
          {!isBlocked ? (
            <Button
              label="Block User"
              onPress={() =>
                performAction(
                  'block',
                  'Block User',
                  `Block ${user.name} from making bookings? They will not be able to use the platform.`
                )
              }
              variant="danger"
              fullWidth
              loading={actionLoading === 'block'}
              disabled={actionLoading !== null}
            />
          ) : (
            <Button
              label="Unblock User"
              onPress={() =>
                performAction(
                  'unblock',
                  'Unblock User',
                  `Restore platform access for ${user.name}?`
                )
              }
              variant="emerald"
              fullWidth
              loading={actionLoading === 'unblock'}
              disabled={actionLoading !== null}
            />
          )}
        </View>

        {/* Status Note */}
        {isBlocked ? (
          <View style={styles.blockedNotice}>
            <Ionicons name="ban-outline" size={16} color={Colors.error} />
            <Text style={styles.blockedNoticeText}>
              This user is blocked and cannot make bookings or log in.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    marginBottom: Spacing.md,
  },
  userAvatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  userMeta: {
    flex: 1,
    gap: Spacing.xs,
  },
  userName: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  userPhone: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    alignItems: 'center',
  },
  statCardRight: {
    flex: 2,
  },
  statValue: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  actionsCard: {
    marginBottom: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceAlt,
    marginLeft: Spacing.lg + 32,
  },
  blockedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  blockedNoticeText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.error,
    lineHeight: 20,
  },
});
