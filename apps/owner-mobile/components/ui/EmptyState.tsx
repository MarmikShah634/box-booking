import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Colors, FontFamily, FontSize, Spacing } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon: IoniconName;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  style?: ViewStyle;
}

export function EmptyState({ icon, title, description, ctaLabel, onCta, style }: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={44} color={Colors.zinc400} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description !== undefined && description !== '' && (
        <Text style={styles.description}>{description}</Text>
      )}
      {ctaLabel !== undefined && onCta !== undefined && (
        <Button label={ctaLabel} onPress={onCta} variant="outline" style={styles.cta} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  iconWrap: {
    backgroundColor: Colors.zinc100,
    borderRadius: 40,
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lg,
    color: Colors.zinc800,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.zinc500,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  cta: {
    minWidth: 160,
  },
});
