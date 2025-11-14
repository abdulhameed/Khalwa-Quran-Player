import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {COLORS, DIMENSIONS, DOWNLOAD_STATUS} from '../utils/constants';
import {useDownload} from '../contexts/DownloadContext';
import {Download, Reciter, Surah} from '../utils/types';
import {formatFileSize} from '../services/ApiService';

// Import data
import recitersData from '../data/reciters.json';
import surahsData from '../data/surahs.json';

export default function LibraryScreen() {
  const navigation = useNavigation();
  const {downloads, deleteDownload, refreshDownloads} = useDownload();
  const [completedDownloads, setCompletedDownloads] = useState<Download[]>([]);

  // Refresh on focus
  useFocusEffect(
    React.useCallback(() => {
      refreshDownloads();
    }, [refreshDownloads])
  );

  // Filter completed downloads
  useEffect(() => {
    const completed = downloads.filter(
      d => d.status === DOWNLOAD_STATUS.COMPLETED
    );
    setCompletedDownloads(completed);
  }, [downloads]);

  /**
   * Get reciter by ID
   */
  const getReciter = (reciterId: string): Reciter | undefined => {
    return (recitersData as Reciter[]).find(r => r.id === reciterId);
  };

  /**
   * Get surah by ID
   */
  const getSurah = (surahId: number): Surah | undefined => {
    return (surahsData as Surah[]).find(s => s.id === surahId);
  };

  /**
   * Handle delete download
   */
  const handleDelete = (download: Download) => {
    const surah = getSurah(download.surahId);
    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete ${surah?.nameEnglish || 'this surah'}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDownload(download.id);
              Alert.alert('Deleted', 'Download deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete download');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle play download
   */
  const handlePlay = (download: Download) => {
    const reciter = getReciter(download.reciterId);
    const surah = getSurah(download.surahId);

    if (reciter && surah) {
      navigation.navigate('Player' as never, {reciter, surah} as never);
    }
  };

  /**
   * Render download item
   */
  const renderDownloadItem = ({item}: {item: Download}) => {
    const reciter = getReciter(item.reciterId);
    const surah = getSurah(item.surahId);

    if (!reciter || !surah) return null;

    return (
      <View style={styles.downloadItem}>
        <TouchableOpacity
          style={styles.downloadContent}
          onPress={() => handlePlay(item)}
          activeOpacity={0.7}
        >
          <View style={styles.downloadInfo}>
            <Text style={styles.surahName}>{surah.nameArabic}</Text>
            <Text style={styles.surahNameEnglish}>{surah.nameEnglish}</Text>
            <Text style={styles.reciterName}>By {reciter.nameEnglish}</Text>
            <Text style={styles.fileSize}>
              {formatFileSize(item.fileSize)} • {item.quality}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Text style={styles.deleteIcon}>🗑</Text>
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>No downloads yet</Text>
      <Text style={styles.emptySubtext}>
        Download surahs from your favorite reciters for offline listening
      </Text>
    </View>
  );

  /**
   * Calculate total size
   */
  const getTotalSize = (): string => {
    const total = completedDownloads.reduce((sum, d) => sum + d.fileSize, 0);
    return formatFileSize(total);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Library</Text>
          <Text style={styles.subtitle}>Your Downloaded Content</Text>
        </View>
        {completedDownloads.length > 0 && (
          <View style={styles.stats}>
            <Text style={styles.statsCount}>{completedDownloads.length}</Text>
            <Text style={styles.statsLabel}>Downloads</Text>
            <Text style={styles.statsSize}>{getTotalSize()}</Text>
          </View>
        )}
      </View>

      {completedDownloads.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={completedDownloads}
          renderItem={renderDownloadItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: DIMENSIONS.fontSize.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  subtitle: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
  },
  stats: {
    alignItems: 'flex-end',
  },
  statsCount: {
    fontSize: DIMENSIONS.fontSize.xxl,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statsLabel: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
  },
  statsSize: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textLight,
    marginTop: DIMENSIONS.spacing.xs / 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.spacing.xl,
  },
  emptyText: {
    fontSize: DIMENSIONS.fontSize.xl,
    color: COLORS.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: DIMENSIONS.spacing.md,
  },
  emptySubtext: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  listContent: {
    paddingVertical: DIMENSIONS.spacing.sm,
  },
  downloadItem: {
    backgroundColor: COLORS.backgroundAlt,
    marginHorizontal: DIMENSIONS.spacing.md,
    marginVertical: DIMENSIONS.spacing.xs,
    borderRadius: DIMENSIONS.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadContent: {
    flex: 1,
    padding: DIMENSIONS.spacing.md,
  },
  downloadInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  surahNameEnglish: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.xs / 2,
  },
  reciterName: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textLight,
    marginBottom: DIMENSIONS.spacing.xs / 2,
  },
  fileSize: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textLight,
  },
  deleteButton: {
    padding: DIMENSIONS.spacing.md,
  },
  deleteIcon: {
    fontSize: 24,
  },
});
