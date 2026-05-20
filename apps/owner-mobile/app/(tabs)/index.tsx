import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatTile } from '@/components/ui/StatTile';
import { Shimmer, ShimmerCard, ShimmerRow } from '@/components/ui/Shimmer';
import { BookingRow } from '@/components/bookings/BookingRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ownerApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants/theme';
import type { BookingRowData } from '@/components/bookings/BookingRow';

interface DashboardStats {
  todayRevenue: number;
  todayBookings: number;
  monthRevenue: number;
  occupancyRate: number;
  revenuetrend?: 'up' | 'down';
  bookingsTrend?: 'up' | 'down';
}

interface DashboardBooking {
  id: string;
  venueName: string;
  boxName?: string;
  startTime: string;
  endTime: string;
  date: string;
  customerPhone: string;
  status: string;
  totalAmount: number;
}

interface DashboardResponse {
  stats: DashboardStats;
  recentBookings: DashboardBooking[];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = (h ?? 0) >= 12 ? 'PM' : 'AM';
  const hour = (h ?? 0) % 12 || 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const owner = useAuthStore((s) => s.owner);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const result = await ownerApi<DashboardResponse>('/api/v1/owners/me/stats?period=today');
    if (result.ok) {
      setData(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const firstName = owner?.name?.split(' ')[0] ?? 'there';

  const bookingRows: BookingRowData[] = (data?.recentBookings ?? []).slice(0, 5).map((b) => ({
    id: b.id,
    venueName: b.venueName,
    boxName: b.boxName,
    dateLabel: formatDate(b.date),
    timeLabel: `${formatTime(b.startTime)} – ${formatTime(b.endTime)}`,
    customerPhone: b.customerPhone,
    status: b.status,
    amount: b.totalAmount,
  }));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.ownerName}>{firstName}</Text>
          </View>
          <View style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.zinc700} />
          </View>
        </View>

        {/* Stats grid */}
        <Text style={styles.sectionTitle}>Overview</Text>

        {loading ? (
          <View style={styles.statsGrid}>
            <ShimmerCard height={100} />
            <ShimmerCard height={100} />
            <ShimmerCard height={100} />
            <ShimmerCard height={100} />
          </View>
        ) : error !== null ? (
          <View style={styles.errorBox}>
            <Ionicons name="cloud-offline-outline" size={28} color={Colors.zinc400} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => { void fetchData(); }}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statsGrid}>
            <View style={styles.statsRow}>
              <StatTile
                label="Today's Revenue"
                value={`₹${(data?.stats.todayRevenue ?? 0).toLocaleString('en-IN')}`}
                subtext="vs yesterday"
                trend={data?.stats.revenuetrend}
                style={styles.statTile}
              />
              <View style={styles.statGap} />
              <StatTile
                label="Today's Bookings"
                value={String(data?.stats.todayBookings ?? 0)}
                subtext="slots booked"
                trend={data?.stats.bookingsTrend}
                style={styles.statTile}
              />
            </View>
            <View style={[styles.statsRow, styles.statsRowTop]}>
              <StatTile
                label="Month Revenue"
                value={`₹${(data?.stats.monthRevenue ?? 0).toLocaleString('en-IN')}`}
                subtext="this month"
                style={styles.statTile}
              />
              <View style={styles.statGap} />
              <StatTile
                label="Occupancy Rate"
                value={`${data?.stats.occupancyRate ?? 0}%`}
                subtext="today"
                style={styles.statTile}
              />
            </View>
          </View>
        )}

        {/* Today's bookings */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Bookings</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/bookings')}>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.shimmerList}>
            {[...Array(3)].map((_, i) => (
              <View key={i} style={styles.shimmerRowWrap}>
                <ShimmerRow lines={3} avatarSize={40} />
              </View>
            ))}
          </View>
        ) : bookingRows.length === 0 ? (
          <View style={styles.inlineEmpty}>
            <EmptyState
              icon="calendar-outline"
              title="No bookings today"
              description="New bookings will appear here."
              style={styles.inlineEmptyInner}
            />
          </View>
        ) : (
          <View>
            {bookingRows.map((b) => (
              <BookingRow
                key={b.id}
                booking={b}
                onPress={() => router.push(`/bookings/${b.id}`)}
              />
            ))}
            {(data?.recentBookings.length ?? 0) > 5 && (
              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => router.push('/(tabs)/bookings')}
              >
                <Text style={styles.viewAllBtnText}>View all bookings</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Shimmer for stats placeholder */}
        {!loading && data === null && (
          <View style={styles.statsGrid}>
            <Shimmer width="100%" height={80} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.zinc50,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.zinc500,
  },
  ownerName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.zinc900,
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lg,
    color: Colors.zinc900,
    marginBottom: Spacing.md,
  },
  viewAllText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
  },
  statsRowTop: {
    marginTop: Spacing.sm,
  },
  statTile: {
    flex: 1,
  },
  statGap: {
    width: Spacing.sm,
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.zinc500,
    textAlign: 'center',
  },
  retryText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
  shimmerList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  shimmerRowWrap: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  inlineEmpty: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
  },
  inlineEmptyInner: {
    paddingVertical: Spacing.xl,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: Radius.md,
    marginTop: Spacing.xs,
  },
  viewAllBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
});
