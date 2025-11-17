import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import {
  getStorageByReciter,
  deleteDownloadsByReciter,
  getDeviceStorageInfo,
  hasLowStorage,
  hasEnoughSpace,
  getTotalDownloadedSize,
  getAllDownloads,
  saveDownload,
  ReciterStorageInfo,
} from '../src/services/StorageService';
import {Download} from '../src/utils/types';
import {DOWNLOAD_STATUS, AUDIO_QUALITY} from '../src/utils/constants';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('react-native-fs');

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockRNFS = RNFS as jest.Mocked<typeof RNFS>;

describe('StorageService - Storage Management Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStorageByReciter', () => {
    it('should return storage info grouped by reciter', async () => {
      const mockDownloads: Download[] = [
        {
          id: 'reciter1_1_high',
          reciterId: 'reciter1',
          surahId: 1,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 5, // 5 MB
          localPath: '/path/1',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.COMPLETED,
          reciterNameEnglish: 'Abdul Basit',
          reciterNameArabic: 'عبد الباسط',
          surahNameEnglish: 'Al-Fatihah',
        },
        {
          id: 'reciter1_2_high',
          reciterId: 'reciter1',
          surahId: 2,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 10, // 10 MB
          localPath: '/path/2',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.COMPLETED,
          reciterNameEnglish: 'Abdul Basit',
          reciterNameArabic: 'عبد الباسط',
          surahNameEnglish: 'Al-Baqarah',
        },
        {
          id: 'reciter2_1_high',
          reciterId: 'reciter2',
          surahId: 1,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 3, // 3 MB
          localPath: '/path/3',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.COMPLETED,
          reciterNameEnglish: 'Mishary Alafasy',
          reciterNameArabic: 'مشاري العفاسي',
          surahNameEnglish: 'Al-Fatihah',
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDownloads));

      const result = await getStorageByReciter();

      expect(result).toHaveLength(2);

      // Should be sorted by size (largest first)
      expect(result[0].reciterId).toBe('reciter1');
      expect(result[0].reciterName).toBe('Abdul Basit');
      expect(result[0].downloadCount).toBe(2);
      expect(result[0].totalSize).toBe(1024 * 1024 * 15); // 15 MB
      expect(result[0].downloads).toHaveLength(2);

      expect(result[1].reciterId).toBe('reciter2');
      expect(result[1].reciterName).toBe('Mishary Alafasy');
      expect(result[1].downloadCount).toBe(1);
      expect(result[1].totalSize).toBe(1024 * 1024 * 3); // 3 MB
      expect(result[1].downloads).toHaveLength(1);
    });

    it('should return empty array when no downloads exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

      const result = await getStorageByReciter();

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await getStorageByReciter();

      expect(result).toEqual([]);
    });
  });

  describe('deleteDownloadsByReciter', () => {
    it('should delete all downloads for a specific reciter', async () => {
      const mockDownloads: Download[] = [
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
        },
        {
          id: 'reciter2_1_high',
          reciterId: 'reciter2',
          surahId: 1,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 3,
          localPath: '/path/2',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.COMPLETED,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDownloads));
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      await deleteDownloadsByReciter('reciter1');

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        '@khalwa:downloads',
        JSON.stringify([mockDownloads[1]])
      );
    });

    it('should handle errors when deleting', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      await expect(deleteDownloadsByReciter('reciter1')).rejects.toThrow('Storage error');
    });
  });

  describe('getDeviceStorageInfo', () => {
    it('should return device storage information', async () => {
      const mockFSInfo = {
        totalSpace: 1024 * 1024 * 1024 * 64, // 64 GB
        freeSpace: 1024 * 1024 * 1024 * 10, // 10 GB
      };

      (mockRNFS.getFSInfo as jest.Mock).mockResolvedValue(mockFSInfo);

      const result = await getDeviceStorageInfo();

      expect(result.totalSpace).toBe(mockFSInfo.totalSpace);
      expect(result.freeSpace).toBe(mockFSInfo.freeSpace);
      expect(result.usedSpace).toBe(mockFSInfo.totalSpace - mockFSInfo.freeSpace);
    });

    it('should handle errors and return zero values', async () => {
      (mockRNFS.getFSInfo as jest.Mock).mockRejectedValue(new Error('FS error'));

      const result = await getDeviceStorageInfo();

      expect(result).toEqual({
        totalSpace: 0,
        freeSpace: 0,
        usedSpace: 0,
      });
    });
  });

  describe('hasLowStorage', () => {
    it('should return true when free space is less than 500 MB', async () => {
      const mockFSInfo = {
        totalSpace: 1024 * 1024 * 1024 * 64,
        freeSpace: 1024 * 1024 * 400, // 400 MB
      };

      (mockRNFS.getFSInfo as jest.Mock).mockResolvedValue(mockFSInfo);

      const result = await hasLowStorage();

      expect(result).toBe(true);
    });

    it('should return false when free space is more than 500 MB', async () => {
      const mockFSInfo = {
        totalSpace: 1024 * 1024 * 1024 * 64,
        freeSpace: 1024 * 1024 * 1024 * 10, // 10 GB
      };

      (mockRNFS.getFSInfo as jest.Mock).mockResolvedValue(mockFSInfo);

      const result = await hasLowStorage();

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      (mockRNFS.getFSInfo as jest.Mock).mockRejectedValue(new Error('FS error'));

      const result = await hasLowStorage();

      expect(result).toBe(false);
    });
  });

  describe('hasEnoughSpace', () => {
    it('should return true when there is enough space with buffer', async () => {
      const mockFSInfo = {
        totalSpace: 1024 * 1024 * 1024 * 64,
        freeSpace: 1024 * 1024 * 1024 * 2, // 2 GB
      };

      (mockRNFS.getFSInfo as jest.Mock).mockResolvedValue(mockFSInfo);

      const requiredSize = 1024 * 1024 * 100; // 100 MB
      const result = await hasEnoughSpace(requiredSize);

      expect(result).toBe(true);
    });

    it('should return false when there is not enough space (including 10% buffer)', async () => {
      const mockFSInfo = {
        totalSpace: 1024 * 1024 * 1024 * 64,
        freeSpace: 1024 * 1024 * 100, // 100 MB
      };

      (mockRNFS.getFSInfo as jest.Mock).mockResolvedValue(mockFSInfo);

      const requiredSize = 1024 * 1024 * 100; // 100 MB (needs 110 MB with buffer)
      const result = await hasEnoughSpace(requiredSize);

      expect(result).toBe(false);
    });

    it('should handle errors and return false', async () => {
      (mockRNFS.getFSInfo as jest.Mock).mockRejectedValue(new Error('FS error'));

      const requiredSize = 1024 * 1024 * 100;
      const result = await hasEnoughSpace(requiredSize);

      expect(result).toBe(false);
    });
  });

  describe('getTotalDownloadedSize', () => {
    it('should calculate total size of completed downloads', async () => {
      const mockDownloads: Download[] = [
        {
          id: '1',
          reciterId: 'reciter1',
          surahId: 1,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 5, // 5 MB
          localPath: '/path/1',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.COMPLETED,
        },
        {
          id: '2',
          reciterId: 'reciter1',
          surahId: 2,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 10, // 10 MB
          localPath: '/path/2',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.COMPLETED,
        },
        {
          id: '3',
          reciterId: 'reciter1',
          surahId: 3,
          sourceId: 'mp3quran',
          quality: AUDIO_QUALITY.HIGH,
          fileSize: 1024 * 1024 * 3, // 3 MB
          localPath: '/path/3',
          downloadedAt: Date.now(),
          status: DOWNLOAD_STATUS.DOWNLOADING, // Not completed, should not be counted
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockDownloads));

      const result = await getTotalDownloadedSize();

      expect(result).toBe(1024 * 1024 * 15); // Only completed downloads: 5 + 10 = 15 MB
    });

    it('should return 0 when no downloads exist', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify([]));

      const result = await getTotalDownloadedSize();

      expect(result).toBe(0);
    });

    it('should handle errors and return 0', async () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));

      const result = await getTotalDownloadedSize();

      expect(result).toBe(0);
    });
  });
});
