import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors, FontFamily, FontSize, Radius } from '@/constants/theme';

export type BadgeStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'NO_SHOW';

interface StatusBadgeProps {
  status: BadgeStatus | string;
  style?: ViewStyle;
}

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: '#fffbeb', text: Colors.warning, label: 'Pending' },
  APPROVED: { bg: Colors.primaryLight, text: Colors.primary, label: 'Approved' },
  REJECTED: { bg: '#fef2f2', text: Colors.error, label: 'Rejected' },
  SUSPENDED: { bg: '#fef2f2', text: Colors.error, label: 'Suspended' },
  ACTIVE: { bg: Colors.primaryLight, text: Colors.primary, label: 'Active' },
  COMPLETED: { bg: Colors.zinc100, text: Colors.zinc600, label: 'Completed' },
  CONFIRMED: { bg: Colors.primaryLight, text: Colors.primary, label: 'Confirmed' },
  CANCELLED: { bg: '#fef2f2', text: Colors.error, label: 'Cancelled' },
  NO_SHOW: { bg: '#fff7ed', text: '#c2410c', label: 'No Show' },
};

const fallbackConfig = { bg: Colors.zinc100, text: Colors.zinc600, label: '' };

export function StatusBadge({ status, style }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { ...fallbackConfig, label: status };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>
        {config.label || status}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.xs,
    letterSpacing: 0.2,
  },
});
