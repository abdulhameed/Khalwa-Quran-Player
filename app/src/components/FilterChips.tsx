/**
 * FilterChips Component
 * Displays active filters as chips with remove buttons
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, DIMENSIONS} from '../utils/constants';

export interface FilterChip {
  id: string;
  label: string;
  type: 'style' | 'country' | 'length' | 'revelation' | 'downloaded' | 'favorite' | 'sort';
}

interface FilterChipsProps {
  filters: FilterChip[];
  onRemoveFilter: (filterId: string) => void;
  onClearAll?: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
}) => {
  if (filters.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map(filter => (
          <View key={filter.id} style={styles.chip}>
            <Text style={styles.chipLabel}>{filter.label}</Text>
            <TouchableOpacity
              onPress={() => onRemoveFilter(filter.id)}
              style={styles.removeButton}
              hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}
            >
              <Icon name="close" size={16} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ))}

        {filters.length > 1 && onClearAll && (
          <TouchableOpacity onPress={onClearAll} style={styles.clearAllButton}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: DIMENSIONS.spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius.full,
    paddingVertical: DIMENSIONS.spacing.xs,
    paddingLeft: DIMENSIONS.spacing.md,
    paddingRight: DIMENSIONS.spacing.sm,
    marginRight: DIMENSIONS.spacing.sm,
  },
  chipLabel: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.white,
    marginRight: DIMENSIONS.spacing.xs,
    fontWeight: '500',
  },
  removeButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearAllButton: {
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.xs,
    borderRadius: DIMENSIONS.borderRadius.full,
    borderWidth: 1,
    borderColor: COLORS.primary,
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
