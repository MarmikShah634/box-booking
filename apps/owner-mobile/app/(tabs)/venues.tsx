import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { VenueRow } from '@/components/venues/VenueRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { ShimmerRow } from '@/components/ui/Shimmer';
import { ownerApi } from '@/lib/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import type { VenueRowData } from '@/components/venues/VenueRow';

interface VenueApiItem {
  id: string;
  name: string;
  city: string;
  totalBoxes: number;
  status: string;
}

interface VenuesResponse {
  venues: VenueApiItem[];
}

export default function VenuesScreen() {
  const router = useRouter();
  const [venues, setVenues] = useState<VenueRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVenues = useCallback(async () => {
    const result = await ownerApi<VenuesResponse>('/api/v1/venues?ownerId=me');
    if (result.ok) {
      setVenues(
        result.data.venues.map((v) => ({
          id: v.id,
          name: v.name,
          city: v.city,
          boxCount: v.totalBoxes,
          status: v.status,
        }))
      );
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchVenues().finally(() => setLoading(false));
  }, [fetchVenues]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVenues();
    setRefreshing(false);
  }, [fetchVenues]);

  const handleAddVenue = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Add Venue',
      'Add your first venue via the web portal at boxcricket.com/owner/venues/new',
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.heading}>My Venues</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddVenue}>
          <Ionicons name="add" size={22} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.shimmerContainer}>
          {[...Array(4)].map((_, i) => (
            <View key={i} style={styles.shimmerRow}>
              <ShimmerRow lines={2} avatarSize={44} />
            </View>
          ))}
        </View>
      ) : error !== null ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={40} color={Colors.zinc400} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => { void fetchVenues(); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={venues}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            venues.length === 0 && styles.listContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <VenueRow
              venue={item}
              onPress={() => router.push(`/venues/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title="No venues yet"
              description="Add your first venue on the web portal to start accepting bookings."
              ctaLabel="How to add a venue"
              onCta={handleAddVenue}
            />
          }
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={handleAddVenue} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.zinc50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  heading: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.xl,
    color: Colors.zinc900,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  shimmerContainer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    borderRadius: Radius.lg,
  },
  shimmerRow: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.zinc100,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    color: Colors.zinc500,
    textAlign: 'center',
  },
  retryText: {
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
    color: Colors.primary,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
});
