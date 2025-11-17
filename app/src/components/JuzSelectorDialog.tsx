/**
 * JuzSelectorDialog Component
 * Modal for selecting a Juz (1-30) for batch download
 */

import React, {useMemo} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import {Juz} from '../utils/types';
import {COLORS, DIMENSIONS} from '../utils/constants';
import juzData from '../data/juz.json';

interface JuzSelectorDialogProps {
  visible: boolean;
  reciterName: string;
  onSelect: (juz: Juz) => void;
  onCancel: () => void;
}

export const JuzSelectorDialog: React.FC<JuzSelectorDialogProps> = ({
  visible,
  reciterName,
  onSelect,
  onCancel,
}) => {
  // Convert juz data to typed array
  const juzList = useMemo(() => juzData as Juz[], []);

  /**
   * Get surah count for a Juz
   */
  const getSurahCount = (juz: Juz): number => {
    // Get unique surah IDs (some surahs may span multiple juz)
    const uniqueSurahs = new Set(juz.surahs.map(s => s.surahId));
    return uniqueSurahs.size;
  };

  /**
   * Render Juz option
   */
  const renderJuzOption = ({item}: {item: Juz}) => {
    const surahCount = getSurahCount(item);

    return (
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.juzNumber}>
          <Text style={styles.juzNumberText}>{item.id}</Text>
        </View>

        <View style={styles.optionContent}>
          <Text style={styles.optionLabel}>{item.nameEnglish}</Text>
          <Text style={styles.optionLabelArabic}>{item.nameArabic}</Text>
          <Text style={styles.optionDescription}>
            {surahCount} {surahCount === 1 ? 'Surah' : 'Surahs'}
          </Text>
        </View>

        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render header
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Download by Juz</Text>
      <Text style={styles.subtitle}>{reciterName}</Text>
      <Text style={styles.hint}>
        Select a Juz to download all its surahs
      </Text>
    </View>
  );

  /**
   * Render footer
   */
  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onCancel}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
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
          {renderHeader()}

          {/* Juz Options List */}
          <FlatList
            data={juzList}
            renderItem={renderJuzOption}
            keyExtractor={(item) => item.id.toString()}
            style={styles.content}
            showsVerticalScrollIndicator={true}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
          />

          {renderFooter()}
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
    maxHeight: '80%',
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
    marginBottom: DIMENSIONS.spacing.xs,
  },
  hint: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DIMENSIONS.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  juzNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DIMENSIONS.spacing.md,
  },
  juzNumberText: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  optionLabelArabic: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.primary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
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
