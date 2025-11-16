/**
 * SurahListItem Component
 * Displays a surah with download button, progress, and status
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Reciter, Surah} from '../utils/types';
import {COLORS, DIMENSIONS, DOWNLOAD_STATUS} from '../utils/constants';
import {useDownload} from '../contexts/DownloadContext';

interface SurahListItemProps {
  reciter: Reciter;
  surah: Surah;
  onPress?: () => void;
  onDownloadPress?: () => void;
}

export const SurahListItem: React.FC<SurahListItemProps> = ({
  reciter,
  surah,
  onPress,
  onDownloadPress,
}) => {
  const {getDownloadStatus, getDownloadProgress} = useDownload();
  const [downloadStatus, setDownloadStatus] = useState<string>(DOWNLOAD_STATUS.NOT_DOWNLOADED);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const status = getDownloadStatus(reciter.id, surah.id);
    setDownloadStatus(status);
    setProgress(getDownloadProgress(reciter.id, surah.id));
  }, [reciter.id, surah.id, getDownloadStatus, getDownloadProgress]);

  /**
   * Render download icon based on status
   */
  const renderDownloadIcon = () => {
    switch (downloadStatus) {
      case DOWNLOAD_STATUS.COMPLETED:
        return (
          <View style={styles.iconContainer}>
            <Icon name="checkmark-circle" size={28} color={COLORS.success} />
          </View>
        );

      case DOWNLOAD_STATUS.DOWNLOADING:
        return (
          <View style={styles.iconContainer}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.progressText}>{Math.round(progress)}%</Text>
          </View>
        );

      case DOWNLOAD_STATUS.QUEUED:
        return (
          <View style={styles.iconContainer}>
            <Icon name="time-outline" size={24} color={COLORS.warning} />
          </View>
        );

      case DOWNLOAD_STATUS.PAUSED:
        return (
          <View style={styles.iconContainer}>
            <Icon name="pause-circle-outline" size={24} color={COLORS.warning} />
          </View>
        );

      case DOWNLOAD_STATUS.FAILED:
        return (
          <View style={styles.iconContainer}>
            <Icon name="alert-circle-outline" size={24} color={COLORS.error} />
          </View>
        );

      default:
        return (
          <TouchableOpacity
            style={styles.downloadButton}
            onPress={onDownloadPress}
          >
            <Icon name="cloud-download-outline" size={22} color={COLORS.white} />
          </TouchableOpacity>
        );
    }
  };

  /**
   * Render progress bar
   */
  const renderProgressBar = () => {
    if (downloadStatus === DOWNLOAD_STATUS.DOWNLOADING) {
      return (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, {width: `${progress}%`}]} />
        </View>
      );
    }
    return null;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Surah Number */}
        <View style={styles.numberContainer}>
          <Text style={styles.number}>{surah.id}</Text>
        </View>

        {/* Surah Info */}
        <View style={styles.info}>
          <Text style={styles.nameArabic}>{surah.nameArabic}</Text>
          <Text style={styles.nameEnglish}>{surah.nameEnglish}</Text>
          <Text style={styles.details}>
            {surah.revelationPlace} • {surah.numberOfAyahs} Ayahs
          </Text>
        </View>

        {/* Download Status */}
        <View style={styles.downloadContainer}>
          {renderDownloadIcon()}
        </View>
      </View>

      {/* Progress Bar */}
      {renderProgressBar()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundAlt,
    marginHorizontal: DIMENSIONS.spacing.md,
    marginVertical: DIMENSIONS.spacing.xs,
    borderRadius: DIMENSIONS.borderRadius.lg,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.spacing.md,
  },
  numberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.spacing.md,
  },
  number: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  info: {
    flex: 1,
  },
  nameArabic: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  nameEnglish: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.xs / 2,
  },
  details: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textLight,
  },
  downloadContainer: {
    marginLeft: DIMENSIONS.spacing.sm,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadIcon: {
    fontSize: 20,
    color: COLORS.white,
  },
  completedIcon: {
    fontSize: 24,
    color: COLORS.success,
  },
  queuedIcon: {
    fontSize: 20,
    color: COLORS.warning,
  },
  pausedIcon: {
    fontSize: 20,
    color: COLORS.warning,
  },
  failedIcon: {
    fontSize: 20,
    color: COLORS.error,
  },
  progressText: {
    fontSize: DIMENSIONS.fontSize.xs,
    color: COLORS.textSecondary,
    marginTop: DIMENSIONS.spacing.xs / 2,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderBottomLeftRadius: DIMENSIONS.borderRadius.lg,
    borderBottomRightRadius: DIMENSIONS.borderRadius.lg,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
});
