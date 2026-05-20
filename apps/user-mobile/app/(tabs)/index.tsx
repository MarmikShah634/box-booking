import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { VenueCard, VenueCardData, VenueCardSkeleton } from '@/components/home/VenueCard';
import { CityChipList, City } from '@/components/home/CityChip';
import { EmptyState } from '@/components/ui/EmptyState';
import { userApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import {
  Colors,
  FontFamily,
  FontSize,
  Radius,
  Spacing,
} from '@/constants/theme';

interface VenuesResponse {
  venues: VenueCardData[];
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [selectedCity, setSelectedCity] = useState<City>('All');
  const [venues, setVenues] = useState<VenueCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchVenues = useCallback(async (city: City) => {
    setError('');
    const cityParam = city === 'All' ? '' : city;
    const path = cityParam ? `/venues?city=${encodeURIComponent(cityParam)}` : '/venues';
    const result = await userApi.get<VenuesResponse>(path);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setVenues(result.data.venues ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchVenues(selectedCity).finally(() => setLoading(false));
  }, [selectedCity, fetchVenues]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVenues(selectedCity);
    setRefreshing(false);
  }, [selectedCity, fetchVenues]);

  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
  };

  const filteredVenues = venues.filter((v) =>
    searchQuery
      ? v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.city.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              {greeting()},{' '}
              <Text style={styles.greetingName}>
                {user?.name?.split(' ')[0] ?? 'Player'}
              </Text>
            </Text>
            <Text style={styles.tagline}>Find your perfect box cricket venue</Text>
          </View>
          <View style={styles.notificationBtn}>
            <Ionicons name="notifications-outline" size={22} color={Colors.zinc700} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.zinc400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues, cities..."
            placeholderTextColor={Colors.zinc400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <Ionicons
              name="close-circle"
              size={18}
              color={Colors.zinc400}
              onPress={() => setSearchQuery('')}
            />
          ) : null}
        </View>

        {/* City Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Filter by city</Text>
          <CityChipList selected={selectedCity} onSelect={handleCitySelect} />
        </View>

        {/* Venues Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Venues near you</Text>
            {!loading && venues.length > 0 ? (
              <Text style={styles.sectionCount}>{filteredVenues.length} found</Text>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.venueList}>
              {[1, 2, 3].map((k) => (
                <VenueCardSkeleton key={k} />
              ))}
            </View>
          ) : error ? (
            <EmptyState
              icon="wifi-outline"
              title="Something went wrong"
              description={error}
              ctaLabel="Try again"
              onCta={() => {
                setLoading(true);
                fetchVenues(selectedCity).finally(() => setLoading(false));
              }}
            />
          ) : filteredVenues.length === 0 ? (
            <EmptyState
              icon="baseball-outline"
              title="No venues found"
              description={
                selectedCity !== 'All'
                  ? `We don't have any venues in ${selectedCity} yet.`
                  : 'No venues match your search.'
              }
              ctaLabel={selectedCity !== 'All' ? 'View all cities' : undefined}
              onCta={selectedCity !== 'All' ? () => setSelectedCity('All') : undefined}
            />
          ) : (
            <View style={styles.venueList}>
              {filteredVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  onPress={(id) => router.push(`/venue/${id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.zinc50,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  greetingName: {
    color: Colors.primary,
  },
  tagline: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc500,
    marginTop: 2,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.zinc200,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.zinc200,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.zinc800,
    padding: 0,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.zinc500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: Colors.zinc900,
  },
  sectionCount: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.zinc400,
  },
  venueList: {
    gap: Spacing.md,
  },
});
