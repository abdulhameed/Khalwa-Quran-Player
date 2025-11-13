import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS, DIMENSIONS} from '../utils/constants';

export default function LibraryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <Text style={styles.subtitle}>Your Downloaded Content</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>No downloads yet</Text>
        <Text style={styles.emptySubtext}>
          Download surahs from your favorite reciters for offline listening
        </Text>
      </View>
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
    marginBottom: DIMENSIONS.spacing.xl,
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
});
