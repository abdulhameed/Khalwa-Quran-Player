import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {COLORS, DIMENSIONS, AUDIO_QUALITY} from '../utils/constants';
import {UserPreferences, AudioQuality} from '../utils/types';
import {
  getUserPreferences,
  saveUserPreferences,
  getTotalDownloadedSize,
  getAllDownloads,
  hasLowStorage,
  getDeviceStorageInfo,
} from '../services/StorageService';
import {deleteDownload} from '../services/DownloadService';

type ThemeOption = 'light' | 'dark' | 'auto';
type QualityOption = 'low' | 'medium' | 'high';

export default function SettingsScreen() {
  const navigation = useNavigation<any>();
  const [preferences, setPreferences] = useState<UserPreferences>({
    defaultQuality: AUDIO_QUALITY.MEDIUM,
    wifiOnlyDownloads: true,
    autoPlay: false,
    theme: 'auto',
    language: 'ar',
  });
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [showQualityPicker, setShowQualityPicker] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [lowStorage, setLowStorage] = useState(false);
  const [deviceFreeSpace, setDeviceFreeSpace] = useState<number>(0);

  useEffect(() => {
    loadPreferences();
    loadStorageInfo();
  }, []);

  // Reload storage info when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStorageInfo();
    }, [])
  );

  const loadPreferences = async () => {
    try {
      const prefs = await getUserPreferences();
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const [size, downloads, isLowStorage, deviceStorage] = await Promise.all([
        getTotalDownloadedSize(),
        getAllDownloads(),
        hasLowStorage(),
        getDeviceStorageInfo(),
      ]);

      setStorageUsed(size);
      setDownloadCount(downloads.length);
      setLowStorage(isLowStorage);
      setDeviceFreeSpace(deviceStorage.freeSpace);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    try {
      const updated = {...preferences, [key]: value};
      setPreferences(updated);
      await saveUserPreferences({[key]: value});
    } catch (error) {
      console.error('Error updating preference:', error);
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handleClearAllDownloads = () => {
    Alert.alert(
      'Clear All Downloads',
      'Are you sure you want to delete all downloaded files? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              const downloads = await getAllDownloads();

              for (const download of downloads) {
                await deleteDownload(download.id);
              }

              await loadStorageInfo();
              Alert.alert('Success', 'All downloads have been cleared.');
            } catch (error) {
              console.error('Error clearing downloads:', error);
              Alert.alert('Error', 'Failed to clear downloads. Please try again.');
            }
          },
        },
      ],
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const getQualityLabel = (quality: AudioQuality): string => {
    switch (quality) {
      case AUDIO_QUALITY.LOW:
        return 'Low (32 kbps)';
      case AUDIO_QUALITY.MEDIUM:
        return 'Medium (128 kbps)';
      case AUDIO_QUALITY.HIGH:
        return 'High (192 kbps)';
      default:
        return 'Medium';
    }
  };

  const getThemeLabel = (theme: ThemeOption): string => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return 'Auto (System)';
      default:
        return 'Auto';
    }
  };

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: Array<{label: string; value: any}>,
    selectedValue: any,
    onSelect: (value: any) => void,
  ) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          {options.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalOption,
                selectedValue === option.value && styles.modalOptionSelected,
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}>
              <Text
                style={[
                  styles.modalOptionText,
                  selectedValue === option.value &&
                    styles.modalOptionTextSelected,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Customize your experience</Text>

      {/* Audio Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Audio Settings</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowQualityPicker(true)}>
          <Text style={styles.settingLabel}>Default Audio Quality</Text>
          <Text style={styles.settingValue}>
            {getQualityLabel(preferences.defaultQuality)}
          </Text>
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>WiFi-Only Downloads</Text>
            <Text style={styles.settingDescription}>
              Only download over WiFi to save mobile data
            </Text>
          </View>
          <Switch
            value={preferences.wifiOnlyDownloads}
            onValueChange={value => updatePreference('wifiOnlyDownloads', value)}
            trackColor={{false: COLORS.gray, true: COLORS.primary}}
            thumbColor={COLORS.white}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <Text style={styles.settingLabel}>Auto-Play</Text>
            <Text style={styles.settingDescription}>
              Automatically play next surah
            </Text>
          </View>
          <Switch
            value={preferences.autoPlay}
            onValueChange={value => updatePreference('autoPlay', value)}
            trackColor={{false: COLORS.gray, true: COLORS.primary}}
            thumbColor={COLORS.white}
          />
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>

        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => setShowThemePicker(true)}>
          <Text style={styles.settingLabel}>Theme</Text>
          <Text style={styles.settingValue}>
            {getThemeLabel(preferences.theme)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage</Text>

        {/* Low Storage Warning */}
        {lowStorage && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Low storage: Less than 500 MB free
            </Text>
          </View>
        )}

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>App Storage Used</Text>
          <Text style={styles.settingValue}>{formatBytes(storageUsed)}</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Downloads</Text>
          <Text style={styles.settingValue}>{downloadCount} files</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Device Free Space</Text>
          <Text style={[styles.settingValue, lowStorage && styles.lowStorageText]}>
            {formatBytes(deviceFreeSpace)}
          </Text>
        </View>

        {/* Navigate to Storage Management */}
        <TouchableOpacity
          style={[styles.settingItem, styles.primaryButton]}
          onPress={() => navigation.navigate('StorageManagement')}>
          <Text style={styles.primaryButtonText}>Manage Storage</Text>
        </TouchableOpacity>

        {downloadCount > 0 && (
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerButton]}
            onPress={handleClearAllDownloads}>
            <Text style={styles.dangerButtonText}>Clear All Downloads</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>App Version</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Reciters</Text>
          <Text style={styles.settingValue}>20 available</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Surahs</Text>
          <Text style={styles.settingValue}>114 complete</Text>
        </View>
      </View>

      {/* Quality Picker Modal */}
      {renderPickerModal(
        showQualityPicker,
        () => setShowQualityPicker(false),
        'Select Audio Quality',
        [
          {label: 'Low (32 kbps) - Save Data', value: AUDIO_QUALITY.LOW},
          {label: 'Medium (128 kbps) - Balanced', value: AUDIO_QUALITY.MEDIUM},
          {label: 'High (192 kbps) - Best Quality', value: AUDIO_QUALITY.HIGH},
        ],
        preferences.defaultQuality,
        value => updatePreference('defaultQuality', value),
      )}

      {/* Theme Picker Modal */}
      {renderPickerModal(
        showThemePicker,
        () => setShowThemePicker(false),
        'Select Theme',
        [
          {label: 'Light', value: 'light'},
          {label: 'Dark', value: 'dark'},
          {label: 'Auto (System)', value: 'auto'},
        ],
        preferences.theme,
        value => updatePreference('theme', value),
      )}
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
  settingLabelContainer: {
    flex: 1,
    marginRight: DIMENSIONS.spacing.md,
  },
  settingLabel: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.primary,
    fontWeight: '500',
  },
  warningBanner: {
    backgroundColor: '#FFF3E0',
    borderRadius: DIMENSIONS.borderRadius.md,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningIcon: {
    fontSize: DIMENSIONS.fontSize.lg,
    marginRight: DIMENSIONS.spacing.sm,
  },
  warningText: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  lowStorageText: {
    color: COLORS.warning,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  dangerButton: {
    backgroundColor: COLORS.error,
    justifyContent: 'center',
  },
  dangerButtonText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius.xl,
    padding: DIMENSIONS.spacing.xl,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.lg,
    textAlign: 'center',
  },
  modalOption: {
    padding: DIMENSIONS.spacing.lg,
    borderRadius: DIMENSIONS.borderRadius.md,
    marginBottom: DIMENSIONS.spacing.sm,
    backgroundColor: COLORS.background,
  },
  modalOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  modalOptionText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  modalCancelButton: {
    padding: DIMENSIONS.spacing.lg,
    marginTop: DIMENSIONS.spacing.md,
  },
  modalCancelText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
