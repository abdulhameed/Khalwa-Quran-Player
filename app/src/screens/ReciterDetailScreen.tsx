/**
 * ReciterDetailScreen
 * Shows reciter profile and lists all surahs with download functionality
 */

import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {Reciter, Surah, AudioQuality, ReciterSource, Juz} from '../utils/types';
import {COLORS, DIMENSIONS} from '../utils/constants';
import {SurahListItem} from '../components/SurahListItem';
import {QualitySelectionDialog} from '../components/QualitySelectionDialog';
import {JuzSelectorDialog} from '../components/JuzSelectorDialog';
import {SearchInput} from '../components/SearchInput';
import {FilterChips, FilterChip} from '../components/FilterChips';
import {NoResultsPlaceholder} from '../components/NoResultsPlaceholder';
import {useDownload} from '../contexts/DownloadContext';
import {
  searchSurahs,
  filterSurahs,
  sortSurahs,
  SurahFilters,
  SurahSortOption,
} from '../utils/searchUtils';

// Import data
import surahsData from '../data/surahs.json';

type RootStackParamList = {
  ReciterDetail: {reciter: Reciter};
  Player: {reciter: Reciter; surah: Surah};
};

type Props = NativeStackScreenProps<RootStackParamList, 'ReciterDetail'>;

