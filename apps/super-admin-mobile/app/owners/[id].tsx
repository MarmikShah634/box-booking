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

interface OwnerVenue {
  id: string;
  name: string;
  status: StatusVariant;
}

interface OwnerDetail {
  id: string;
  name: string;
  email: string;
  phone?: string;
  kycStatus: StatusVariant;
  status: StatusVariant;
  venueCount: number;
  totalBookings: number;
  joinedAt: string;
  venues: OwnerVenue[];
}

interface OwnerDetailResponse {
  owner: OwnerDetail;
}

interface ActionResponse {
  success: boolean;
  owner: { status: StatusVariant; kycStatus: StatusVariant };
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

export default function OwnerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [owner, setOwner] = useState<OwnerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOwner = useCallback(async () => {
    if (!id) return;
    setError(null);
    const result = await superAdminApi<OwnerDetailResponse>(`/api/v1/super-admin/owners/${id}`);
    if (result.ok) {
      setOwner(result.data.owner);
    } else {
      setError(result.error);
    }
  }, [id]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchOwner();
      setLoading(false);
    })();
  }, [fetchOwner]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOwner();
    setRefreshing(false);
  }, [fetchOwner]);

  async function performAction(
    action: 'approve-kyc' | 'suspend' | 'reinstate',
    confirmTitle: string,
    confirmMessage: string
  ) {
    return new Promise<void>((resolve) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      Alert.alert(confirmTitle, confirmMessage, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
        {
          text: 'Confirm',
          style: action === 'suspend' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(action);
            const result = await superAdminApi<ActionResponse>(
              `/api/v1/super-admin/owners/${id}/${action}`,
              { method: 'POST' }
            );
            setActionLoading(null);
            if (result.ok) {
              setOwner((prev) =>
                prev
                  ? {
                      ...prev,
                      status: result.data.owner.status,
                      kycStatus: result.data.owner.kycStatus,
                    }
                  : prev
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
        <ErrorState message={error} onRetry={() => { setLoading(true); void fetchOwner().then(() => setLoading(false)); }} />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Shimmer height={28} width="60%" borderRadius={Radius.sm} style={{ marginBottom: 8 }} />
            <Shimmer height={16} width="80%" borderRadius={Radius.sm} style={{ marginBottom: 4 }} />
            <Shimmer height={16} width="50%" borderRadius={Radius.sm} />
          </View>
          <View style={[styles.card, { marginTop: Spacing.md }]}>
            <Shimmer height={40} borderRadius={Radius.sm} style={{ marginBottom: 8 }} />
            <Shimmer height={40} borderRadius={Radius.sm} style={{ marginBottom: 8 }} />
            <Shimmer height={40} borderRadius={Radius.sm} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!owner) return null;

  const isSuspended = owner.status === 'suspended';
  const isKycPending = owner.kycStatus === 'kyc_pending';
  const isKycApproved = owner.kycStatus === 'kyc_approved';

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
          <View style={styles.ownerAvatar}>
            <Text style={styles.avatarText}>{owner.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.ownerMeta}>
            <Text style={styles.ownerName}>{owner.name}</Text>
            <Text style={styles.ownerEmail}>{owner.email}</Text>
            <View style={styles.badgeRow}>
              <StatusBadge status={owner.status} />
              <StatusBadge status={owner.kycStatus} />
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{owner.venueCount}</Text>
            <Text style={styles.statLabel}>Venues</Text>
          </View>
          <View style={[styles.statCard, styles.statCardMiddle]}>
            <Text style={styles.statValue}>{owner.totalBookings}</Text>
            <Text style={styles.statLabel}>Total Bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{new Date(owner.joinedAt).getFullYear()}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>

        {/* Details */}
        <Text style={styles.sectionTitle}>Contact Details</Text>
        <View style={styles.card}>
          <DetailRow icon="mail-outline" label="Email" value={owner.email} />
          {owner.phone ? (
            <>
              <View style={styles.divider} />
              <DetailRow icon="call-outline" label="Phone" value={owner.phone} />
            </>
          ) : null}
          <View style={styles.divider} />
          <DetailRow
            icon="calendar-outline"
            label="Joined"
            value={new Date(owner.joinedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          />
        </View>

        {/* Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsCard}>
          {isKycPending && (
            <Button
              label="Approve KYC"
              onPress={() =>
                performAction(
                  'approve-kyc',
                  'Approve KYC',
                  `Approve KYC verification for ${owner.name}?`
                )
              }
              variant="emerald"
              fullWidth
              loading={actionLoading === 'approve-kyc'}
              disabled={actionLoading !== null}
              style={styles.actionButton}
            />
          )}
          {!isSuspended ? (
            <Button
              label="Suspend Owner"
              onPress={() =>
                performAction(
                  'suspend',
                  'Suspend Owner',
                  `This will prevent ${owner.name} from managing venues. Continue?`
                )
              }
              variant="danger"
              fullWidth
              loading={actionLoading === 'suspend'}
              disabled={actionLoading !== null}
              style={styles.actionButton}
            />
          ) : (
            <Button
              label="Reinstate Owner"
              onPress={() =>
                performAction(
                  'reinstate',
                  'Reinstate Owner',
                  `Restore platform access for ${owner.name}?`
                )
              }
              variant="emerald"
              fullWidth
              loading={actionLoading === 'reinstate'}
              disabled={actionLoading !== null}
              style={styles.actionButton}
            />
          )}
        </View>

        {/* Venues */}
        {owner.venues.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Venues ({owner.venues.length})</Text>
            <View style={styles.card}>
              {owner.venues.map((venue, index) => (
                <React.Fragment key={venue.id}>
                  {index > 0 ? <View style={styles.divider} /> : null}
                  <View style={styles.venueRow}>
                    <View style={styles.venueIcon}>
                      <Ionicons name="business-outline" size={16} color={Colors.textMuted} />
                    </View>
                    <Text style={styles.venueName} numberOfLines={1}>
                      {venue.name}
                    </Text>
                    <StatusBadge status={venue.status} />
                  </View>
                </React.Fragment>
              ))}
            </View>
          </>
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
  ownerAvatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  ownerMeta: {
    flex: 1,
    gap: Spacing.xs,
  },
  ownerName: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  ownerEmail: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
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
  statCardMiddle: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
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
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {},
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
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  venueIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venueName: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.textPrimary,
  },
});
