/**
 * QualitySelectionDialog Component
 * Modal for selecting download quality with file size estimates
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {AudioQuality, Surah} from '../utils/types';
import {COLORS, DIMENSIONS, AUDIO_QUALITY} from '../utils/constants';
import {getEstimatedFileSize, formatFileSize} from '../services/ApiService';

interface QualitySelectionDialogProps {
  visible: boolean;
  surah: Surah;
  onSelect: (quality: AudioQuality) => void;
  onCancel: () => void;
}

interface QualityOption {
  quality: AudioQuality;
  label: string;
  description: string;
  bitrate: string;
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    quality: AUDIO_QUALITY.LOW,
    label: 'Low Quality',
    description: 'Smallest file size, good for limited storage',
    bitrate: '32 kbps',
  },
  {
    quality: AUDIO_QUALITY.MEDIUM,
    label: 'Medium Quality',
    description: 'Balanced quality and file size',
    bitrate: '64 kbps',
  },
  {
    quality: AUDIO_QUALITY.HIGH,
    label: 'High Quality',
    description: 'Best audio quality, larger file size',
    bitrate: '128 kbps',
  },
];

export const QualitySelectionDialog: React.FC<QualitySelectionDialogProps> = ({
  visible,
  surah,
  onSelect,
  onCancel,
}) => {
  /**
   * Calculate estimated file size for a quality
   */
  const getFileSize = (quality: AudioQuality): string => {
    const bytes = getEstimatedFileSize(surah.duration, quality);
    return formatFileSize(bytes);
  };

  /**
   * Render quality option
   */
  const renderQualityOption = (option: QualityOption) => (
    <TouchableOpacity
      key={option.quality}
      style={styles.optionButton}
      onPress={() => onSelect(option.quality)}
      activeOpacity={0.7}
    >
      <View style={styles.optionContent}>
        <View style={styles.optionHeader}>
          <Text style={styles.optionLabel}>{option.label}</Text>
          <Text style={styles.optionBitrate}>{option.bitrate}</Text>
        </View>
        <Text style={styles.optionDescription}>{option.description}</Text>
        <Text style={styles.optionSize}>
          Estimated size: {getFileSize(option.quality)}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Quality</Text>
            <Text style={styles.subtitle}>
              {surah.nameEnglish} ({surah.nameArabic})
            </Text>
          </View>

          {/* Quality Options */}
          <ScrollView style={styles.content}>
            {QUALITY_OPTIONS.map(renderQualityOption)}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: DIMENSIONS.borderRadius.xl,
    overflow: 'hidden',
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: DIMENSIONS.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: DIMENSIONS.fontSize.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  subtitle: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
  },
  content: {
    maxHeight: 400,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  optionContent: {
    flex: 1,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.xs,
  },
  optionLabel: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionBitrate: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.xs / 2,
  },
  optionSize: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textLight,
  },
  chevron: {
    fontSize: 28,
    color: COLORS.textLight,
    marginLeft: DIMENSIONS.spacing.sm,
  },
  footer: {
    padding: DIMENSIONS.spacing.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  cancelButton: {
    padding: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.md,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
