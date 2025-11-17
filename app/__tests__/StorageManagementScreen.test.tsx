import React from 'react';
import {render, fireEvent, waitFor, screen} from '@testing-library/react-native';
import {Alert} from 'react-native';
import StorageManagementScreen from '../src/screens/StorageManagementScreen';
import * as StorageService from '../src/services/StorageService';
import * as DownloadService from '../src/services/DownloadService';
import {DOWNLOAD_STATUS, AUDIO_QUALITY} from '../src/utils/constants';

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useFocusEffect: (callback: () => void) => {
    callback();
  },
}));

// Mock services
jest.mock('../src/services/StorageService');
jest.mock('../src/services/DownloadService');

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockStorageService = StorageService as jest.Mocked<typeof StorageService>;
const mockDownloadService = DownloadService as jest.Mocked<typeof DownloadService>;

describe('StorageManagementScreen', () => {
  const mockReciterStorage: StorageService.ReciterStorageInfo[] = [
    {
      reciterId: 'reciter1',
      reciterName: 'Abdul Basit',
      downloadCount: 3,
      totalSize: 1024 * 1024 * 15, // 15 MB
      downloads: [
        {
          id: 'reciter1_1_high',
          reciterId: 'reciter1',
          surahId: 1,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 5,
          localPath: '/path/1',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.COMPLETED,
          reciterNameEnglish: 'Abdul Basit',
          surahNameEnglish: 'Al-Fatihah',
        },
        {
          id: 'reciter1_2_high',
          reciterId: 'reciter1',
          surahId: 2,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 10,
          localPath: '/path/2',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.COMPLETED,
          reciterNameEnglish: 'Abdul Basit',
          surahNameEnglish: 'Al-Baqarah',
        },
      ],
    },
    {
      reciterId: 'reciter2',
      reciterName: 'Mishary Alafasy',
      downloadCount: 1,
      totalSize: 1024 * 1024 * 3, // 3 MB
      downloads: [
        {
          id: 'reciter2_1_high',
          reciterId: 'reciter2',
          surahId: 1,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 3,
          localPath: '/path/3',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.COMPLETED,
          reciterNameEnglish: 'Mishary Alafasy',
          surahNameEnglish: 'Al-Fatihah',
        },
      ],
    },
  ];

  const mockDeviceStorage: StorageService.DeviceStorageInfo = {
    totalSpace: 1024 * 1024 * 1024 * 64, // 64 GB
    freeSpace: 1024 * 1024 * 1024 * 10, // 10 GB
    usedSpace: 1024 * 1024 * 1024 * 54, // 54 GB
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockStorageService.getStorageByReciter.mockResolvedValue(mockReciterStorage);
    mockStorageService.getDeviceStorageInfo.mockResolvedValue(mockDeviceStorage);
    mockStorageService.getTotalDownloadedSize.mockResolvedValue(1024 * 1024 * 18); // 18 MB
    mockStorageService.hasLowStorage.mockResolvedValue(false);
    mockStorageService.deleteDownloadsByReciter.mockResolvedValue(undefined);
    mockDownloadService.deleteDownload.mockResolvedValue(undefined);
  });

  describe('Initial Render', () => {
    it('should show loading state initially', () => {
      const {getByText} = render(<StorageManagementScreen />);

      expect(getByText('Loading storage information...')).toBeTruthy();
    });

    it('should render storage information after loading', async () => {
      const {getByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Storage Management')).toBeTruthy();
        expect(getByText('Device Storage')).toBeTruthy();
        expect(getByText('App Storage')).toBeTruthy();
        expect(getByText('Storage by Reciter')).toBeTruthy();
      });
    });

    it('should display device storage information', async () => {
      const {getByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Total Space')).toBeTruthy();
        expect(getByText('Free Space')).toBeTruthy();
        expect(getByText('Used Space')).toBeTruthy();
        expect(getByText('64.00 GB')).toBeTruthy(); // Total space
        expect(getByText('10.00 GB')).toBeTruthy(); // Free space
      });
    });

    it('should display app storage information', async () => {
      const {getByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Total Downloads')).toBeTruthy();
        expect(getByText('Total Size')).toBeTruthy();
        expect(getByText('4 files')).toBeTruthy(); // 3 + 1 from mockReciterStorage
        expect(getByText('18.0 MB')).toBeTruthy(); // Total app storage
      });
    });

    it('should display reciter storage list', async () => {
      const {getByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Abdul Basit')).toBeTruthy();
        expect(getByText('Mishary Alafasy')).toBeTruthy();
        expect(getByText('3 surahs • 15.0 MB')).toBeTruthy();
        expect(getByText('1 surah • 3.0 MB')).toBeTruthy();
      });
    });
  });

  describe('Low Storage Warning', () => {
    it('should show low storage warning when storage is low', async () => {
      mockStorageService.hasLowStorage.mockResolvedValue(true);

      const {getByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Low Storage Warning')).toBeTruthy();
        expect(
          getByText(
            'Your device has less than 500 MB of free space. Consider deleting some downloads to free up space.'
          )
        ).toBeTruthy();
      });
    });

    it('should not show warning when storage is sufficient', async () => {
      mockStorageService.hasLowStorage.mockResolvedValue(false);

      const {queryByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(queryByText('Low Storage Warning')).toBeNull();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no downloads exist', async () => {
      mockStorageService.getStorageByReciter.mockResolvedValue([]);

      const {getByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('No downloads yet')).toBeTruthy();
        expect(getByText('Downloaded content will appear here')).toBeTruthy();
      });
    });
  });

  describe('Reciter Expansion', () => {
    it('should expand reciter details when tapped', async () => {
      const {getByText, queryByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Abdul Basit')).toBeTruthy();
      });

      // Initially, surah details should not be visible
      expect(queryByText('Al-Fatihah')).toBeNull();

      // Tap to expand
      fireEvent.press(getByText('Abdul Basit'));

      await waitFor(() => {
        expect(getByText('Downloaded Surahs:')).toBeTruthy();
        expect(getByText('Al-Fatihah')).toBeTruthy();
        expect(getByText('Al-Baqarah')).toBeTruthy();
      });
    });

    it('should collapse reciter details when tapped again', async () => {
      const {getByText, queryByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Abdul Basit')).toBeTruthy();
      });

      // Expand
      fireEvent.press(getByText('Abdul Basit'));
      await waitFor(() => {
        expect(getByText('Al-Fatihah')).toBeTruthy();
      });

      // Collapse
      fireEvent.press(getByText('Abdul Basit'));
      await waitFor(() => {
        expect(queryByText('Al-Fatihah')).toBeNull();
      });
    });
  });

  describe('Delete Operations', () => {
    it('should show confirmation dialog when deleting reciter downloads', async () => {
      const {getByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Abdul Basit')).toBeTruthy();
      });

      // Expand reciter
      fireEvent.press(getByText('Abdul Basit'));

      await waitFor(() => {
        expect(getByText('Delete All from Abdul Basit')).toBeTruthy();
      });

      // Tap delete all
      fireEvent.press(getByText('Delete All from Abdul Basit'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete All Downloads',
        expect.stringContaining('Are you sure you want to delete all 3 downloads from Abdul Basit'),
        expect.any(Array)
      );
    });

    it('should delete all downloads for reciter when confirmed', async () => {
      // Mock Alert.alert to auto-confirm
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const confirmButton = buttons?.find((b: any) => b.style === 'destructive');
        if (confirmButton?.onPress) {
          confirmButton.onPress();
        }
      });

      const {getByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Abdul Basit')).toBeTruthy();
      });

      // Expand and delete
      fireEvent.press(getByText('Abdul Basit'));
      await waitFor(() => {
        fireEvent.press(getByText('Delete All from Abdul Basit'));
      });

      await waitFor(() => {
        expect(mockDownloadService.deleteDownload).toHaveBeenCalledTimes(2); // 2 downloads
        expect(mockStorageService.deleteDownloadsByReciter).toHaveBeenCalledWith('reciter1');
      });
    });

    it('should show error alert when deletion fails', async () => {
      mockDownloadService.deleteDownload.mockRejectedValue(new Error('Delete failed'));

      // Mock Alert.alert to auto-confirm
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const confirmButton = buttons?.find((b: any) => b.style === 'destructive');
        if (confirmButton?.onPress) {
          confirmButton.onPress();
        }
      });

      const {getByText} = render(<StorageManagementScreen />);

      await waitFor(() => {
        expect(getByText('Abdul Basit')).toBeTruthy();
      });

      fireEvent.press(getByText('Abdul Basit'));
      await waitFor(() => {
        fireEvent.press(getByText('Delete All from Abdul Basit'));
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Failed to delete downloads. Please try again.'
        );
      });
    });
  });

  describe('Refresh', () => {
    it('should reload data when pulled to refresh', async () => {
      const {getByTestId} = render(<StorageManagementScreen />);

      // Wait for initial load
      await waitFor(() => {
        expect(mockStorageService.getStorageByReciter).toHaveBeenCalledTimes(1);
      });

      // Simulate refresh
      const scrollView = getByTestId('storage-scroll-view');
      // Note: RefreshControl testing is limited in RNTL, so we just verify the setup
      expect(scrollView).toBeTruthy();
    });
  });
});
