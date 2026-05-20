import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from './Button';
import { Colors, FontFamily, FontSize, Spacing, Radius } from '@/constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = 'folder-open-outline',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Ionicons name={icon} size={40} color={Colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          style={styles.button}
        />
      ) : null}
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, styles.errorIconWrapper]}>
        <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
      </View>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.description}>{message}</Text>
      <Button label="Try again" onPress={onRetry} variant="outline" style={styles.button} />
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
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  errorIconWrapper: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  button: {
    minWidth: 140,
  },
});
