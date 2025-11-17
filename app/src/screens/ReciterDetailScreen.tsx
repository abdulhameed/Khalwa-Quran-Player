/**
 * ReciterDetailScreen
 * Shows reciter profile and lists all surahs with download functionality
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import {Reciter, Surah, AudioQuality, ReciterSource} from '../utils/types';
import {COLORS, DIMENSIONS} from '../utils/constants';
import {SurahListItem} from '../components/SurahListItem';
import {QualitySelectionDialog} from '../components/QualitySelectionDialog';
import {useDownload} from '../contexts/DownloadContext';

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
  const [selectedSurahs, setSelectedSurahs] = useState<Set<number>>(new Set());
  const [selectedSource, setSelectedSource] = useState<ReciterSource>(
    reciter.sources[0]
  );
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  const {startDownload, refreshDownloads} = useDownload();

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
  };

  /**
   * Toggle multi-select mode
   */
  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    setSelectedSurahs(new Set());
  };

  /**
   * Toggle surah selection
   */
  const toggleSurahSelection = (surahId: number) => {
    const newSelected = new Set(selectedSurahs);
    if (newSelected.has(surahId)) {
      newSelected.delete(surahId);
    } else {
      newSelected.add(surahId);
    }
    setSelectedSurahs(newSelected);
  };

  /**
   * Download selected surahs
   */
  const downloadSelectedSurahs = () => {
    if (selectedSurahs.size === 0) {
      Alert.alert('No Selection', 'Please select surahs to download');
      return;
    }

    const firstSurah = surahs.find(s => selectedSurahs.has(s.id));
    if (firstSurah) {
      setSelectedSurah(firstSurah);
      setShowQualityDialog(true);
    }
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

    const surahsToDownload = isDownloadingAll
      ? surahs
      : surahs.filter(s => selectedSurahs.has(s.id));

    try {
      for (const surah of surahsToDownload) {
        await startDownload(reciter, surah, quality);
      }

      Alert.alert(
        'Downloads Started',
        `${surahsToDownload.length} surah${surahsToDownload.length > 1 ? 's' : ''} ${surahsToDownload.length > 1 ? 'are' : 'is'} downloading...`,
        [{text: 'OK'}]
      );

      setIsMultiSelectMode(false);
      setSelectedSurahs(new Set());
      setIsDownloadingAll(false);
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

      {/* Download All Button */}
      <TouchableOpacity
        style={styles.downloadAllButton}
        onPress={handleDownloadAll}
      >
        <Icon name="cloud-download" size={20} color={COLORS.white} />
        <Text style={styles.downloadAllButtonText}>Download All Surahs</Text>
      </TouchableOpacity>
    </View>
  );

  /**
   * Render surah list header
   */
  const renderSurahListHeader = () => (
    <View style={styles.surahListHeader}>
      <View style={styles.surahListHeaderTop}>
        <Text style={styles.surahListTitle}>All Surahs (114)</Text>
        <TouchableOpacity
          style={styles.multiSelectButton}
          onPress={toggleMultiSelectMode}
        >
          <Text style={styles.multiSelectButtonText}>
            {isMultiSelectMode ? 'Cancel' : 'Select'}
          </Text>
        </TouchableOpacity>
      </View>

      {isMultiSelectMode && (
        <View style={styles.batchActions}>
          <Text style={styles.selectedCount}>
            {selectedSurahs.size} selected
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
            selectedSurahs.has(item.id) && styles.checkboxSelected
          ]}>
            {selectedSurahs.has(item.id) && (
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
      <FlatList
        data={surahs}
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

      {selectedSurah && (
        <QualitySelectionDialog
          visible={showQualityDialog}
          surah={selectedSurah}
          onSelect={isMultiSelectMode || isDownloadingAll ? handleBatchQualitySelect : handleQualitySelect}
          onCancel={handleQualityCancel}
        />
      )}
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

  // Download All Button
  downloadAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.md,
    gap: DIMENSIONS.spacing.sm,
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
});
