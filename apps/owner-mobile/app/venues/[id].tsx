import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Shimmer } from '@/components/ui/Shimmer';
import { EmptyState } from '@/components/ui/EmptyState';
import { ownerApi } from '@/lib/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

interface BoxItem {
  id: string;
  name: string;
  capacity: number;
  pricePerHour: number;
  status: string;
}

interface VenueDetail {
  id: string;
  name: string;
  city: string;
  address: string;
  status: string;
  totalBoxes: number;
  description?: string;
  openTime: string;
  closeTime: string;
  boxes: BoxItem[];
}

interface VenueDetailResponse {
  venue: VenueDetail;
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':').map(Number);
  const suffix = (h ?? 0) >= 12 ? 'PM' : 'AM';
  const hour = (h ?? 0) % 12 || 12;
  return `${hour}:${String(m ?? 0).padStart(2, '0')} ${suffix}`;
}

export default function VenueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVenue = useCallback(async () => {
    if (!id) return;
    const result = await ownerApi<VenueDetailResponse>(`/api/v1/venues/${id}`);
    if (result.ok) {
      setVenue(result.data.venue);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchVenue().finally(() => setLoading(false));
  }, [fetchVenue]);

  useEffect(() => {
    if (venue) {
      navigation.setOptions({ title: venue.name });
    }
  }, [venue, navigation]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVenue();
    setRefreshing(false);
  }, [fetchVenue]);

  const handleViewBookings = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/bookings');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <Shimmer width="70%" height={28} style={styles.shimmerTitle} />
          <Shimmer width="40%" height={20} style={styles.shimmerSub} />
          <Shimmer width="100%" height={120} borderRadius={Radius.lg} style={styles.shimmerCard} />
          <Shimmer width="100%" height={280} borderRadius={Radius.lg} style={styles.shimmerCard} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error !== null || venue === null) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <EmptyState
          icon="business-outline"
          title="Unable to load venue"
          description={error ?? 'This venue could not be found.'}
          ctaLabel="Try again"
          onCta={() => { void fetchVenue(); }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.venueIconWrap}>
              <Ionicons name="business" size={28} color={Colors.primary} />
            </View>
            <View style={styles.heroInfo}>
              <Text style={styles.venueName} numberOfLines={2}>
                {venue.name}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.zinc500} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {venue.address ? `${venue.address}, ` : ''}{venue.city}
                </Text>
              </View>
            </View>
            <StatusBadge status={venue.status} />
          </View>

          {venue.description !== undefined && venue.description !== '' && (
            <Text style={styles.description}>{venue.description}</Text>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="grid-outline" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{venue.totalBoxes}</Text>
              <Text style={styles.statLabel}>{venue.totalBoxes === 1 ? 'Box' : 'Boxes'}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{formatTime(venue.openTime)}</Text>
              <Text style={styles.statLabel}>Opens</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="moon-outline" size={18} color={Colors.primary} />
              <Text style={styles.statValue}>{formatTime(venue.closeTime)}</Text>
              <Text style={styles.statLabel}>Closes</Text>
            </View>
          </View>
        </View>

        {/* Boxes */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Boxes</Text>
          <Text style={styles.boxCount}>{venue.boxes.length} total</Text>
        </View>

        {venue.boxes.length === 0 ? (
          <View style={styles.emptyBoxes}>
            <Ionicons name="grid-outline" size={32} color={Colors.zinc400} />
            <Text style={styles.emptyBoxText}>No boxes configured</Text>
          </View>
        ) : (
          <View style={styles.boxList}>
            {venue.boxes.map((box, index) => (
              <View key={box.id}>
                <View style={styles.boxRow}>
                  <View style={styles.boxIconWrap}>
                    <Ionicons name="tennisball-outline" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.boxInfo}>
                    <Text style={styles.boxName}>{box.name}</Text>
                    <View style={styles.boxMeta}>
                      <Text style={styles.boxMetaText}>
                        Capacity: {box.capacity} players
                      </Text>
                      <Text style={styles.boxMetaDot}> · </Text>
                      <Text style={styles.boxPrice}>
                        ₹{box.pricePerHour.toLocaleString('en-IN')}/hr
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={box.status} />
                </View>
                {index < venue.boxes.length - 1 && <View style={styles.boxDivider} />}
              </View>
            ))}
          </View>
        )}

        {/* CTA */}
        <Button
          label="View Bookings for this Venue"
          onPress={handleViewBookings}
          variant="outline"
          style={styles.viewBookingsBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.zinc50,
  },
  loadingContent: {
    padding: Spacing.lg,
  },
  shimmerTitle: {
    marginBottom: Spacing.sm,
  },
  shimmerSub: {
    marginBottom: Spacing.lg,
  },
  shimmerCard: {
    marginBottom: Spacing.md,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  venueIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  venueName: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.zinc900,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.zinc500,
    flex: 1,
  },
  description: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.zinc600,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.zinc100,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.zinc100,
  },
  statValue: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    color: Colors.zinc900,
  },
  statLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc500,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.lg,
    color: Colors.zinc900,
  },
  boxCount: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.sm,
    color: Colors.zinc500,
  },
  emptyBoxes: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  emptyBoxText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.zinc500,
  },
  boxList: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    shadowColor: Colors.zinc900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  boxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  boxIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  boxInfo: {
    flex: 1,
    gap: 3,
  },
  boxName: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
    color: Colors.zinc900,
  },
  boxMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  boxMetaText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc500,
  },
  boxMetaDot: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.zinc400,
  },
  boxPrice: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
  boxDivider: {
    height: 1,
    backgroundColor: Colors.zinc100,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  viewBookingsBtn: {
    marginTop: Spacing.sm,
  },
});
