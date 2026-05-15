import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, FontSize, Radius, Spacing } from '@/constants/theme';

export const CITIES = [
  'All',
  'Mumbai',
  'Delhi',
  'Bangalore',
  'Hyderabad',
  'Chennai',
  'Pune',
] as const;

export type City = (typeof CITIES)[number];

interface CityChipProps {
  city: City;
  selected: boolean;
  onPress: (city: City) => void;
}

function CityChipItem({ city, selected, onPress }: CityChipProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress(city);
      }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
        {city}
      </Text>
    </Pressable>
  );
}

interface CityChipListProps {
  selected: City;
  onSelect: (city: City) => void;
}

export function CityChipList({ selected, onSelect }: CityChipListProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CITIES.map((city) => (
          <CityChipItem
            key={city}
            city={city}
            selected={selected === city}
            onPress={onSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: -Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    backgroundColor: Colors.zinc100,
    borderWidth: 1.5,
    borderColor: Colors.zinc200,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.zinc600,
  },
  chipLabelSelected: {
    color: Colors.white,
  },
});
