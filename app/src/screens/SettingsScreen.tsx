import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {COLORS, DIMENSIONS} from '../utils/constants';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Customize your experience</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Settings</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Audio Quality</Text>
          <Text style={styles.settingValue}>High</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>WiFi-Only Downloads</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Total Storage Used</Text>
          <Text style={styles.settingValue}>0 MB</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Version</Text>
          <Text style={styles.settingValue}>0.0.1</Text>
        </View>
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
  section: {
    marginBottom: DIMENSIONS.spacing.xl,
  },
  sectionTitle: {
    fontSize: DIMENSIONS.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.md,
  },
  settingItem: {
    backgroundColor: COLORS.white,
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.sm,
    borderRadius: DIMENSIONS.borderRadius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLabel: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
  },
  settingValue: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
});
