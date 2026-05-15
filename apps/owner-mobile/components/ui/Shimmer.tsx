import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Colors, Radius } from '@/constants/theme';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({ width = '100%', height = 20, borderRadius = Radius.sm, style }: ShimmerProps) {
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1100 }),
      -1,
      true
    );
  }, [shimmerValue]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      shimmerValue.value,
      [0, 0.5, 1],
      [0.35, 0.7, 0.35],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <Animated.View
      style={[
        styles.shimmer,
        { width: width as number, height, borderRadius },
        animatedStyle,
        style,
      ]}
    />
  );
}

interface ShimmerRowProps {
  lines?: number;
  avatarSize?: number;
}

export function ShimmerRow({ lines = 2, avatarSize }: ShimmerRowProps) {
  return (
    <View style={styles.row}>
      {avatarSize !== undefined && (
        <Shimmer width={avatarSize} height={avatarSize} borderRadius={avatarSize / 2} style={styles.avatar} />
      )}
      <View style={styles.content}>
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer
            key={i}
            width={i === lines - 1 ? '60%' : '100%'}
            height={i === 0 ? 16 : 12}
            style={i > 0 ? styles.lineSpacing : undefined}
          />
        ))}
      </View>
    </View>
  );
}

export function ShimmerCard({ height = 100 }: { height?: number }) {
  return <Shimmer width="100%" height={height} borderRadius={Radius.lg} />;
}

const styles = StyleSheet.create({
  shimmer: {
    backgroundColor: Colors.zinc200,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    marginRight: 12,
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  lineSpacing: {
    marginTop: 6,
  },
});
