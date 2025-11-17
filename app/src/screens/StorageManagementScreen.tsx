import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {COLORS, DIMENSIONS} from '../utils/constants';
import {
  getStorageByReciter,
  getDeviceStorageInfo,
  getTotalDownloadedSize,
  hasLowStorage,
  ReciterStorageInfo,
  DeviceStorageInfo,
  deleteDownloadsByReciter,
} from '../services/StorageService';
import {deleteDownload, deleteDownloadsByReciter as deleteReciterFiles} from '../services/DownloadService';

export default function StorageManagementScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reciterStorage, setReciterStorage] = useState<ReciterStorageInfo[]>([]);
  const [deviceStorage, setDeviceStorage] = useState<DeviceStorageInfo>({
    totalSpace: 0,
    freeSpace: 0,
    usedSpace: 0,
  });
  const [totalAppStorage, setTotalAppStorage] = useState(0);
  const [showLowStorageWarning, setShowLowStorageWarning] = useState(false);

  useEffect(() => {
    loadStorageData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStorageData();
    }, [])
  );

  const loadStorageData = async () => {
    try {
      setLoading(true);

      // Load all storage data in parallel
      const [reciters, device, total, lowStorage] = await Promise.all([
        getStorageByReciter(),
        getDeviceStorageInfo(),
        getTotalDownloadedSize(),
        hasLowStorage(),
      ]);

      setReciterStorage(reciters);
      setDeviceStorage(device);
      setTotalAppStorage(total);
      setShowLowStorageWarning(lowStorage);
    } catch (error) {
      console.error('Error loading storage data:', error);
      Alert.alert('Error', 'Failed to load storage information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStorageData();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const handleDeleteReciter = (reciterInfo: ReciterStorageInfo) => {
    Alert.alert(
      'Delete All Downloads',
      `Are you sure you want to delete all ${reciterInfo.downloadCount} downloads from ${reciterInfo.reciterName}?\n\nThis will free up ${formatBytes(reciterInfo.totalSize)}.\n\nThis action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all files for this reciter
              for (const download of reciterInfo.downloads) {
                await deleteDownload(download.id);
              }

              // Delete metadata
              await deleteDownloadsByReciter(reciterInfo.reciterId);

              // Reload data
              await loadStorageData();

              Alert.alert('Success', 'All downloads have been deleted');
            } catch (error) {
              console.error('Error deleting reciter downloads:', error);
              Alert.alert('Error', 'Failed to delete downloads. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSurah = (reciterInfo: ReciterStorageInfo, downloadId: string) => {
    const download = reciterInfo.downloads.find(d => d.id === downloadId);
    if (!download) return;

    Alert.alert(
      'Delete Download',
      `Are you sure you want to delete ${download.surahNameEnglish || `Surah ${download.surahId}`}?\n\nThis will free up ${formatBytes(download.fileSize)}.\n\nThis action cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDownload(downloadId);
              await loadStorageData();
            } catch (error) {
              console.error('Error deleting download:', error);
              Alert.alert('Error', 'Failed to delete download. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderReciterStorageItem = (reciterInfo: ReciterStorageInfo) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <View key={reciterInfo.reciterId} style={styles.reciterCard}>
        <TouchableOpacity
          style={styles.reciterHeader}
          onPress={() => setExpanded(!expanded)}>
          <View style={styles.reciterInfo}>
            <Text style={styles.reciterName}>{reciterInfo.reciterName}</Text>
            <Text style={styles.reciterStats}>
              {reciterInfo.downloadCount} {reciterInfo.downloadCount === 1 ? 'surah' : 'surahs'} • {formatBytes(reciterInfo.totalSize)}
            </Text>
          </View>
          <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.reciterDetails}>
            {/* Delete All Button */}
            <TouchableOpacity
              style={styles.deleteAllButton}
              onPress={() => handleDeleteReciter(reciterInfo)}>
              <Text style={styles.deleteAllButtonText}>
                Delete All from {reciterInfo.reciterName}
              </Text>
            </TouchableOpacity>

            {/* Individual Surahs */}
            <Text style={styles.surahListTitle}>Downloaded Surahs:</Text>
            {reciterInfo.downloads.map(download => (
              <View key={download.id} style={styles.surahItem}>
                <View style={styles.surahInfo}>
                  <Text style={styles.surahName}>
                    {download.surahNameEnglish || `Surah ${download.surahId}`}
                  </Text>
                  <Text style={styles.surahSize}>{formatBytes(download.fileSize)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteSurah(reciterInfo, download.id)}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading storage information...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      testID="storage-scroll-view"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }>
      <Text style={styles.title}>Storage Management</Text>
      <Text style={styles.subtitle}>Manage your downloaded content</Text>

      {/* Low Storage Warning */}
      {showLowStorageWarning && (
        <View style={styles.warningCard}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningContent}>
            <Text style={styles.warningTitle}>Low Storage Warning</Text>
            <Text style={styles.warningText}>
              Your device has less than 500 MB of free space. Consider deleting some downloads to free up space.
            </Text>
          </View>
        </View>
      )}

      {/* Device Storage Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Device Storage</Text>

        <View style={styles.storageCard}>
          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Total Space</Text>
            <Text style={styles.storageValue}>{formatBytes(deviceStorage.totalSpace)}</Text>
          </View>

          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Free Space</Text>
            <Text style={[styles.storageValue, styles.freeSpace]}>
              {formatBytes(deviceStorage.freeSpace)}
            </Text>
          </View>

          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Used Space</Text>
            <Text style={styles.storageValue}>{formatBytes(deviceStorage.usedSpace)}</Text>
          </View>
        </View>
      </View>

      {/* App Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Storage</Text>

        <View style={styles.storageCard}>
          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Total Downloads</Text>
            <Text style={styles.storageValue}>
              {reciterStorage.reduce((sum, r) => sum + r.downloadCount, 0)} files
            </Text>
          </View>

          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Total Size</Text>
            <Text style={[styles.storageValue, styles.highlight]}>
              {formatBytes(totalAppStorage)}
            </Text>
          </View>

          <View style={styles.storageRow}>
            <Text style={styles.storageLabel}>Reciters</Text>
            <Text style={styles.storageValue}>{reciterStorage.length}</Text>
          </View>
        </View>
      </View>

      {/* Storage by Reciter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage by Reciter</Text>

        {reciterStorage.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No downloads yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Downloaded content will appear here
            </Text>
          </View>
        ) : (
          reciterStorage.map(renderReciterStorageItem)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: DIMENSIONS.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: DIMENSIONS.spacing.md,
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
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
    marginBottom: DIMENSIONS.spacing.xl,
  },
  warningCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: DIMENSIONS.borderRadius.lg,
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.xl,
    flexDirection: 'row',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningIcon: {
    fontSize: DIMENSIONS.fontSize.xxl,
    marginRight: DIMENSIONS.spacing.md,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  warningText: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: DIMENSIONS.spacing.xl,
  },
  sectionTitle: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.md,
  },
  storageCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius.lg,
    padding: DIMENSIONS.spacing.lg,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  storageLabel: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
  },
  storageValue: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  freeSpace: {
    color: COLORS.success,
  },
  highlight: {
    color: COLORS.primary,
    fontSize: DIMENSIONS.fontSize.lg,
  },
  reciterCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius.lg,
    marginBottom: DIMENSIONS.spacing.md,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  reciterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: DIMENSIONS.spacing.lg,
  },
  reciterInfo: {
    flex: 1,
  },
  reciterName: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  reciterStats: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
  },
  expandIcon: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.primary,
    marginLeft: DIMENSIONS.spacing.md,
  },
  reciterDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    padding: DIMENSIONS.spacing.lg,
    backgroundColor: COLORS.background,
  },
  deleteAllButton: {
    backgroundColor: COLORS.error,
    borderRadius: DIMENSIONS.borderRadius.md,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.md,
  },
  deleteAllButtonText: {
    color: COLORS.white,
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  surahListTitle: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  surahItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DIMENSIONS.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  surahInfo: {
    flex: 1,
  },
  surahName: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
    marginBottom: 2,
  },
  surahSize: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    borderRadius: DIMENSIONS.borderRadius.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontSize: DIMENSIONS.fontSize.sm,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius.lg,
    padding: DIMENSIONS.spacing.xl,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
  },
});
