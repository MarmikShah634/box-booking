import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, StatusVariant } from '@/components/ui/StatusBadge';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

export interface UserRowData {
  id: string;
  phone: string;
  name: string;
  bookingCount: number;
  status: StatusVariant;
}

interface UserRowProps {
  user: UserRowData;
  onPress: () => void;
}

export function UserRow({ user, onPress }: UserRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {user.name}
        </Text>
        <Text style={styles.phone} numberOfLines={1}>
          {user.phone}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.metaText}>{user.bookingCount} bookings</Text>
        </View>
      </View>
      <View style={styles.right}>
        <StatusBadge status={user.status} />
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={styles.chevron} />
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
  },
  phone: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  metaText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
  },
  right: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  chevron: {
    marginTop: Spacing.xs,
  },
});
