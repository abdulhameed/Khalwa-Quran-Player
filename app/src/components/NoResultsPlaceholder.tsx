/**
 * NoResultsPlaceholder Component
 * Displays when search/filter returns no results
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, DIMENSIONS} from '../utils/constants';

interface NoResultsPlaceholderProps {
  message?: string;
  suggestion?: string;
  iconName?: string;
}

export const NoResultsPlaceholder: React.FC<NoResultsPlaceholderProps> = ({
  message = 'No results found',
  suggestion = 'Try adjusting your search or filters',
  iconName = 'search-outline',
}) => {
  return (
    <View style={styles.container}>
      <Icon name={iconName} size={64} color={COLORS.textLight} />
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.suggestion}>{suggestion}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.spacing.xl,
    paddingVertical: DIMENSIONS.spacing.xl * 2,
  },
  message: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: DIMENSIONS.spacing.lg,
    textAlign: 'center',
  },
  suggestion: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textLight,
    marginTop: DIMENSIONS.spacing.sm,
    textAlign: 'center',
  },
});