export const ReciterDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {reciter} = route.params;
  const [surahs] = useState<Surah[]>(surahsData as Surah[]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [showQualityDialog, setShowQualityDialog] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSurahsSet, setSelectedSurahsSet] = useState<Set<number>>(new Set());
  const [selectedSource, setSelectedSource] = useState<ReciterSource>(
    reciter.sources[0]
  );
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [showJuzSelector, setShowJuzSelector] = useState(false);
  const [selectedJuz, setSelectedJuz] = useState<Juz | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SurahFilters>({});
  const [sortBy, setSortBy] = useState<SurahSortOption>('number-asc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]); // TODO: Load from AsyncStorage

  const {startDownload, refreshDownloads, downloads} = useDownload();

  // Apply search, filter, and sort to surahs
  const filteredSurahs = useMemo(() => {
    let result = surahs;

    // Apply search
    if (searchQuery.trim()) {
      result = searchSurahs(result, searchQuery);
    }

    // Apply filters (including downloads from context)
    const reciterDownloads = downloads.filter(d => d.reciterId === reciter.id);
    result = filterSurahs(result, filters, reciterDownloads, favorites);

    // Apply sort
    result = sortSurahs(result, sortBy);

    return result;
  }, [surahs, searchQuery, filters, sortBy, downloads, favorites, reciter.id]);

  // Build active filter chips
  const activeFilterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];

    if (filters.length) {
      const lengthLabel = filters.length === 'short' ? 'Short' : filters.length === 'medium' ? 'Medium' : 'Long';
      chips.push({
        id: 'length',
        label: lengthLabel,
        type: 'length',
      });
    }

    if (filters.revelationPlace) {
      chips.push({
        id: 'revelation',
        label: filters.revelationPlace,
        type: 'revelation',
      });
    }

    if (filters.downloaded !== undefined) {
      chips.push({
        id: 'downloaded',
        label: filters.downloaded ? 'Downloaded' : 'Not Downloaded',
        type: 'downloaded',
      });
    }

    if (filters.favorite) {
      chips.push({
        id: 'favorite',
        label: 'Favorites',
        type: 'favorite',
      });
    }

    return chips;
  }, [filters]);

  // Refresh downloads when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refreshDownloads();
    });

    return unsubscribe;
  }, [navigation, refreshDownloads]);

  /**
   * Handle surah press (play)
   */
  const handleSurahPress = (surah: Surah) => {
    if (isMultiSelectMode) {
      toggleSurahSelection(surah.id);
    } else {
      navigation.navigate('Player', {reciter, surah});
    }
  };

  /**
   * Handle download press
   */
  const handleDownloadPress = (surah: Surah) => {
    setSelectedSurah(surah);
    setShowQualityDialog(true);
  };

  /**
   * Handle quality selection for single download
   */
  const handleQualitySelect = async (quality: AudioQuality) => {
    if (!selectedSurah) return;

    setShowQualityDialog(false);

    try {
      await startDownload(reciter, selectedSurah, quality);
      Alert.alert(
        'Download Started',
        `${selectedSurah.nameEnglish} is downloading...`,
        [{text: 'OK'}]
      );
    } catch (error: any) {
      Alert.alert(
        'Download Failed',
        error.message || 'Failed to start download',
        [{text: 'OK'}]
      );
    }

    setSelectedSurah(null);
  };

  /**
   * Handle quality dialog cancel
   */
  const handleQualityCancel = () => {
    setShowQualityDialog(false);
    setSelectedSurah(null);
    setIsDownloadingAll(false);
    setSelectedJuz(null);
  };

  /**
   * Toggle multi-select mode
   */
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedSurahsSet(new Set());
  };

  /**
   * Toggle surah selection
   */
  const toggleSurahSelection = (surahId: number) => {
    const newSelected = new Set(selectedSurahsSet);
    if (newSelected.has(surahId)) {
      newSelected.delete(surahId);
    } else {
      newSelected.add(surahId);
    }
    setSelectedSurahsSet(newSelected);
  };

  /**
   * Download selected surahs
   */
  const downloadSelectedSurahs = () => {
    if (selectedSurahsSet.size === 0) {
      Alert.alert('No Selection', 'Please select surahs to download');
      return;
    }

    const firstSurah = surahs.find(s => selectedSurahsSet.has(s.id));
    if (firstSurah) {
      setSelectedSurah(firstSurah);
      setShowQualityDialog(true);
    }
  };

  /**
   * Handle filter chip removal
   */
  const handleRemoveFilter = useCallback((filterId: string) => {
    setFilters(prev => {
      const newFilters = {...prev};
      if (filterId === 'length') delete newFilters.length;
      if (filterId === 'revelation') delete newFilters.revelationPlace;
      if (filterId === 'downloaded') delete newFilters.downloaded;
      if (filterId === 'favorite') delete newFilters.favorite;
      return newFilters;
    });
  }, []);

  /**
   * Handle clear all filters
   */
  const handleClearAllFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  /**
   * Handle length filter
   */
  const handleLengthFilter = (length: 'short' | 'medium' | 'long') => {
    setFilters(prev => ({...prev, length: prev.length === length ? undefined : length}));
  };

  /**
   * Handle revelation place filter
   */
  const handleRevelationFilter = (place: 'Makkah' | 'Madinah') => {
    setFilters(prev => ({...prev, revelationPlace: prev.revelationPlace === place ? undefined : place}));
  };

  /**
   * Handle downloaded filter
   */
  const handleDownloadedFilter = (downloaded: boolean) => {
    setFilters(prev => ({...prev, downloaded: prev.downloaded === downloaded ? undefined : downloaded}));
  };

  /**
   * Handle favorite filter
   */
  const handleFavoriteFilter = () => {
    setFilters(prev => ({...prev, favorite: !prev.favorite}));
  };

  /**
   * Handle sort selection
   */
  const handleSort = (option: SurahSortOption) => {
    setSortBy(option);
    setShowSortModal(false);
  };

  /**
   * Handle Download All button press
   */
  const handleDownloadAll = () => {
    setIsDownloadingAll(true);
    setSelectedSurah(surahs[0]); // Use first surah for quality dialog
    setShowQualityDialog(true);
  };

  /**
   * Handle batch quality selection
   */
  const handleBatchQualitySelect = async (quality: AudioQuality) => {
    setShowQualityDialog(false);

    let surahsToDownload: Surah[] = [];

    // Determine which surahs to download
    if (isDownloadingAll) {
      surahsToDownload = surahs;
    } else if (selectedJuz) {
      // Get unique surah IDs from the selected Juz
      const juzSurahIds = selectedJuz.surahs.map(js => js.surahId);
      surahsToDownload = surahs.filter(s => juzSurahIds.includes(s.id));
    } else {
      surahsToDownload = surahs.filter(s => selectedSurahsSet.has(s.id));
    }

    try {
      for (const surah of surahsToDownload) {
        await startDownload(reciter, surah, quality);
      }

      const downloadType = selectedJuz
        ? `${selectedJuz.nameEnglish}`
        : isDownloadingAll
        ? 'all surahs'
        : 'selected surahs';

      Alert.alert(
        'Downloads Started',
        `${surahsToDownload.length} surah${surahsToDownload.length > 1 ? 's' : ''} from ${downloadType} ${surahsToDownload.length > 1 ? 'are' : 'is'} downloading...`,
        [{text: 'OK'}]
      );

      setIsMultiSelectMode(false);
      setSelectedSurahsSet(new Set());
      setIsDownloadingAll(false);
      setSelectedJuz(null);
    } catch (error: any) {
      Alert.alert(
        'Download Failed',
        error.message || 'Failed to start downloads',
        [{text: 'OK'}]
      );
    }

    setSelectedSurah(null);
  };

  /**
   * Handle source selection
   */
  const handleSourceSelect = (source: ReciterSource) => {
    setSelectedSource(source);
    setShowSourceDropdown(false);
  };

  /**
   * Handle Download by Juz button press
   */
  const handleDownloadByJuz = () => {
    setShowJuzSelector(true);
  };

  /**
   * Handle Juz selection
   */
  const handleJuzSelect = (juz: Juz) => {
    setSelectedJuz(juz);
    setShowJuzSelector(false);
    // Use first surah for quality dialog display
    setSelectedSurah(surahs[0]);
    setShowQualityDialog(true);
  };

  /**
   * Handle Juz selector cancel
   */
  const handleJuzSelectorCancel = () => {
    setShowJuzSelector(false);
  };

  /**
   * Render reciter profile header
   */
  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      {/* Reciter Photo */}
      {reciter.photo && (
        <Image
          source={{uri: reciter.photo}}
          style={styles.reciterPhoto}
          resizeMode="cover"
        />
      )}

      {/* Reciter Info */}
      <View style={styles.reciterInfo}>
        <Text style={styles.reciterNameArabic}>{reciter.nameArabic}</Text>
        <Text style={styles.reciterNameEnglish}>{reciter.nameEnglish}</Text>

        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Icon name="musical-notes-outline" size={16} color={COLORS.primary} />
            <Text style={styles.metaText}>{reciter.style}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="location-outline" size={16} color={COLORS.primary} />
            <Text style={styles.metaText}>{reciter.country}</Text>
          </View>
        </View>

        {reciter.bio && (
          <Text style={styles.bio}>{reciter.bio}</Text>
        )}
      </View>

      {/* Source Selector */}
      {reciter.sources.length > 1 && (
        <View style={styles.sourceSelector}>
          <Text style={styles.sourceSelectorLabel}>Audio Source:</Text>
          <TouchableOpacity
            style={styles.sourceDropdown}
            onPress={() => setShowSourceDropdown(!showSourceDropdown)}
          >
            <Text style={styles.sourceDropdownText} numberOfLines={1}>
              {selectedSource.sourceName}
            </Text>
            <Icon
              name={showSourceDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color={COLORS.primary}
            />
          </TouchableOpacity>

          {showSourceDropdown && (
            <View style={styles.sourceDropdownList}>
              {reciter.sources.map((source) => (
                <TouchableOpacity
                  key={source.sourceId}
                  style={[
                    styles.sourceDropdownItem,
                    selectedSource.sourceId === source.sourceId && styles.sourceDropdownItemSelected
                  ]}
                  onPress={() => handleSourceSelect(source)}
                >
                  <Text
                    style={[
                      styles.sourceDropdownItemText,
                      selectedSource.sourceId === source.sourceId && styles.sourceDropdownItemTextSelected
                    ]}
                  >
                    {source.sourceName}
                  </Text>
                  {selectedSource.sourceId === source.sourceId && (
                    <Icon name="checkmark" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Batch Download Buttons */}
      <View style={styles.batchDownloadContainer}>
        <TouchableOpacity
          style={styles.downloadByJuzButton}
          onPress={handleDownloadByJuz}
        >
          <Icon name="albums-outline" size={20} color={COLORS.white} />
          <Text style={styles.downloadByJuzButtonText}>By Juz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.downloadAllButton}
          onPress={handleDownloadAll}
        >
          <Icon name="cloud-download" size={20} color={COLORS.white} />
          <Text style={styles.downloadAllButtonText}>All Surahs</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /**
   * Render surah list header
   */
  const renderSurahListHeader = () => (
    <View style={styles.surahListHeader}>
      <View style={styles.surahListHeaderTop}>
        <Text style={styles.surahListTitle}>
          {filteredSurahs.length} of {surahs.length} Surahs
        </Text>
        <TouchableOpacity
          style={styles.multiSelectButton}
          onPress={toggleMultiSelectMode}
        >
          <Text style={styles.multiSelectButtonText}>
            {isMultiSelectMode ? 'Cancel' : 'Select'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search surahs..."
        />
      </View>

      {/* Filter and Sort Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            (filters.length || filters.revelationPlace || filters.downloaded !== undefined || filters.favorite) ?
              styles.activeButton : null
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Icon
            name="filter-outline"
            size={18}
            color={(filters.length || filters.revelationPlace || filters.downloaded !== undefined || filters.favorite) ?
              COLORS.white : COLORS.primary}
          />
          <Text style={[
            styles.actionButtonText,
            (filters.length || filters.revelationPlace || filters.downloaded !== undefined || filters.favorite) ?
              styles.activeButtonText : null
          ]}>
            Filter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowSortModal(true)}
        >
          <Icon name="swap-vertical-outline" size={18} color={COLORS.primary} />
          <Text style={styles.actionButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips */}
      <FilterChips
        filters={activeFilterChips}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
      />

      {isMultiSelectMode && (
        <View style={styles.batchActions}>
          <Text style={styles.selectedCount}>
            {selectedSurahsSet.size} selected
          </Text>
          <TouchableOpacity
            style={styles.downloadSelectedButton}
            onPress={downloadSelectedSurahs}
          >
            <Text style={styles.downloadSelectedButtonText}>Download Selected</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  /**
   * Render surah item
   */
  const renderSurahItem = ({item}: {item: Surah}) => (
    <View style={styles.itemContainer}>
      {isMultiSelectMode && (
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => toggleSurahSelection(item.id)}
        >
          <View style={[
            styles.checkboxInner,
            selectedSurahsSet.has(item.id) && styles.checkboxSelected
          ]}>
            {selectedSurahsSet.has(item.id) && (
              <Icon name="checkmark" size={16} color={COLORS.white} />
            )}
          </View>
        </TouchableOpacity>
      )}
      <View style={styles.itemContent}>
        <SurahListItem
          reciter={reciter}
          surah={item}
          onPress={() => handleSurahPress(item)}
          onDownloadPress={() => handleDownloadPress(item)}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {filteredSurahs.length === 0 ? (
        <>
          <ScrollView>
            {renderProfileHeader()}
            {renderSurahListHeader()}
          </ScrollView>
          <NoResultsPlaceholder
            message="No surahs found"
            suggestion={searchQuery ? "Try adjusting your search query" : "Try adjusting your filters"}
          />
        </>
      ) : (
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahItem}
          keyExtractor={item => item.id.toString()}
          ListHeaderComponent={
            <>
              {renderProfileHeader()}
              {renderSurahListHeader()}
            </>
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      {selectedSurah && (
        <QualitySelectionDialog
          visible={showQualityDialog}
          surah={selectedSurah}
          onSelect={isMultiSelectMode || isDownloadingAll || selectedJuz ? handleBatchQualitySelect : handleQualitySelect}
          onCancel={handleQualityCancel}
        />
      )}

      <JuzSelectorDialog
        visible={showJuzSelector}
        reciterName={reciter.nameEnglish}
        onSelect={handleJuzSelect}
        onCancel={handleJuzSelectorCancel}
      />

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
              <Text style={styles.modalTitle}>Filter Surahs</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Icon name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Length Filter */}
              <Text style={styles.filterSectionTitle}>Length</Text>
              <View style={styles.filterOptions}>
                {['short', 'medium', 'long'].map(length => (
                  <TouchableOpacity
                    key={length}
                    style={[
                      styles.filterOption,
                      filters.length === length && styles.selectedFilterOption,
                    ]}
                    onPress={() => handleLengthFilter(length as 'short' | 'medium' | 'long')}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.length === length && styles.selectedFilterOptionText,
                      ]}
                    >
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </Text>
                    {filters.length === length && (
                      <Icon name="checkmark" size={20} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Revelation Place Filter */}
              <Text style={styles.filterSectionTitle}>Revelation Place</Text>
              <View style={styles.filterOptions}>
                {['Makkah', 'Madinah'].map(place => (
                  <TouchableOpacity
                    key={place}
                    style={[
                      styles.filterOption,
                      filters.revelationPlace === place && styles.selectedFilterOption,
                    ]}
                    onPress={() => handleRevelationFilter(place as 'Makkah' | 'Madinah')}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.revelationPlace === place && styles.selectedFilterOptionText,
                      ]}
                    >
                      {place}
                    </Text>
                    {filters.revelationPlace === place && (
                      <Icon name="checkmark" size={20} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Downloaded Filter */}
              <Text style={styles.filterSectionTitle}>Download Status</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.downloaded === true && styles.selectedFilterOption,
                  ]}
                  onPress={() => handleDownloadedFilter(true)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.downloaded === true && styles.selectedFilterOptionText,
                    ]}
                  >
                    Downloaded
                  </Text>
                  {filters.downloaded === true && (
                    <Icon name="checkmark" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.downloaded === false && styles.selectedFilterOption,
                  ]}
                  onPress={() => handleDownloadedFilter(false)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.downloaded === false && styles.selectedFilterOptionText,
                    ]}
                  >
                    Not Downloaded
                  </Text>
                  {filters.downloaded === false && (
                    <Icon name="checkmark" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Favorites Filter */}
              <Text style={styles.filterSectionTitle}>Favorites</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    filters.favorite && styles.selectedFilterOption,
                  ]}
                  onPress={handleFavoriteFilter}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      filters.favorite && styles.selectedFilterOptionText,
                    ]}
                  >
                    Show Favorites Only
                  </Text>
                  {filters.favorite && (
                    <Icon name="checkmark" size={20} color={COLORS.white} />
                  )}
                </TouchableOpacity>
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
                style={[styles.sortOption, sortBy === 'number-asc' && styles.selectedSortOption]}
                onPress={() => handleSort('number-asc')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'number-asc' && styles.selectedSortOptionText]}>
                  Number (1-114)
                </Text>
                {sortBy === 'number-asc' && <Icon name="checkmark" size={24} color={COLORS.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'number-desc' && styles.selectedSortOption]}
                onPress={() => handleSort('number-desc')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'number-desc' && styles.selectedSortOptionText]}>
                  Number (114-1)
                </Text>
                {sortBy === 'number-desc' && <Icon name="checkmark" size={24} color={COLORS.primary} />}
              </TouchableOpacity>

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
                style={[styles.sortOption, sortBy === 'length-asc' && styles.selectedSortOption]}
                onPress={() => handleSort('length-asc')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'length-asc' && styles.selectedSortOptionText]}>
                  Length (Shortest First)
                </Text>
                {sortBy === 'length-asc' && <Icon name="checkmark" size={24} color={COLORS.primary} />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sortOption, sortBy === 'length-desc' && styles.selectedSortOption]}
                onPress={() => handleSort('length-desc')}
              >
                <Text style={[styles.sortOptionText, sortBy === 'length-desc' && styles.selectedSortOptionText]}>
                  Length (Longest First)
                </Text>
                {sortBy === 'length-desc' && <Icon name="checkmark" size={24} color={COLORS.primary} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    paddingBottom: DIMENSIONS.spacing.xl,
  },

  // Profile Header
  profileHeader: {
    backgroundColor: COLORS.backgroundAlt,
    padding: DIMENSIONS.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  reciterPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
    marginBottom: DIMENSIONS.spacing.md,
    backgroundColor: COLORS.cream,
  },
  reciterInfo: {
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.md,
  },
  reciterNameArabic: {
    fontSize: DIMENSIONS.fontSize.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
    textAlign: 'center',
  },
  reciterNameEnglish: {
    fontSize: DIMENSIONS.fontSize.xl,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.md,
    textAlign: 'center',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DIMENSIONS.spacing.xs,
  },
  metaText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
  },
  bio: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: DIMENSIONS.spacing.sm,
  },

  // Source Selector
  sourceSelector: {
    marginBottom: DIMENSIONS.spacing.md,
  },
  sourceSelectorLabel: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.xs,
    fontWeight: '600',
  },
  sourceDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  sourceDropdownText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
    flex: 1,
  },
  sourceDropdownList: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius.md,
    marginTop: DIMENSIONS.spacing.xs,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    overflow: 'hidden',
  },
  sourceDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: DIMENSIONS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  sourceDropdownItemSelected: {
    backgroundColor: COLORS.cream,
  },
  sourceDropdownItemText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
  },
  sourceDropdownItemTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },

  // Batch Download Buttons
  batchDownloadContainer: {
    flexDirection: 'row',
    gap: DIMENSIONS.spacing.sm,
  },
  downloadByJuzButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    padding: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.md,
    gap: DIMENSIONS.spacing.xs,
  },
  downloadByJuzButtonText: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  downloadAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.md,
    gap: DIMENSIONS.spacing.xs,
  },
  downloadAllButtonText: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Surah List Header
  surahListHeader: {
    backgroundColor: COLORS.backgroundAlt,
    padding: DIMENSIONS.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  surahListHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  surahListTitle: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  multiSelectButton: {
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    borderRadius: DIMENSIONS.borderRadius.md,
    backgroundColor: COLORS.primary,
  },
  multiSelectButtonText: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  batchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: DIMENSIONS.spacing.md,
  },
  selectedCount: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
  },
  downloadSelectedButton: {
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    borderRadius: DIMENSIONS.borderRadius.md,
    backgroundColor: COLORS.secondary,
  },
  downloadSelectedButtonText: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.white,
  },

  // Surah List Items
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginLeft: DIMENSIONS.spacing.md,
    marginRight: DIMENSIONS.spacing.sm,
  },
  checkboxInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
  },
  itemContent: {
    flex: 1,
  },

  // Search and Filter UI
  searchContainer: {
    marginTop: DIMENSIONS.spacing.md,
    marginBottom: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: DIMENSIONS.spacing.lg,
    marginTop: DIMENSIONS.spacing.sm,
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
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.primary,
    marginLeft: DIMENSIONS.spacing.xs,
    fontWeight: '500',
  },
  activeButtonText: {
    color: COLORS.white,
  },

  // Modal styles
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
