import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge, BadgeStatus } from '@/components/ui/StatusBadge';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

export interface VenueRowData {
  id: string;
  name: string;
  city: string;
  boxCount: number;
  status: BadgeStatus | string;
}

interface VenueRowProps {
  venue: VenueRowData;
  onPress?: () => void;
}

export function VenueRow({ venue, onPress }: VenueRowProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="business-outline" size={22} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {venue.name}
          </Text>
          <StatusBadge status={venue.status} />
        </View>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={12} color={Colors.zinc400} />
            <Text style={styles.metaText}>{venue.city}</Text>
          </View>
          <Text style={styles.separator}> · </Text>
          <View style={styles.metaItem}>
            <Ionicons name="grid-outline" size={12} color={Colors.zinc400} />
            <Text style={styles.metaText}>
              {venue.boxCount} {venue.boxCount === 1 ? 'box' : 'boxes'}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.zinc400} />
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
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
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
  name: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
    color: Colors.zinc900,
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc500,
  },
  separator: {
    color: Colors.zinc400,
    fontSize: FontSize.xs,
  },
});
