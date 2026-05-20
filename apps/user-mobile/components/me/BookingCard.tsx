import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, Radius, Shadow, Spacing } from '@/constants/theme';

export type BookingStatus =
  | 'confirmed'
  | 'pending'
  | 'cancelled'
  | 'completed'
  | 'held';

export interface BookingCardData {
  id: string;
  venueName: string;
  city: string;
  boxName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
  status: BookingStatus;
}

interface BookingCardProps {
  booking: BookingCardData;
  onPress: (id: string) => void;
  style?: ViewStyle;
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
    label: 'Pending',
    bg: '#fef9c3',
    text: Colors.warning,
    icon: 'time',
  },
  held: {
    label: 'Hold',
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

export function BookingCard({ booking, onPress, style }: BookingCardProps) {
  const statusConfig = STATUS_CONFIG[booking.status];

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(booking.id);
      }}
      style={[styles.card, style]}
    >
      <View style={styles.header}>
        <View style={styles.venueInfo}>
          <Text style={styles.venueName} numberOfLines={1}>
            {booking.venueName}
          </Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={Colors.zinc400} />
            <Text style={styles.city}>{booking.city}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Ionicons name={statusConfig.icon} size={12} color={statusConfig.text} />
          <Text style={[styles.statusText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Ionicons name="cube-outline" size={14} color={Colors.zinc400} />
          <Text style={styles.detailLabel}>{booking.boxName}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={14} color={Colors.zinc400} />
          <Text style={styles.detailLabel}>{booking.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={14} color={Colors.zinc400} />
          <Text style={styles.detailLabel}>
            {booking.startTime} – {booking.endTime}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalPrice}>
          &#8377;{booking.totalPrice.toLocaleString('en-IN')}
        </Text>
      </View>
    </Pressable>
  );
}

export function BookingCardSkeleton() {
  return (
    <View style={[styles.card, styles.skeletonCard]}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: '60%', marginTop: 6 }]} />
      <View style={[styles.skeletonLine, { width: '80%', marginTop: 16 }]} />
      <View style={[styles.skeletonLine, { width: '70%', marginTop: 6 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.zinc100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  venueInfo: {
    flex: 1,
    gap: 3,
  },
  venueName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.zinc900,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  city: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.zinc100,
    marginVertical: Spacing.sm,
  },
  details: {
    gap: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc600,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.zinc100,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  totalPrice: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  // Skeleton
  skeletonCard: {
    opacity: 0.6,
  },
  skeletonLine: {
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.zinc200,
    width: '90%',
  },
});
