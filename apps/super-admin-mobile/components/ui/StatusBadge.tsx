import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontFamily, FontSize, Radius } from '@/constants/theme';

export type StatusVariant =
  | 'active'
  | 'blocked'
  | 'suspended'
  | 'pending'
  | 'approved'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'kyc_pending'
  | 'kyc_approved'
  | 'kyc_rejected';

const STATUS_CONFIG: Record<
  StatusVariant,
  { label: string; bg: string; text: string }
> = {
  active: { label: 'Active', bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
  blocked: { label: 'Blocked', bg: 'rgba(220, 38, 38, 0.15)', text: '#dc2626' },
  suspended: { label: 'Suspended', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  pending: { label: 'Pending', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  approved: { label: 'Approved', bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
  confirmed: { label: 'Confirmed', bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
  cancelled: { label: 'Cancelled', bg: 'rgba(220, 38, 38, 0.15)', text: '#dc2626' },
  completed: { label: 'Completed', bg: 'rgba(161, 161, 170, 0.15)', text: '#a1a1aa' },
  kyc_pending: { label: 'KYC Pending', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' },
  kyc_approved: { label: 'KYC Approved', bg: 'rgba(5, 150, 105, 0.15)', text: '#059669' },
  kyc_rejected: { label: 'KYC Rejected', bg: 'rgba(220, 38, 38, 0.15)', text: '#dc2626' },
};

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: Colors.surfaceAlt,
    text: Colors.textSecondary,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{label ?? config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
