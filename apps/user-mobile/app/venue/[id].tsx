import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Shimmer } from '@/components/ui/Shimmer';
import { userApi } from '@/lib/api';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Shadow,
  Spacing,
} from '@/constants/theme';

interface Box {
  id: string;
  name: string;
  capacity: number;
  pricePerHour: number;
  amenities: string[];
}

interface VenueDetail {
  id: string;
  name: string;
  city: string;
  address: string;
  rating: number;
  reviewCount: number;
  description: string;
  amenities: string[];
  boxes: Box[];
  imageId?: number;
}

interface VenueDetailResponse {
  venue: VenueDetail;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={rating >= star ? 'star' : rating >= star - 0.5 ? 'star-half' : 'star-outline'}
          size={14}
          color={Colors.warning}
        />
      ))}
    </View>
  );
}

function VenueDetailSkeleton() {
  return (
    <ScrollView style={styles.scroll}>
      <Shimmer width="100%" height={250} borderRadius={0} />
      <View style={styles.detailBody}>
        <Shimmer width="70%" height={28} style={styles.skeletonSpacing} />
        <Shimmer width="50%" height={18} style={styles.skeletonSpacingSm} />
        <Shimmer width="100%" height={60} style={{ marginTop: Spacing.md }} />
      </View>
    </ScrollView>
  );
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchVenue() {
      const result = await userApi.get<VenueDetailResponse>(`/venues/${id}`);
      if (!result.ok) {
        setError(result.error);
      } else {
        setVenue(result.data.venue);
      }
      setLoading(false);
    }
    if (id) fetchVenue();
  }, [id]);

  const imageId = venue?.imageId ?? parseInt(id ?? '10', 10) % 100 || 10;

  return (
    <SafeAreaView style={styles.safe} edges={[]}>
      {/* Floating back button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={20} color={Colors.zinc800} />
      </Pressable>

      {loading ? (
        <VenueDetailSkeleton />
      ) : error || !venue ? (
        <EmptyState
          icon="alert-circle-outline"
          title="Venue not found"
          description={error || 'This venue could not be loaded.'}
          ctaLabel="Go back"
          onCta={() => router.back()}
          style={styles.errorState}
        />
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Cover Image */}
          <Image
            source={{ uri: `https://picsum.photos/seed/${imageId}/800/500` }}
            style={styles.coverImage}
            resizeMode="cover"
          />

          {/* Details Body */}
          <View style={styles.detailBody}>
            {/* Name & Rating */}
            <View style={styles.nameSection}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <View style={styles.ratingRow}>
                <StarRating rating={venue.rating} />
                <Text style={styles.ratingText}>
                  {venue.rating.toFixed(1)} ({venue.reviewCount} reviews)
                </Text>
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={15} color={Colors.zinc500} />
                <Text style={styles.address}>
                  {venue.address}, {venue.city}
                </Text>
              </View>
            </View>

            {/* Description */}
            {venue.description ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.description}>{venue.description}</Text>
              </View>
            ) : null}

            {/* Amenities */}
            {venue.amenities.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Amenities</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.amenitiesScroll}
                >
                  {venue.amenities.map((amenity) => (
                    <View key={amenity} style={styles.amenityChip}>
                      <Ionicons
                        name="checkmark-circle"
                        size={14}
                        color={Colors.primary}
                      />
                      <Text style={styles.amenityText}>{amenity}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Available Boxes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available Boxes</Text>
              {venue.boxes.length === 0 ? (
                <EmptyState
                  icon="cube-outline"
                  title="No boxes available"
                  description="This venue has no boxes configured yet."
                />
              ) : (
                <View style={styles.boxList}>
                  {venue.boxes.map((box) => (
                    <View key={box.id} style={styles.boxCard}>
                      <View style={styles.boxInfo}>
                        <Text style={styles.boxName}>{box.name}</Text>
                        <View style={styles.boxMeta}>
                          <Ionicons
                            name="people-outline"
                            size={13}
                            color={Colors.zinc400}
                          />
                          <Text style={styles.boxMetaText}>
                            Up to {box.capacity} players
                          </Text>
                        </View>
                        {box.amenities.length > 0 ? (
                          <Text style={styles.boxAmenities} numberOfLines={1}>
                            {box.amenities.join(' · ')}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.boxRight}>
                        <Text style={styles.boxPrice}>
                          &#8377;{box.pricePerHour.toLocaleString('en-IN')}
                          <Text style={styles.boxPriceUnit}>/hr</Text>
                        </Text>
                        <Button
                          variant="primary"
                          size="sm"
                          onPress={() => router.push(`/book/${box.id}`)}
                        >
                          Book
                        </Button>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  backButton: {
    position: 'absolute',
    top: 52,
    left: Spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.md,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  coverImage: {
    width: '100%',
    height: 260,
    backgroundColor: Colors.zinc100,
  },
  detailBody: {
    padding: Spacing.md,
  },
  nameSection: {
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  venueName: {
    fontSize: FontSize['3xl'],
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
    lineHeight: 36,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
    flex: 1,
  },
  section: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  description: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc600,
    lineHeight: 22,
  },
  amenitiesScroll: {
    gap: Spacing.xs,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  amenityText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.primary,
  },
  boxList: {
    gap: Spacing.sm,
  },
  boxCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.zinc200,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  boxInfo: {
    flex: 1,
    gap: 4,
  },
  boxName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: Colors.zinc900,
  },
  boxMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  boxMetaText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
  },
  boxAmenities: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
  },
  boxRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  boxPrice: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  boxPriceUnit: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
  },
  // Skeleton helpers
  skeletonSpacing: {
    marginBottom: Spacing.sm,
  },
  skeletonSpacingSm: {
    marginBottom: Spacing.xs,
  },
  errorState: {
    flex: 1,
  },
});
