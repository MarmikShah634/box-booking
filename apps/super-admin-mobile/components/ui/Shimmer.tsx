import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { Colors, Radius } from '@/constants/theme';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Shimmer({ width = '100%', height = 20, borderRadius = Radius.sm, style }: ShimmerProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      [Colors.surfaceAlt, Colors.border]
    );
    return { backgroundColor };
  });

  return (
    <Animated.View
      style={[
        animatedStyle,
        { width: width as ViewStyle['width'], height, borderRadius },
        style,
      ]}
    />
  );
}

interface ShimmerCardProps {
  style?: ViewStyle;
}

export function ShimmerCard({ style }: ShimmerCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Shimmer height={16} width="60%" borderRadius={Radius.sm} />
      <View style={styles.gap} />
      <Shimmer height={24} width="40%" borderRadius={Radius.sm} />
      <View style={styles.gap} />
      <Shimmer height={12} width="80%" borderRadius={Radius.sm} />
    </View>
  );
}

export function ShimmerRow({ style }: ShimmerCardProps) {
  return (
    <View style={[styles.row, style]}>
      <View style={styles.rowLeft}>
        <Shimmer height={16} width={120} borderRadius={Radius.sm} />
        <View style={{ height: 6 }} />
        <Shimmer height={12} width={180} borderRadius={Radius.sm} />
      </View>
      <Shimmer height={24} width={60} borderRadius={Radius.full} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  gap: {
    height: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    marginBottom: 8,
  },
  rowLeft: {
    flex: 1,
    marginRight: 12,
  },
});
