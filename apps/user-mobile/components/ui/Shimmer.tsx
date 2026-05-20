import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors, Radius } from '@/constants/theme';

interface ShimmerProps {
  width: DimensionValue;
  height: number;
  style?: ViewStyle;
  borderRadius?: number;
}

export function Shimmer({ width, height, style, borderRadius = Radius.md }: ShimmerProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.zinc200, Colors.zinc100],
    ),
  }));

  return (
    <Animated.View
      style={[
        styles.base,
        { width, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});
