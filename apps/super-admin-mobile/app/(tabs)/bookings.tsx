import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookingRow, BookingRowData } from '@/components/bookings/BookingRow';
import { ShimmerRow } from '@/components/ui/Shimmer';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { superAdminApi } from '@/lib/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { StatusVariant } from '@/components/ui/StatusBadge';

type DateFilter = 'today' | 'week' | 'all';

const DATE_CHIPS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'all', label: 'All' },
];

interface ApiBooking {
  id: string;
  venueName: string;
  amount: number;
  status: StatusVariant;
  date: string;
}

interface BookingsResponse {
  bookings: ApiBooking[];
}

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<BookingRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');

  const fetchBookings = useCallback(async (filter: DateFilter) => {
    setError(null);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('period', filter);
    const qs = params.toString();
    const result = await superAdminApi<BookingsResponse>(
      `/api/v1/super-admin/bookings${qs ? `?${qs}` : ''}`
    );
    if (result.ok) {
      setBookings(result.data.bookings);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchBookings(dateFilter);
      setLoading(false);
    })();
  }, [fetchBookings, dateFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings(dateFilter);
    setRefreshing(false);
  }, [fetchBookings, dateFilter]);

  const handleFilterChange = (f: DateFilter) => {
    setDateFilter(f);
  };

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerArea}>
          <Text style={styles.screenTitle}>Bookings</Text>
        </View>
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            void fetchBookings(dateFilter).then(() => setLoading(false));
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Bookings</Text>
        <Text style={styles.countBadge}>{bookings.length}</Text>
      </View>

      {/* Date Filter Chips */}
      <View style={styles.chips}>
        {DATE_CHIPS.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => handleFilterChange(chip.key)}
            style={[styles.chip, dateFilter === chip.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, dateFilter === chip.key && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.listPadding}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerRow key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => <BookingRow booking={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No bookings found"
              description={
                dateFilter === 'today'
                  ? 'No bookings have been made today.'
                  : dateFilter === 'week'
                  ? 'No bookings this week.'
                  : 'No bookings recorded yet.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  countBadge: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  listPadding: {
    paddingHorizontal: Spacing.lg,
  },
});
