import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, StatusVariant } from '@/components/ui/StatusBadge';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

export interface BookingRowData {
  id: string;
  venueName: string;
  amount: number;
  status: StatusVariant;
  date?: string;
}

interface BookingRowProps {
  booking: BookingRowData;
  onPress?: () => void;
}

function truncateId(id: string): string {
  if (id.length <= 10) return id;
  return `#${id.slice(0, 4)}...${id.slice(-4)}`;
}

function formatAmount(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function BookingRow({ booking, onPress }: BookingRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      disabled={!onPress}
    >
      <View style={styles.iconBadge}>
        <Ionicons name="baseball-outline" size={20} color={Colors.primary} />
      </View>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.bookingId}>{truncateId(booking.id)}</Text>
          <Text style={styles.amount}>{formatAmount(booking.amount)}</Text>
        </View>
        <Text style={styles.venue} numberOfLines={1}>
          {booking.venueName}
        </Text>
        {booking.date ? (
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.dateText}>{booking.date}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.right}>
        <StatusBadge status={booking.status} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.75,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingId: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  amount: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  venue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  dateText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
  right: {
    flexShrink: 0,
  },
});
