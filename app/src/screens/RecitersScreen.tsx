import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, DIMENSIONS} from '../utils/constants';
import recitersData from '../data/reciters.json';
import surahsData from '../data/surahs.json';
import {Reciter, Surah, RootStackParamList} from '../utils/types';
import {SearchInput} from '../components/SearchInput';
import {FilterChips, FilterChip} from '../components/FilterChips';
import {NoResultsPlaceholder} from '../components/NoResultsPlaceholder';
import {
  searchReciters,
  filterReciters,
  sortReciters,
  getUniqueStyles,
  getUniqueCountries,
  ReciterFilters,
  ReciterSortOption,
} from '../utils/searchUtils';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RecitersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const reciters = recitersData as Reciter[];
  const surahs = surahsData as Surah[];

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ReciterFilters>({});
  const [sortBy, setSortBy] = useState<ReciterSortOption>('name-asc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  // Get unique values for filters
  const availableStyles = useMemo(() => getUniqueStyles(reciters), [reciters]);
  const availableCountries = useMemo(() => getUniqueCountries(reciters), [reciters]);

  // Apply search, filter, and sort
  const filteredReciters = useMemo(() => {
    let result = reciters;

    // Apply search
    if (searchQuery.trim()) {
      result = searchReciters(result, searchQuery);
    }

    // Apply filters
    result = filterReciters(result, filters);

    // Apply sort
    result = sortReciters(result, sortBy);

    return result;
  }, [reciters, searchQuery, filters, sortBy]);

  // Build active filter chips
  const activeFilterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];

    if (filters.style) {
      chips.push({
        id: 'style',
        label: `Style: ${filters.style}`,
        type: 'style',
      });
    }

    if (filters.country) {
      chips.push({
        id: 'country',
        label: `Country: ${filters.country}`,
        type: 'country',
      });
    }

    return chips;
  }, [filters]);

  const handleReciterPress = (reciter: Reciter) => {
    // Navigate to ReciterDetail screen
    navigation.navigate('ReciterDetail' as never, {reciter} as never);
  };

  const handleRemoveFilter = useCallback((filterId: string) => {
    setFilters(prev => {
      const newFilters = {...prev};
      if (filterId === 'style') delete newFilters.style;
      if (filterId === 'country') delete newFilters.country;
      return newFilters;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  const handleStyleFilter = (style: string) => {
    setFilters(prev => ({...prev, style: prev.style === style ? undefined : style}));
  };

  const handleCountryFilter = (country: string) => {
    setFilters(prev => ({...prev, country: prev.country === country ? undefined : country}));
  };

  const handleSort = (option: ReciterSortOption) => {
    setSortBy(option);
    setShowSortModal(false);
  };

  const renderReciter = ({item}: {item: Reciter}) => (
    <TouchableOpacity
      style={styles.reciterCard}
      onPress={() => handleReciterPress(item)}
      activeOpacity={0.7}>
      <Text style={styles.reciterName}>{item.nameEnglish}</Text>
      <Text style={styles.reciterNameArabic}>{item.nameArabic}</Text>
      <Text style={styles.reciterStyle}>{item.style}</Text>
      <Text style={styles.reciterCountry}>{item.country}</Text>
      <Text style={styles.tapHint}>Tap to view details</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reciters</Text>
      <Text style={styles.subtitle}>
        {filteredReciters.length} of {reciters.length} reciters
      </Text>

      {/* Search Input */}
      <SearchInput
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search reciters..."
      />

      {/* Filter and Sort Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, filters.style || filters.country ? styles.activeButton : null]}
          onPress={() => setShowFilterModal(true)}
        >
          <Icon name="filter-outline" size={20} color={filters.style || filters.country ? COLORS.white : COLORS.primary} />
          <Text style={[styles.actionButtonText, filters.style || filters.country ? styles.activeButtonText : null]}>
            Filter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowSortModal(true)}
        >
          <Icon name="swap-vertical-outline" size={20} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips */}
      <FilterChips
        filters={activeFilterChips}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* Reciters List */}
      {filteredReciters.length === 0 ? (
        <NoResultsPlaceholder
          message="No reciters found"
          suggestion={searchQuery ? "Try adjusting your search query" : "Try adjusting your filters"}
        />
      ) : (
        <FlatList
          data={filteredReciters}
          renderItem={renderReciter}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Reciters</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Style Filter */}
              <Text style={styles.filterSectionTitle}>Style</Text>
              <View style={styles.filterOptions}>
                {availableStyles.map(style => (
                  <TouchableOpacity
                    key={style}
                    style={[
                      styles.filterOption,
                      filters.style === style && styles.selectedFilterOption,
                    ]}
                    onPress={() => handleStyleFilter(style)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.style === style && styles.selectedFilterOptionText,
                      ]}
                    >
                      {style}
                    </Text>
                    {filters.style === style && (
                      <Icon name="checkmark" size={20} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Country Filter */}
              <Text style={styles.filterSectionTitle}>Country</Text>
              <View style={styles.filterOptions}>
                {availableCountries.map(country => (
                  <TouchableOpacity
                    key={country}
                    style={[
                      styles.filterOption,
                      filters.country === country && styles.selectedFilterOption,
                    ]}
                    onPress={() => handleCountryFilter(country)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.country === country && styles.selectedFilterOptionText,
                      ]}
                    >
                      {country}
                    </Text>
                    {filters.country === country && (
                      <Icon name="checkmark" size={20} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal
        visible={showSortModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSortModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <TouchableOpacity onPress={() => setShowSortModal(false)}>
                <Icon name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'name-asc' && styles.selectedSortOption]}
                onPress={() => handleSort('name-asc')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'name-asc' && styles.selectedSortOptionText]}>
                  Name (A-Z)
                </Text>
                {sortBy === 'name-asc' && <Icon name="checkmark" size={24} color={COLORS.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'name-desc' && styles.selectedSortOption]}
                onPress={() => handleSort('name-desc')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'name-desc' && styles.selectedSortOptionText]}>
                  Name (Z-A)
                </Text>
                {sortBy === 'name-desc' && <Icon name="checkmark" size={24} color={COLORS.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'popular' && styles.selectedSortOption]}
                onPress={() => handleSort('popular')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'popular' && styles.selectedSortOptionText]}>
                  Most Popular
                </Text>
                {sortBy === 'popular' && <Icon name="checkmark" size={24} color={COLORS.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'recent' && styles.selectedSortOption]}
                onPress={() => handleSort('recent')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'recent' && styles.selectedSortOptionText]}>
                  Recently Added
                </Text>
                {sortBy === 'recent' && <Icon name="checkmark" size={24} color={COLORS.primary} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: DIMENSIONS.spacing.lg,
  },
  title: {
    fontSize: DIMENSIONS.fontSize.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  subtitle: {
    fontSize: DIMENSIONS.fontSize.lg,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.lg,
  },
  listContent: {
    paddingBottom: DIMENSIONS.spacing.lg,
  },
  reciterCard: {
    backgroundColor: COLORS.white,
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.lg,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reciterName: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  reciterNameArabic: {
    fontSize: DIMENSIONS.fontSize.lg,
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  reciterStyle: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  reciterCountry: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textLight,
  },
  tapHint: {
    fontSize: DIMENSIONS.fontSize.xs,
    color: COLORS.accent,
    marginTop: DIMENSIONS.spacing.sm,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.sm,
    gap: DIMENSIONS.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  activeButton: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  actionButtonText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.primary,
    marginLeft: DIMENSIONS.spacing.xs,
    fontWeight: '500',
  },
  activeButtonText: {
    color: COLORS.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: DIMENSIONS.borderRadius.xl,
    borderTopRightRadius: DIMENSIONS.borderRadius.xl,
    paddingBottom: DIMENSIONS.spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DIMENSIONS.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: DIMENSIONS.fontSize.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: DIMENSIONS.spacing.lg,
  },
  filterSectionTitle: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DIMENSIONS.spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  selectedFilterOption: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
  },
  selectedFilterOptionText: {
    color: COLORS.white,
    fontWeight: '500',
    marginRight: DIMENSIONS.spacing.xs,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.spacing.md,
    paddingHorizontal: DIMENSIONS.spacing.lg,
    borderRadius: DIMENSIONS.borderRadius.md,
    marginBottom: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.backgroundAlt,
  },
  selectedSortOption: {
    backgroundColor: COLORS.cream,
  },
  sortOptionText: {
    fontSize: DIMENSIONS.fontSize.lg,
    color: COLORS.text,
  },
  selectedSortOptionText: {
    fontWeight: '600',
    color: COLORS.primary,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    marginHorizontal: DIMENSIONS.spacing.lg,
    marginTop: DIMENSIONS.spacing.lg,
    paddingVertical: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.lg,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
});
