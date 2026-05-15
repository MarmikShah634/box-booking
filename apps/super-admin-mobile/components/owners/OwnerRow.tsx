import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, StatusVariant } from '@/components/ui/StatusBadge';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

export interface OwnerRowData {
  id: string;
  name: string;
  email: string;
  venueCount: number;
  kycStatus: StatusVariant;
  status: StatusVariant;
}

interface OwnerRowProps {
  owner: OwnerRowData;
  onPress: () => void;
}

export function OwnerRow({ owner, onPress }: OwnerRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{owner.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {owner.name}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {owner.email}
        </Text>
        <View style={styles.meta}>
          <Ionicons name="business-outline" size={12} color={Colors.textMuted} />
          <Text style={styles.metaText}>{owner.venueCount} venues</Text>
          <StatusBadge status={owner.kycStatus} />
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
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
  avatarText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.primary,
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
  email: {
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
    marginRight: Spacing.xs,
  },
});
