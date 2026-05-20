import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Shadow,
  Spacing,
} from '@/constants/theme';

export interface VenueCardData {
  id: string;
  name: string;
  city: string;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  imageId?: number;
}

interface VenueCardProps {
  venue: VenueCardData;
  onPress: (id: string) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StarRating({ rating }: { rating: number }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.starsRow}>
      {stars.map((star) => (
        <Ionicons
          key={star}
          name={rating >= star ? 'star' : rating >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={12}
          color={Colors.warning}
        />
      ))}
    </View>
  );
}

export function VenueCard({ venue, onPress }: VenueCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const imageId = venue.imageId ?? parseInt(venue.id, 10) % 100 || 10;
  const imageUri = `https://picsum.photos/seed/${imageId}/400/220`;

  return (
    <AnimatedPressable
      style={[styles.card, animatedStyle]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(venue.id);
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {venue.name}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={13} color={Colors.zinc500} />
          <Text style={styles.city}>{venue.city}</Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <StarRating rating={venue.rating} />
            <Text style={styles.ratingText}>
              {venue.rating.toFixed(1)}
              <Text style={styles.reviewCount}> ({venue.reviewCount})</Text>
            </Text>
          </View>
          <View style={styles.priceChip}>
            <Text style={styles.priceText}>
              From{' '}
              <Text style={styles.priceBold}>
                &#8377;{venue.pricePerHour.toLocaleString('en-IN')}
              </Text>
              /hr
            </Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export function VenueCardSkeleton() {
  return (
    <View style={[styles.card, styles.skeleton]}>
      <View style={styles.skeletonImage} />
      <View style={styles.body}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: '50%', marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { width: '70%', marginTop: 10 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.md,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.zinc100,
  },
  body: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  name: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: Colors.zinc900,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  city: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.zinc700,
  },
  reviewCount: {
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
  },
  priceChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs - 1,
    borderRadius: Radius.sm,
  },
  priceText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.primary,
  },
  priceBold: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
  },
  // Skeleton
  skeleton: {},
  skeletonImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.zinc200,
  },
  skeletonLine: {
    height: 14,
    borderRadius: Radius.sm,
    backgroundColor: Colors.zinc200,
    width: '85%',
  },
});
