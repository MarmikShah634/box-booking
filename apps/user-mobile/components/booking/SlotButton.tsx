import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

export type SlotStatus = 'available' | 'booked' | 'selected';

export interface SlotData {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  status: SlotStatus;
}

interface SlotButtonProps {
  slot: SlotData;
  onPress: (slot: SlotData) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const STATUS_CONFIG: Record<
  SlotStatus,
  { bg: string; border: string; textColor: string; label: string; pressable: boolean }
> = {
  available: {
    bg: Colors.white,
    border: Colors.zinc200,
    textColor: Colors.zinc800,
    label: 'Available',
    pressable: true,
  },
  booked: {
    bg: Colors.zinc100,
    border: Colors.zinc200,
    textColor: Colors.zinc400,
    label: 'Booked',
    pressable: false,
  },
  selected: {
    bg: Colors.primaryLight,
    border: Colors.primary,
    textColor: Colors.primary,
    label: 'Selected',
    pressable: true,
  },
};

export function SlotButton({ slot, onPress }: SlotButtonProps) {
  const config = STATUS_CONFIG[slot.status];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (config.pressable) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (config.pressable) {
      Haptics.selectionAsync();
      onPress(slot);
    }
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!config.pressable}
      style={[
        styles.slot,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
        animatedStyle,
      ]}
    >
      <Text style={[styles.timeText, { color: config.textColor }]}>
        {slot.startTime}
      </Text>
      <Text style={[styles.timeText, styles.separator, { color: config.textColor }]}>
        -
      </Text>
      <Text style={[styles.timeText, { color: config.textColor }]}>
        {slot.endTime}
      </Text>
      <View style={styles.divider} />
      <Text style={[styles.priceText, { color: config.textColor }]}>
        &#8377;{slot.price.toLocaleString('en-IN')}
      </Text>
      {slot.status === 'booked' ? (
        <Text style={styles.bookedLabel}>Booked</Text>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  slot: {
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
    minHeight: 80,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
  },
  separator: {
    fontFamily: FontFamily.regular,
  },
  divider: {
    height: 1,
    width: '60%',
    backgroundColor: Colors.zinc200,
    marginVertical: 2,
  },
  priceText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
  },
  bookedLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
    marginTop: 2,
  },
});
