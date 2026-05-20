import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Shimmer } from '@/components/ui/Shimmer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ownerApi } from '@/lib/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface BookingDetail {
  id: string;
  bookingRef: string;
  venueName: string;
  boxName: string;
  date: string;
  startTime: string;
  endTime: string;
  customerPhone: string;
  customerName: string;
  status: string;
  totalAmount: number;
  advancePaid: number;
  paymentStatus: string;
  createdAt: string;
}

interface BookingDetailResponse {
  booking: BookingDetail;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = (h ?? 0) >= 12 ? 'PM' : 'AM';
  const hour = (h ?? 0) % 12 || 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

interface DetailRowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color={Colors.zinc500} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = useCallback(async () => {
    if (!id) return;
    const result = await ownerApi<BookingDetailResponse>(`/api/v1/bookings/${id}`);
    if (result.ok) {
      setBooking(result.data.booking);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchBooking().finally(() => setLoading(false));
  }, [fetchBooking]);

  useEffect(() => {
    if (booking) {
      navigation.setOptions({ title: `Booking #${booking.bookingRef}` });
    }
  }, [booking, navigation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBooking();
    setRefreshing(false);
  }, [fetchBooking]);

  const handleNoShow = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Mark as No-Show',
      'This action will mark the customer as a no-show for this booking. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark No-Show',
          style: 'destructive',
          onPress: async () => {
            setSubmitting(true);
            const result = await ownerApi(`/api/v1/bookings/${id}/no-show`, {
              method: 'POST',
            });
            setSubmitting(false);
            if (result.ok) {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Done', 'Booking marked as no-show.');
              await fetchBooking();
            } else {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert('Error', result.error);
            }
          },
        },
      ]
    );
  };

  const canMarkNoShow =
    booking?.status === 'CONFIRMED' &&
    new Date(`${booking.date}T${booking.endTime}`) > new Date();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <Shimmer width="60%" height={24} style={styles.shimmerTitle} />
          <Shimmer width="100%" height={180} borderRadius={Radius.lg} style={styles.shimmerCard} />
          <Shimmer width="100%" height={240} borderRadius={Radius.lg} style={styles.shimmerCard} />
          <Shimmer width="100%" height={120} borderRadius={Radius.lg} style={styles.shimmerCard} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error !== null || booking === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <EmptyState
          icon="alert-circle-outline"
          title="Unable to load booking"
          description={error ?? 'This booking could not be found.'}
          ctaLabel="Try again"
          onCta={() => { void fetchBooking(); }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
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
        {/* Status + ref */}
        <View style={styles.topCard}>
          <View style={styles.topCardHeader}>
            <View>
              <Text style={styles.refLabel}>Booking Reference</Text>
              <Text style={styles.refValue}>#{booking.bookingRef}</Text>
            </View>
            <StatusBadge status={booking.status} />
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total Amount</Text>
            <Text style={styles.amount}>₹{booking.totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          {booking.advancePaid > 0 && (
            <View style={styles.advanceRow}>
              <Text style={styles.advanceLabel}>Advance Paid</Text>
              <Text style={styles.advanceValue}>₹{booking.advancePaid.toLocaleString('en-IN')}</Text>
            </View>
          )}
        </View>

        {/* Venue & Slot */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Details</Text>
          <DetailRow icon="business-outline" label="Venue" value={booking.venueName} />
          <View style={styles.rowDivider} />
          <DetailRow icon="grid-outline" label="Box" value={booking.boxName} />
          <View style={styles.rowDivider} />
          <DetailRow icon="calendar-outline" label="Date" value={formatDate(booking.date)} />
          <View style={styles.rowDivider} />
          <DetailRow
            icon="time-outline"
            label="Time Slot"
            value={`${formatTime(booking.startTime)} – ${formatTime(booking.endTime)}`}
          />
        </View>

        {/* Customer */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Customer</Text>
          <DetailRow icon="person-outline" label="Name" value={booking.customerName} />
          <View style={styles.rowDivider} />
          <DetailRow icon="call-outline" label="Phone" value={booking.customerPhone} />
        </View>

        {/* Payment */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <DetailRow
            icon="wallet-outline"
            label="Payment Status"
            value={booking.paymentStatus}
          />
          <View style={styles.rowDivider} />
          <DetailRow
            icon="receipt-outline"
            label="Booked On"
            value={new Date(booking.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit', month: 'short', year: 'numeric',
            })}
          />
        </View>

        {/* Action */}
        {canMarkNoShow && (
          <Button
            label="Mark as No-Show"
            onPress={handleNoShow}
            variant="outline"
            loading={submitting}
            style={styles.noShowBtn}
            textStyle={styles.noShowBtnText}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.zinc50,
  },
  loadingContent: {
    padding: Spacing.lg,
  },
  shimmerTitle: {
    marginBottom: Spacing.lg,
  },
  shimmerCard: {
    marginBottom: Spacing.md,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  topCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  refLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc500,
    marginBottom: 2,
  },
  refValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.zinc900,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.zinc100,
  },
  amountLabel: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.zinc600,
  },
  amount: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.primary,
  },
  advanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  advanceLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.zinc500,
  },
  advanceValue: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.zinc700,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
    color: Colors.zinc900,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  detailIcon: {
    width: 28,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc500,
    marginBottom: 2,
  },
  detailValue: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.base,
    color: Colors.zinc900,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.zinc100,
    marginLeft: 28 + Spacing.sm,
  },
  noShowBtn: {
    marginTop: Spacing.sm,
    borderColor: Colors.error,
  },
  noShowBtnText: {
    color: Colors.error,
  },
});
