import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface StatTileProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down';
  style?: ViewStyle;
}

export function StatTile({ label, value, subtext, trend, style }: StatTileProps) {
  return (
    <View style={[styles.tile, style]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {value}
        </Text>
        {trend !== undefined && (
          <View style={[styles.trendBadge, trend === 'up' ? styles.trendUp : styles.trendDown]}>
            <Ionicons
              name={trend === 'up' ? 'trending-up' : 'trending-down'}
              size={14}
              color={trend === 'up' ? Colors.success : Colors.error}
            />
          </View>
        )}
      </View>
      {subtext !== undefined && subtext !== '' && (
        <Text style={styles.subtext} numberOfLines={1}>
          {subtext}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flex: 1,
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.xs,
    color: Colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  value: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize['2xl'],
    color: Colors.zinc900,
    flex: 1,
  },
  trendBadge: {
    borderRadius: Radius.full,
    padding: 4,
  },
  trendUp: {
    backgroundColor: Colors.primaryLight,
  },
  trendDown: {
    backgroundColor: '#fef2f2',
  },
  subtext: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc400,
    marginTop: 2,
  },
});
