/**
 * DownloadService Tests
 */

import * as DownloadService from '../src/services/DownloadService';
import * as StorageService from '../src/services/StorageService';
import {DOWNLOAD_STATUS, AUDIO_QUALITY} from '../src/utils/constants';
import {Reciter, Surah} from '../src/utils/types';

// Mock dependencies
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  exists: jest.fn(),
  mkdir: jest.fn(),
  unlink: jest.fn(),
  stat: jest.fn(),
  downloadFile: jest.fn(() => ({
    jobId: 1,
    promise: Promise.resolve({statusCode: 200}),
  })),
  stopDownload: jest.fn(),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      type: 'wifi',
      isConnected: true,
    })
  ),
}));

jest.mock('../src/services/StorageService');

describe('DownloadService', () => {
  const mockReciter: Reciter = {
    id: 'abdul-basit',
    nameArabic: 'عبد الباسط عبد الصمد',
    nameEnglish: 'Abdul Basit',
    photo: '',
    bio: '',
    style: 'Murattal',
    country: 'Egypt',
    sources: [
      {
        sourceId: 'everyayah',
        sourceName: 'EveryAyah',
        baseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps',
        qualities: [AUDIO_QUALITY.HIGH],
      },
    ],
  };

  const mockSurah: Surah = {
    id: 1,
    nameArabic: 'الفاتحة',
    nameEnglish: 'Al-Fatihah',
    transliteration: 'Al-Fatihah',
    revelationPlace: 'Makkah',
    numberOfAyahs: 7,
    duration: 120,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDownloadDirectory', () => {
    it('should return correct download directory path', () => {
      const path = DownloadService.getDownloadDirectory();
      expect(path).toBe('/mock/documents/downloads');
    });
  });

  describe('getFilePath', () => {
    it('should return correct file path for reciter and surah', () => {
      const path = DownloadService.getFilePath('abdul-basit', 1);
      expect(path).toBe('/mock/documents/downloads/reciters/abdul-basit/1.mp3');
    });
  });

  describe('isWiFiConnected', () => {
    it('should return true when WiFi is connected', async () => {
      const isWiFi = await DownloadService.isWiFiConnected();
      expect(isWiFi).toBe(true);
    });
  });

  describe('createDownload', () => {
    it('should create a download with correct properties', async () => {
      (StorageService.saveDownload as jest.Mock).mockResolvedValue(undefined);

      const download = await DownloadService.createDownload(
        mockReciter,
        mockSurah,
        AUDIO_QUALITY.MEDIUM
      );

      expect(download).toMatchObject({
        id: 'abdul-basit_1_medium',
        reciterId: 'abdul-basit',
        surahId: 1,
        quality: AUDIO_QUALITY.MEDIUM,
        status: DOWNLOAD_STATUS.NOT_DOWNLOADED,
        progress: 0,
      });

      expect(StorageService.saveDownload).toHaveBeenCalledWith(download);
    });
  });

  describe('isFileDownloaded', () => {
    it('should return true for completed downloads with existing file', async () => {
      const RNFS = require('react-native-fs');
      RNFS.exists.mockResolvedValue(true);

      (StorageService.getDownloadByReciterAndSurah as jest.Mock).mockResolvedValue({
        id: 'abdul-basit_1_medium',
        reciterId: 'abdul-basit',
        surahId: 1,
        status: DOWNLOAD_STATUS.COMPLETED,
        localPath: '/mock/path/file.mp3',
      });

      const isDownloaded = await DownloadService.isFileDownloaded('abdul-basit', 1);
      expect(isDownloaded).toBe(true);
    });

    it('should return false for non-completed downloads', async () => {
      (StorageService.getDownloadByReciterAndSurah as jest.Mock).mockResolvedValue({
        id: 'abdul-basit_1_medium',
        reciterId: 'abdul-basit',
        surahId: 1,
        status: DOWNLOAD_STATUS.DOWNLOADING,
        localPath: '/mock/path/file.mp3',
      });

      const isDownloaded = await DownloadService.isFileDownloaded('abdul-basit', 1);
      expect(isDownloaded).toBe(false);
    });

    it('should return false when download does not exist', async () => {
      (StorageService.getDownloadByReciterAndSurah as jest.Mock).mockResolvedValue(null);

      const isDownloaded = await DownloadService.isFileDownloaded('abdul-basit', 1);
      expect(isDownloaded).toBe(false);
    });
  });

  describe('getDownloadedFilePath', () => {
    it('should return file path for downloaded files', async () => {
      const RNFS = require('react-native-fs');
      RNFS.exists.mockResolvedValue(true);

      (StorageService.getDownloadByReciterAndSurah as jest.Mock).mockResolvedValue({
        id: 'abdul-basit_1_medium',
        reciterId: 'abdul-basit',
        surahId: 1,
        status: DOWNLOAD_STATUS.COMPLETED,
        localPath: '/mock/path/file.mp3',
      });

      const path = await DownloadService.getDownloadedFilePath('abdul-basit', 1);
      expect(path).toBe('/mock/documents/downloads/reciters/abdul-basit/1.mp3');
    });

    it('should return null for non-downloaded files', async () => {
      (StorageService.getDownloadByReciterAndSurah as jest.Mock).mockResolvedValue(null);

      const path = await DownloadService.getDownloadedFilePath('abdul-basit', 1);
      expect(path).toBeNull();
    });
  });

  describe('getActiveDownloadsCount', () => {
    it('should return 0 when no active downloads', () => {
      const count = DownloadService.getActiveDownloadsCount();
      expect(count).toBe(0);
    });
  });

  describe('getDownloadStats', () => {
    it('should return correct download statistics', async () => {
      (StorageService.getAllDownloads as jest.Mock).mockResolvedValue([
        {status: DOWNLOAD_STATUS.COMPLETED, fileSize: 1000000},
        {status: DOWNLOAD_STATUS.COMPLETED, fileSize: 2000000},
        {status: DOWNLOAD_STATUS.DOWNLOADING, fileSize: 500000},
        {status: DOWNLOAD_STATUS.FAILED, fileSize: 750000},
      ]);

      (StorageService.getTotalDownloadedSize as jest.Mock).mockResolvedValue(3000000);

      const stats = await DownloadService.getDownloadStats();

      expect(stats).toEqual({
        total: 4,
        completed: 2,
        downloading: 1,
        queued: 0,
        failed: 1,
        totalSize: 3000000,
      });
    });
  });
});
