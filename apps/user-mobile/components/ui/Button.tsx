import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  style,
  fullWidth = false,
}: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    }
  };

  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      style={[
        animatedStyle,
        styles.base,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.primary}
        />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label`], styles[`${size}Label`]]}>
          {children}
        </Text>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  sm: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.sm,
  },
  md: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
  },
  lg: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },

  disabled: {
    opacity: 0.5,
  },

  // Labels
  label: {
    fontFamily: FontFamily.semibold,
  },
  primaryLabel: {
    color: Colors.white,
  },
  outlineLabel: {
    color: Colors.primary,
  },
  ghostLabel: {
    color: Colors.primary,
  },

  smLabel: {
    fontSize: FontSize.sm,
  },
  mdLabel: {
    fontSize: FontSize.base,
  },
  lgLabel: {
    fontSize: FontSize.lg,
  },
});
