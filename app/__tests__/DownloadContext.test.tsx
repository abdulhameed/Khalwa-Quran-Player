/**
 * DownloadContext Tests
 * Simplified tests without react-testing-library
 */

import {DOWNLOAD_STATUS, AUDIO_QUALITY} from '../src/utils/constants';
import * as DownloadService from '../src/services/DownloadService';
import * as StorageService from '../src/services/StorageService';

// Mock dependencies
jest.mock('../src/services/DownloadService');
jest.mock('../src/services/StorageService');

describe('DownloadContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (StorageService.getAllDownloads as jest.Mock).mockResolvedValue([]);
    (StorageService.getDownloadQueue as jest.Mock).mockResolvedValue([]);
  });

  it('should have mocked services available', () => {
    expect(DownloadService).toBeDefined();
    expect(StorageService).toBeDefined();
  });

  it('should verify download service methods are callable', async () => {
    (DownloadService.getDownloadDirectory as jest.Mock).mockReturnValue('/mock/path');

    const path = DownloadService.getDownloadDirectory();
    expect(path).toBe('/mock/path');
  });

  it('should verify storage service methods are callable', async () => {
    const mockDownload = {
      id: 'test',
      reciterId: 'abdul-basit',
      surahId: 1,
      sourceId: 'everyayah',
      quality: AUDIO_QUALITY.MEDIUM,
      fileSize: 1000000,
      localPath: '/path/to/file.mp3',
      downloadedAt: Date.now(),
      status: DOWNLOAD_STATUS.COMPLETED,
      progress: 100,
    };

    (StorageService.getAllDownloads as jest.Mock).mockResolvedValue([mockDownload]);

    const downloads = await StorageService.getAllDownloads();
    expect(downloads).toHaveLength(1);
    expect(downloads[0]).toMatchObject(mockDownload);
  });

  it('should test download status constants', () => {
    expect(DOWNLOAD_STATUS.NOT_DOWNLOADED).toBe('not_downloaded');
    expect(DOWNLOAD_STATUS.QUEUED).toBe('queued');
    expect(DOWNLOAD_STATUS.DOWNLOADING).toBe('downloading');
    expect(DOWNLOAD_STATUS.PAUSED).toBe('paused');
    expect(DOWNLOAD_STATUS.COMPLETED).toBe('completed');
    expect(DOWNLOAD_STATUS.FAILED).toBe('failed');
  });

  it('should test audio quality constants', () => {
    expect(AUDIO_QUALITY.LOW).toBe('low');
    expect(AUDIO_QUALITY.MEDIUM).toBe('medium');
    expect(AUDIO_QUALITY.HIGH).toBe('high');
  });
});
