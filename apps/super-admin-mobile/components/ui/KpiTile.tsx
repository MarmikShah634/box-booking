import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface KpiTileProps {
  label: string;
  value: string;
  sub?: string;
  change?: number;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function KpiTile({ label, value, sub, change, icon }: KpiTileProps) {
  const isPositive = change !== undefined && change >= 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {icon ? (
          <View style={styles.iconBadge}>
            <Ionicons name={icon} size={16} color={Colors.primary} />
          </View>
        ) : null}
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <View style={styles.footer}>
        {sub ? (
          <Text style={styles.sub} numberOfLines={1}>
            {sub}
          </Text>
        ) : null}
        {change !== undefined ? (
          <View style={[styles.changeBadge, isPositive ? styles.positiveChip : styles.negativeChip]}>
            <Ionicons
              name={isPositive ? 'trending-up' : 'trending-down'}
              size={10}
              color={isPositive ? Colors.emerald : Colors.error}
            />
            <Text
              style={[
                styles.changeText,
                isPositive ? styles.positiveText : styles.negativeText,
              ]}
            >
              {isPositive ? '+' : ''}
              {change}%
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    flex: 1,
    minHeight: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  sub: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    flex: 1,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 2,
  },
  positiveChip: {
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
  },
  negativeChip: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  changeText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
  },
  positiveText: {
    color: Colors.emerald,
  },
  negativeText: {
    color: Colors.error,
  },
});
