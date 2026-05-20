import React, { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Shimmer } from '@/components/ui/Shimmer';
import { BookingStatus } from '@/components/me/BookingCard';
import { userApi } from '@/lib/api';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Shadow,
  Spacing,
} from '@/constants/theme';

interface BookingDetail {
  id: string;
  status: BookingStatus;
  venueName: string;
  venueCity: string;
  venueAddress: string;
  boxName: string;
  date: string;
  startTime: string;
  endTime: string;
  basePrice: number;
  platformFee: number;
  gst: number;
  totalPrice: number;
  paymentId: string | null;
  createdAt: string;
  cancelledAt: string | null;
}

interface BookingDetailResponse {
  booking: BookingDetail;
}

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  confirmed: {
    label: 'Confirmed',
    bg: Colors.primaryLight,
    text: Colors.primary,
    icon: 'checkmark-circle',
  },
  pending: {
    label: 'Pending Payment',
    bg: '#fef9c3',
    text: Colors.warning,
    icon: 'time',
  },
  held: {
    label: 'On Hold',
    bg: '#fff7ed',
    text: Colors.warning,
    icon: 'pause-circle',
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#fef2f2',
    text: Colors.error,
    icon: 'close-circle',
  },
  completed: {
    label: 'Completed',
    bg: Colors.zinc100,
    text: Colors.zinc600,
    icon: 'checkmark-done-circle',
  },
};

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
      <View style={styles.detailIconWrapper}>
        <Ionicons name={icon} size={16} color={Colors.primary} />
      </View>
      <View style={styles.detailInfo}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

function BookingDetailSkeleton() {
  return (
    <ScrollView contentContainerStyle={styles.skeletonContent}>
      <Shimmer width="100%" height={80} borderRadius={Radius.lg} />
      <Shimmer width="100%" height={160} borderRadius={Radius.lg} style={{ marginTop: 16 }} />
      <Shimmer width="100%" height={120} borderRadius={Radius.lg} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function fetchBooking() {
      if (!id) return;
      const result = await userApi.get<BookingDetailResponse>(`/bookings/${id}`);
      if (!result.ok) {
        setError(result.error);
      } else {
        setBooking(result.data.booking);
      }
      setLoading(false);
    }
    fetchBooking();
  }, [id]);

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking? Refunds (if applicable) will be processed within 5–7 business days.',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            const result = await userApi.post<{ message: string }>(
              `/bookings/${id}/cancel`,
            );
            setIsCancelling(false);

            if (!result.ok) {
              Alert.alert('Error', result.error);
              return;
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setBooking((prev) =>
              prev ? { ...prev, status: 'cancelled', cancelledAt: new Date().toISOString() } : prev,
            );
          },
        },
      ],
    );
  };

  const canCancel =
    booking &&
    ['confirmed', 'pending', 'held'].includes(booking.status);

  const statusConfig = booking ? STATUS_CONFIG[booking.status] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBack}>
          <Ionicons name="arrow-back" size={20} color={Colors.zinc800} />
        </Pressable>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <BookingDetailSkeleton />
      ) : error || !booking ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Booking not found"
          description={error || 'This booking could not be loaded.'}
          ctaLabel="Go back"
          onCta={() => router.back()}
          style={styles.errorState}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Status Banner */}
          {statusConfig ? (
            <View style={[styles.statusBanner, { backgroundColor: statusConfig.bg }]}>
              <Ionicons
                name={statusConfig.icon}
                size={24}
                color={statusConfig.text}
              />
              <View>
                <Text style={[styles.statusLabel, { color: statusConfig.text }]}>
                  {statusConfig.label}
                </Text>
                <Text style={styles.bookingId}>Booking #{booking.id.slice(0, 8)}</Text>
              </View>
            </View>
          ) : null}

          {/* Venue & Box Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Venue Details</Text>
            <DetailRow
              icon="business-outline"
              label="Venue"
              value={booking.venueName}
            />
            <View style={styles.rowDivider} />
            <DetailRow
              icon="location-outline"
              label="Location"
              value={`${booking.venueAddress}, ${booking.venueCity}`}
            />
            <View style={styles.rowDivider} />
            <DetailRow
              icon="cube-outline"
              label="Box"
              value={booking.boxName}
            />
          </View>

          {/* Time & Date */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Schedule</Text>
            <DetailRow
              icon="calendar-outline"
              label="Date"
              value={booking.date}
            />
            <View style={styles.rowDivider} />
            <DetailRow
              icon="time-outline"
              label="Time"
              value={`${booking.startTime} – ${booking.endTime}`}
            />
          </View>

          {/* Price Breakdown */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Payment</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Base price</Text>
              <Text style={styles.priceValue}>
                &#8377;{booking.basePrice.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Platform fee</Text>
              <Text style={styles.priceValue}>
                &#8377;{booking.platformFee.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>
                &#8377;{booking.gst.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.priceTotalLabel}>Total paid</Text>
              <Text style={styles.priceTotalValue}>
                &#8377;{booking.totalPrice.toLocaleString('en-IN')}
              </Text>
            </View>
            {booking.paymentId ? (
              <Text style={styles.paymentId}>Payment ID: {booking.paymentId}</Text>
            ) : null}
          </View>

          {/* Booking meta */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              Booked on{' '}
              {new Date(booking.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
            {booking.cancelledAt ? (
              <Text style={[styles.metaText, { color: Colors.error }]}>
                Cancelled on{' '}
                {new Date(booking.cancelledAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            ) : null}
          </View>

          {/* Cancel Button */}
          {canCancel ? (
            <Button
              variant="outline"
              size="lg"
              fullWidth
              loading={isCancelling}
              onPress={handleCancel}
              style={styles.cancelButton}
            >
              Cancel Booking
            </Button>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.zinc50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.zinc900,
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  statusLabel: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
  },
  bookingId: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
    marginBottom: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailInfo: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.zinc400,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.zinc800,
  },
  rowDivider: {
    height: 1,
    backgroundColor: Colors.zinc100,
    marginHorizontal: 40,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc600,
  },
  priceValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: Colors.zinc800,
  },
  priceDivider: {
    height: 1,
    backgroundColor: Colors.zinc100,
  },
  priceTotalLabel: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  priceTotalValue: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
  },
  paymentId: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
    marginTop: Spacing.xs,
  },
  metaRow: {
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
    textAlign: 'center',
  },
  cancelButton: {
    borderColor: Colors.error,
  },
  errorState: {
    flex: 1,
  },
  // Skeleton
  skeletonContent: {
    padding: Spacing.md,
  },
});
