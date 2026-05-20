import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, BadgeStatus } from '@/components/ui/StatusBadge';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

export interface BookingRowData {
  id: string;
  venueName: string;
  boxName?: string;
  timeLabel: string;
  dateLabel: string;
  customerPhone: string;
  status: BadgeStatus | string;
  amount: number;
}

interface BookingRowProps {
  booking: BookingRowData;
  onPress?: () => void;
}

export function BookingRow({ booking, onPress }: BookingRowProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={onPress === undefined}
    >
      <View style={styles.left}>
        <View style={styles.iconWrap}>
          <Ionicons name="tennisball-outline" size={20} color={Colors.primary} />
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.venueName} numberOfLines={1}>
            {booking.venueName}
          </Text>
          <StatusBadge status={booking.status} />
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={Colors.zinc400} />
          <Text style={styles.metaText}>{booking.dateLabel}</Text>
          <Text style={styles.dot}> · </Text>
          <Ionicons name="time-outline" size={12} color={Colors.zinc400} />
          <Text style={styles.metaText}>{booking.timeLabel}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={12} color={Colors.zinc400} />
            <Text style={styles.phone}>{booking.customerPhone}</Text>
          </View>
          <Text style={styles.amount}>
            ₹{booking.amount.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
      {onPress !== undefined && (
        <Ionicons name="chevron-forward" size={16} color={Colors.zinc400} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  left: {
    marginRight: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  venueName: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
    color: Colors.zinc900,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc500,
  },
  dot: {
    color: Colors.zinc400,
    fontSize: FontSize.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  phone: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc500,
  },
  amount: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
});
