import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {COLORS, DIMENSIONS} from '../utils/constants';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Continue Listening</Text>
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          Welcome to Khalwa Quran Player
        </Text>
        <Text style={styles.emptySubtext}>
          Start by browsing reciters to begin your journey
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
    color: COLORS.primary,
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
