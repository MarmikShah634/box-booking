import React, { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BookingCard,
  BookingCardData,
  BookingCardSkeleton,
  BookingStatus,
} from '@/components/me/BookingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { userApi } from '@/lib/api';
import { useAuthStore, useIsAuthenticated } from '@/store/auth';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from '@/constants/theme';

type Tab = 'upcoming' | 'past';

const UPCOMING_STATUSES: BookingStatus[] = ['confirmed', 'pending', 'held'];
const PAST_STATUSES: BookingStatus[] = ['completed', 'cancelled'];

interface BookingsResponse {
  bookings: BookingCardData[];
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.guardContainer}>
      <EmptyState
        icon="lock-closed-outline"
        title="Login to see your bookings"
        description="Track your upcoming matches, view booking history, and manage reservations all in one place."
        ctaLabel="Login"
        onCta={() => router.push('/(auth)/login')}
      />
      {children}
    </View>
  );
}

export default function BookingsScreen() {
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const [activeTab, setActiveTab] = useState<Tab>('upcoming');
  const [bookings, setBookings] = useState<BookingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated) return;
    setError('');
    const result = await userApi.get<BookingsResponse>('/bookings/me');
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setBookings(result.data.bookings ?? []);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchBookings().finally(() => setLoading(false));
  }, [isAuthenticated, fetchBookings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }, [fetchBookings]);

  const filteredBookings = bookings.filter((b) =>
    activeTab === 'upcoming'
      ? UPCOMING_STATUSES.includes(b.status)
      : PAST_STATUSES.includes(b.status),
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>My Bookings</Text>
        </View>
        <AuthGuard>{null}</AuthGuard>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>My Bookings</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {(['upcoming', 'past'] as Tab[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.list}>
            {[1, 2, 3].map((k) => (
              <BookingCardSkeleton key={k} />
            ))}
          </View>
        ) : error ? (
          <EmptyState
            icon="wifi-outline"
            title="Something went wrong"
            description={error}
            ctaLabel="Try again"
            onCta={() => {
              setLoading(true);
              fetchBookings().finally(() => setLoading(false));
            }}
          />
        ) : filteredBookings.length === 0 ? (
          <EmptyState
            icon={activeTab === 'upcoming' ? 'calendar-outline' : 'time-outline'}
            title={
              activeTab === 'upcoming'
                ? 'No upcoming bookings'
                : 'No past bookings'
            }
            description={
              activeTab === 'upcoming'
                ? 'Book a box cricket slot and it will appear here.'
                : 'Your completed and cancelled bookings will show up here.'
            }
            ctaLabel={activeTab === 'upcoming' ? 'Explore venues' : undefined}
            onCta={activeTab === 'upcoming' ? () => router.push('/(tabs)') : undefined}
          />
        ) : (
          <View style={styles.list}>
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onPress={(id) => router.push(`/me/booking/${id}`)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.zinc50,
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: Colors.zinc100,
    borderRadius: Radius.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.zinc500,
  },
  tabTextActive: {
    color: Colors.zinc900,
    fontFamily: FontFamily.semibold,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  list: {
    gap: Spacing.md,
  },
  guardContainer: {
    flex: 1,
  },
});
