/**
 * SurahsScreen
 * Lists all surahs for a reciter with download functionality
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {Reciter, Surah, AudioQuality} from '../utils/types';
import {COLORS, DIMENSIONS} from '../utils/constants';
import {SurahListItem} from '../components/SurahListItem';
import {QualitySelectionDialog} from '../components/QualitySelectionDialog';
import {useDownload} from '../contexts/DownloadContext';

// Import data
import surahsData from '../data/surahs.json';

type RootStackParamList = {
  Surahs: {reciter: Reciter};
  Player: {reciter: Reciter; surah: Surah};
};

type Props = NativeStackScreenProps<RootStackParamList, 'Surahs'>;

export const SurahsScreen: React.FC<Props> = ({route, navigation}) => {
  const {reciter} = route.params;
  const [surahs] = useState<Surah[]>(surahsData as Surah[]);
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [showQualityDialog, setShowQualityDialog] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedSurahs, setSelectedSurahs] = useState<Set<number>>(new Set());

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
   * Handle quality selection
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
   * Handle batch quality selection
   */
  const handleBatchQualitySelect = async (quality: AudioQuality) => {
    setShowQualityDialog(false);

    const surahsToDownload = surahs.filter(s => selectedSurahs.has(s.id));

    try {
      for (const surah of surahsToDownload) {
        await startDownload(reciter, surah, quality);
      }

      Alert.alert(
        'Downloads Started',
        `${surahsToDownload.length} surahs are downloading...`,
        [{text: 'OK'}]
      );

      setIsMultiSelectMode(false);
      setSelectedSurahs(new Set());
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
   * Render header with batch actions
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.reciterName}>{reciter.nameEnglish}</Text>
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
            style={styles.downloadAllButton}
            onPress={downloadSelectedSurahs}
          >
            <Text style={styles.downloadAllButtonText}>Download Selected</Text>
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
              <Text style={styles.checkmark}>✓</Text>
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
      {renderHeader()}

      <FlatList
        data={surahs}
        renderItem={renderSurahItem}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />

      {selectedSurah && (
        <QualitySelectionDialog
          visible={showQualityDialog}
          surah={selectedSurah}
          onSelect={isMultiSelectMode ? handleBatchQualitySelect : handleQualitySelect}
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
  header: {
    backgroundColor: COLORS.backgroundAlt,
    padding: DIMENSIONS.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reciterName: {
    fontSize: DIMENSIONS.fontSize.xxl,
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
  downloadAllButton: {
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    borderRadius: DIMENSIONS.borderRadius.md,
    backgroundColor: COLORS.secondary,
  },
  downloadAllButtonText: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  listContent: {
    paddingVertical: DIMENSIONS.spacing.sm,
  },
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
  checkmark: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemContent: {
    flex: 1,
  },
});
