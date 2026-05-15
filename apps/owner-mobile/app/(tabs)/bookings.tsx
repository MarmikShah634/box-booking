import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BookingRow } from '@/components/bookings/BookingRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerRow } from '@/components/ui/Shimmer';
import { ownerApi } from '@/lib/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import type { BookingRowData } from '@/components/bookings/BookingRow';

interface EnrichedBooking extends BookingRowData {
  rawDate: string;
  rawStatus: string;
}

type FilterKey = 'ALL' | 'TODAY' | 'UPCOMING' | 'COMPLETED';

interface FilterChip {
  key: FilterKey;
  label: string;
}

const FILTERS: FilterChip[] = [
  { key: 'ALL', label: 'All' },
  { key: 'TODAY', label: 'Today' },
  { key: 'UPCOMING', label: 'Upcoming' },
  { key: 'COMPLETED', label: 'Completed' },
];

interface ApiBooking {
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

interface BookingsResponse {
  bookings: ApiBooking[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = (h ?? 0) >= 12 ? 'PM' : 'AM';
  const hour = (h ?? 0) % 12 || 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const t = new Date();
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
}

function isFuture(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

export default function BookingsScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('ALL');
  const [allBookings, setAllBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    const result = await ownerApi<BookingsResponse>('/api/v1/bookings?role=owner');
    if (result.ok) {
      setAllBookings(
        result.data.bookings.map((b) => ({
          id: b.id,
          venueName: b.venueName,
          boxName: b.boxName,
          dateLabel: formatDate(b.date),
          timeLabel: `${formatTime(b.startTime)} – ${formatTime(b.endTime)}`,
          customerPhone: b.customerPhone,
          status: b.status,
          amount: b.totalAmount,
          rawDate: b.date,
          rawStatus: b.status,
        }))
      );
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchBookings().finally(() => setLoading(false));
  }, [fetchBookings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const handleFilterChange = (key: FilterKey) => {
    void Haptics.selectionAsync();
    setActiveFilter(key);
  };

  const filteredBookings = allBookings.filter((b) => {
    if (activeFilter === 'TODAY') return isToday(b.rawDate);
    if (activeFilter === 'UPCOMING') return isFuture(b.rawDate) && b.rawStatus !== 'COMPLETED' && b.rawStatus !== 'CANCELLED';
    if (activeFilter === 'COMPLETED') return b.rawStatus === 'COMPLETED';
    return true;
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>Bookings</Text>
        <Text style={styles.count}>
          {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
        </Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.chip, activeFilter === f.key && styles.chipActive]}
              onPress={() => handleFilterChange(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, activeFilter === f.key && styles.chipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.shimmerContainer}>
          {[...Array(5)].map((_, i) => (
            <View key={i} style={styles.shimmerRow}>
              <ShimmerRow lines={3} avatarSize={40} />
            </View>
          ))}
        </View>
      ) : error !== null ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.zinc400} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { void fetchBookings(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            filteredBookings.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <BookingRow
              booking={item}
              onPress={() => router.push(`/bookings/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={activeFilter === 'ALL' ? 'No bookings yet' : `No ${FILTERS.find((f) => f.key === activeFilter)?.label.toLowerCase() ?? ''} bookings`}
              description={
                activeFilter === 'ALL'
                  ? 'Bookings from your venues will appear here.'
                  : 'Try a different filter to see your bookings.'
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
    backgroundColor: Colors.zinc50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  heading: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.zinc900,
  },
  count: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.zinc500,
  },
  filterWrap: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  filters: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.zinc100,
  },
  chipActive: {
    backgroundColor: Colors.primaryLight,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.zinc600,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  shimmerContainer: {
    margin: Spacing.lg,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
  },
  shimmerRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.zinc500,
    textAlign: 'center',
  },
  retryText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
});
