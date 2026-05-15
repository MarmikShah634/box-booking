import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OwnerRow, OwnerRowData } from '@/components/owners/OwnerRow';
import { ShimmerRow } from '@/components/ui/Shimmer';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { superAdminApi } from '@/lib/api';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';
import { StatusVariant } from '@/components/ui/StatusBadge';

type FilterChip = 'all' | 'kyc_pending' | 'suspended';

const FILTER_CHIPS: { key: FilterChip; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'kyc_pending', label: 'Pending KYC' },
  { key: 'suspended', label: 'Suspended' },
];

interface ApiOwner {
  id: string;
  name: string;
  email: string;
  venueCount: number;
  kycStatus: StatusVariant;
  status: StatusVariant;
}

interface OwnersResponse {
  owners: ApiOwner[];
}

export default function OwnersScreen() {
  const router = useRouter();
  const [owners, setOwners] = useState<OwnerRowData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');

  const fetchOwners = useCallback(async () => {
    setError(null);
    const result = await superAdminApi<OwnersResponse>('/api/v1/super-admin/owners');
    if (result.ok) {
      setOwners(result.data.owners);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await fetchOwners();
      setLoading(false);
    })();
  }, [fetchOwners]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOwners();
    setRefreshing(false);
  }, [fetchOwners]);

  const filtered = owners.filter((o) => {
    const matchesSearch =
      search.trim() === '' ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.email.toLowerCase().includes(search.toLowerCase());

    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'kyc_pending' && o.kycStatus === 'kyc_pending') ||
      (activeFilter === 'suspended' && o.status === 'suspended');

    return matchesSearch && matchesFilter;
  });

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerArea}>
          <Text style={styles.screenTitle}>Owners</Text>
        </View>
        <ErrorState
          message={error}
          onRetry={() => {
            setLoading(true);
            void fetchOwners().then(() => setLoading(false));
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerArea}>
        <Text style={styles.screenTitle}>Owners</Text>
        <Text style={styles.countBadge}>{filtered.length}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Filter Chips */}
      <View style={styles.chips}>
        {FILTER_CHIPS.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={() => setActiveFilter(chip.key)}
            style={[styles.chip, activeFilter === chip.key && styles.chipActive]}
          >
            <Text style={[styles.chipText, activeFilter === chip.key && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={styles.listPadding}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ShimmerRow key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
            <OwnerRow
              owner={item}
              onPress={() => router.push(`/owners/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="business-outline"
              title="No owners found"
              description={
                search.length > 0
                  ? 'Try adjusting your search or filter.'
                  : 'No venue owners have registered yet.'
              }
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  screenTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.textPrimary,
  },
  countBadge: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.base,
    paddingVertical: Spacing.sm + 4,
  },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  listPadding: {
    paddingHorizontal: Spacing.lg,
  },
});
