import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { KpiTile } from '@/components/ui/KpiTile';
import { BookingRow, BookingRowData } from '@/components/bookings/BookingRow';
import { ShimmerCard, ShimmerRow } from '@/components/ui/Shimmer';
import { ErrorState } from '@/components/ui/EmptyState';
import { superAdminApi } from '@/lib/api';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants/theme';
import { StatusVariant } from '@/components/ui/StatusBadge';

interface PlatformStats {
  gmvThisMonth: number;
  activeVenues: number;
  totalUsers: number;
  bookingsToday: number;
  gmvChange?: number;
  venueChange?: number;
  userChange?: number;
  bookingChange?: number;
}

interface RecentBooking {
  id: string;
  venueName: string;
  amount: number;
  status: StatusVariant;
  date: string;
}

interface StatsResponse {
  stats: PlatformStats;
  recentBookings: RecentBooking[];
}

function formatGmv(amount: number): string {
  if (amount >= 10_00_000) {
    return `₹${(amount / 10_00_000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    const result = await superAdminApi<StatsResponse>('/api/v1/super-admin/stats');
    if (result.ok) {
      setStats(result.data.stats);
      setRecentBookings(result.data.recentBookings.slice(0, 5));
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    })();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={error} onRetry={() => { setLoading(true); void fetchData().then(() => setLoading(false)); }} />
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.headerTitle}>
              <View style={styles.redDot} />
              <Text style={styles.headerText}>Platform Operations</Text>
            </View>
            <Text style={styles.headerSub}>Real-time overview</Text>
          </View>
          <View style={styles.adminBadge}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.adminBadgeText}>Admin</Text>
          </View>
        </View>

        {/* KPI Grid */}
        <Text style={styles.sectionTitle}>Key Metrics</Text>
        {loading ? (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <ShimmerCard style={styles.kpiCell} />
              <View style={{ width: Spacing.sm }} />
              <ShimmerCard style={styles.kpiCell} />
            </View>
            <View style={{ height: Spacing.sm }} />
            <View style={styles.kpiRow}>
              <ShimmerCard style={styles.kpiCell} />
              <View style={{ width: Spacing.sm }} />
              <ShimmerCard style={styles.kpiCell} />
            </View>
          </View>
        ) : stats ? (
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              <KpiTile
                label="GMV This Month"
                value={formatGmv(stats.gmvThisMonth)}
                sub="Gross merchandise value"
                change={stats.gmvChange}
                icon="trending-up-outline"
              />
              <View style={{ width: Spacing.sm }} />
              <KpiTile
                label="Active Venues"
                value={stats.activeVenues.toString()}
                change={stats.venueChange}
                icon="business-outline"
              />
            </View>
            <View style={{ height: Spacing.sm }} />
            <View style={styles.kpiRow}>
              <KpiTile
                label="Total Users"
                value={stats.totalUsers.toLocaleString('en-IN')}
                change={stats.userChange}
                icon="people-outline"
              />
              <View style={{ width: Spacing.sm }} />
              <KpiTile
                label="Bookings Today"
                value={stats.bookingsToday.toString()}
                change={stats.bookingChange}
                icon="calendar-outline"
              />
            </View>
          </View>
        ) : null}

        {/* Recent Activity */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Text style={styles.sectionSub}>Last 5 bookings</Text>
        </View>

        {loading ? (
          <>
            <ShimmerRow />
            <ShimmerRow />
            <ShimmerRow />
          </>
        ) : recentBookings.length === 0 ? (
          <View style={styles.emptyActivity}>
            <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
            <Text style={styles.emptyText}>No recent bookings</Text>
          </View>
        ) : (
          recentBookings.map((booking) => (
            <BookingRow key={booking.id} booking={booking} />
          ))
        )}
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
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
  },
  headerText: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  adminBadgeText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiGrid: {
    marginBottom: Spacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
  },
  kpiCell: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionSub: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
  emptyActivity: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
});
