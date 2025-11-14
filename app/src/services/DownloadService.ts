/**
 * DownloadService
 * Handles audio file downloads with queue management, progress tracking,
 * pause/resume, and retry functionality
 */

import RNFS from 'react-native-fs';
import NetInfo from '@react-native-community/netinfo';
import {Download, Reciter, Surah, AudioQuality} from '../utils/types';
import {DOWNLOAD_STATUS} from '../utils/constants';
import {buildAudioUrl, getEstimatedFileSize} from './ApiService';
import * as StorageService from './StorageService';

// Download job tracking
interface DownloadJob {
  downloadId: string;
  jobId: number;
  promise: RNFS.DownloadResult | null;
}

// Active downloads tracking
const activeDownloads: Map<string, DownloadJob> = new Map();

// Download callbacks
type DownloadProgressCallback = (downloadId: string, progress: number) => void;
type DownloadStatusCallback = (downloadId: string, status: string) => void;

let progressCallback: DownloadProgressCallback | null = null;
let statusCallback: DownloadStatusCallback | null = null;

/**
 * Set progress callback
 */
export const setProgressCallback = (callback: DownloadProgressCallback): void => {
  progressCallback = callback;
};

/**
 * Set status callback
 */
export const setStatusCallback = (callback: DownloadStatusCallback): void => {
  statusCallback = callback;
};

/**
 * Get download directory path
 */
export const getDownloadDirectory = (): string => {
  return `${RNFS.DocumentDirectoryPath}/downloads`;
};

/**
 * Get file path for a download
 */
export const getFilePath = (reciterId: string, surahId: number): string => {
  return `${getDownloadDirectory()}/reciters/${reciterId}/${surahId}.mp3`;
};

/**
 * Ensure directory exists
 */
const ensureDirectoryExists = async (filePath: string): Promise<void> => {
  const directory = filePath.substring(0, filePath.lastIndexOf('/'));
  const exists = await RNFS.exists(directory);

  if (!exists) {
    await RNFS.mkdir(directory, {recursive: true});
  }
};

/**
 * Check if WiFi is available
 */
export const isWiFiConnected = async (): Promise<boolean> => {
  try {
    const state = await NetInfo.fetch();
    return state.type === 'wifi' && state.isConnected === true;
  } catch (error) {
    console.error('Error checking WiFi:', error);
    return false;
  }
};

/**
 * Create a download
 */
export const createDownload = async (
  reciter: Reciter,
  surah: Surah,
  quality: AudioQuality,
): Promise<Download> => {
  const downloadId = `${reciter.id}_${surah.id}_${quality}`;
  const localPath = getFilePath(reciter.id, surah.id);
  const fileSize = getEstimatedFileSize(surah.duration, quality);

  const download: Download = {
    id: downloadId,
    reciterId: reciter.id,
    surahId: surah.id,
    sourceId: reciter.sources[0]?.sourceId || 'unknown',
    quality,
    fileSize,
    localPath,
    downloadedAt: Date.now(),
    status: DOWNLOAD_STATUS.NOT_DOWNLOADED,
    progress: 0,
  };

  await StorageService.saveDownload(download);
  return download;
};

/**
 * Download a single file
 */
export const downloadFile = async (
  reciter: Reciter,
  surah: Surah,
  quality: AudioQuality,
): Promise<Download> => {
  const downloadId = `${reciter.id}_${surah.id}_${quality}`;

  // Check if download already exists
  let download = await StorageService.getDownload(downloadId);

  if (!download) {
    download = await createDownload(reciter, surah, quality);
  }

  // Check if already downloaded
  if (download.status === DOWNLOAD_STATUS.COMPLETED) {
    const fileExists = await RNFS.exists(download.localPath);
    if (fileExists) {
      return download;
    }
  }

  // Check WiFi requirement
  const preferences = await StorageService.getUserPreferences();
  if (preferences.wifiOnlyDownloads) {
    const isWiFi = await isWiFiConnected();
    if (!isWiFi) {
      throw new Error('WiFi connection required for downloads');
    }
  }

  // Add to queue
  await addToQueue(downloadId);

  // Start download
  await startDownload(download, reciter, surah, quality);

  return download;
};

/**
 * Start a download
 */
const startDownload = async (
  download: Download,
  reciter: Reciter,
  surah: Surah,
  quality: AudioQuality,
): Promise<void> => {
  try {
    // Update status to downloading
    download.status = DOWNLOAD_STATUS.DOWNLOADING;
    download.progress = 0;
    await StorageService.saveDownload(download);
    statusCallback?.(download.id, DOWNLOAD_STATUS.DOWNLOADING);

    // Build audio URL
    const url = buildAudioUrl(reciter, surah, quality);

    // Ensure directory exists
    await ensureDirectoryExists(download.localPath);

    // Start download
    const downloadResult = RNFS.downloadFile({
      fromUrl: url,
      toFile: download.localPath,
      background: true,
      discretionary: true,
      cacheable: false,
      progress: (res) => {
        const progress = (res.bytesWritten / res.contentLength) * 100;
        handleProgress(download.id, progress);
      },
      progressInterval: 500,
    });

    // Track active download
    activeDownloads.set(download.id, {
      downloadId: download.id,
      jobId: downloadResult.jobId,
      promise: downloadResult,
    });

    // Wait for download to complete
    const result = await downloadResult.promise;

    if (result.statusCode === 200) {
      // Success
      download.status = DOWNLOAD_STATUS.COMPLETED;
      download.progress = 100;
      download.downloadedAt = Date.now();

      // Get actual file size
      const stat = await RNFS.stat(download.localPath);
      download.fileSize = parseInt(stat.size, 10);

      await StorageService.saveDownload(download);
      await StorageService.removeFromDownloadQueue(download.id);

      statusCallback?.(download.id, DOWNLOAD_STATUS.COMPLETED);
      progressCallback?.(download.id, 100);

      activeDownloads.delete(download.id);

      // Process next in queue
      await processQueue();
    } else {
      throw new Error(`Download failed with status code: ${result.statusCode}`);
    }
  } catch (error) {
    console.error('Download error:', error);

    // Update status to failed
    download.status = DOWNLOAD_STATUS.FAILED;
    await StorageService.saveDownload(download);
    statusCallback?.(download.id, DOWNLOAD_STATUS.FAILED);

    activeDownloads.delete(download.id);

    // Process next in queue
    await processQueue();

    throw error;
  }
};

/**
 * Handle download progress
 */
const handleProgress = async (downloadId: string, progress: number): Promise<void> => {
  await StorageService.updateDownloadProgress(downloadId, progress);
  progressCallback?.(downloadId, progress);
};

/**
 * Pause a download
 */
export const pauseDownload = async (downloadId: string): Promise<void> => {
  const job = activeDownloads.get(downloadId);

  if (job) {
    try {
      RNFS.stopDownload(job.jobId);

      const download = await StorageService.getDownload(downloadId);
      if (download) {
        download.status = DOWNLOAD_STATUS.PAUSED;
        await StorageService.saveDownload(download);
        statusCallback?.(downloadId, DOWNLOAD_STATUS.PAUSED);
      }

      activeDownloads.delete(downloadId);
    } catch (error) {
      console.error('Error pausing download:', error);
      throw error;
    }
  }
};

/**
 * Resume a download
 */
export const resumeDownload = async (downloadId: string): Promise<void> => {
  const download = await StorageService.getDownload(downloadId);

  if (!download) {
    throw new Error('Download not found');
  }

  if (download.status !== DOWNLOAD_STATUS.PAUSED) {
    throw new Error('Download is not paused');
  }

  // For now, restart the download (full resume would require range requests)
  // TODO: Implement proper resume with range requests
  await retryDownload(downloadId);
};

/**
 * Cancel a download
 */
export const cancelDownload = async (downloadId: string): Promise<void> => {
  const job = activeDownloads.get(downloadId);

  if (job) {
    try {
      RNFS.stopDownload(job.jobId);
      activeDownloads.delete(downloadId);
    } catch (error) {
      console.error('Error stopping download:', error);
    }
  }

  const download = await StorageService.getDownload(downloadId);
  if (download) {
    // Delete partial file
    const exists = await RNFS.exists(download.localPath);
    if (exists) {
      await RNFS.unlink(download.localPath);
    }

    // Update status
    download.status = DOWNLOAD_STATUS.NOT_DOWNLOADED;
    download.progress = 0;
    await StorageService.saveDownload(download);
    await StorageService.removeFromDownloadQueue(downloadId);

    statusCallback?.(downloadId, DOWNLOAD_STATUS.NOT_DOWNLOADED);
  }

  // Process next in queue
  await processQueue();
};

/**
 * Retry a failed download
 */
export const retryDownload = async (downloadId: string): Promise<void> => {
  const download = await StorageService.getDownload(downloadId);

  if (!download) {
    throw new Error('Download not found');
  }

  // Delete partial file if exists
  const exists = await RNFS.exists(download.localPath);
  if (exists) {
    await RNFS.unlink(download.localPath);
  }

  // Reset progress
  download.progress = 0;
  download.status = DOWNLOAD_STATUS.QUEUED;
  await StorageService.saveDownload(download);

  // Add back to queue
  await addToQueue(downloadId);

  // Process queue
  await processQueue();
};

/**
 * Delete a download
 */
export const deleteDownload = async (downloadId: string): Promise<void> => {
  // Cancel if downloading
  if (activeDownloads.has(downloadId)) {
    await cancelDownload(downloadId);
  }

  const download = await StorageService.getDownload(downloadId);
  if (download) {
    // Delete file
    const exists = await RNFS.exists(download.localPath);
    if (exists) {
      await RNFS.unlink(download.localPath);
    }

    // Remove from storage
    await StorageService.deleteDownload(downloadId);
    await StorageService.removeFromDownloadQueue(downloadId);
  }
};

/**
 * Add download to queue
 */
const addToQueue = async (downloadId: string): Promise<void> => {
  await StorageService.addToDownloadQueue(downloadId);

  const download = await StorageService.getDownload(downloadId);
  if (download && download.status !== DOWNLOAD_STATUS.DOWNLOADING) {
    download.status = DOWNLOAD_STATUS.QUEUED;
    await StorageService.saveDownload(download);
    statusCallback?.(downloadId, DOWNLOAD_STATUS.QUEUED);
  }
};

/**
 * Process download queue
 */
export const processQueue = async (): Promise<void> => {
  // Check if already downloading
  if (activeDownloads.size > 0) {
    return;
  }

  // Get queue
  const queue = await StorageService.getDownloadQueue();

  if (queue.length === 0) {
    return;
  }

  // Get first item in queue
  const downloadId = queue[0];
  const download = await StorageService.getDownload(downloadId);

  if (!download) {
    // Remove invalid download from queue
    await StorageService.removeFromDownloadQueue(downloadId);
    await processQueue();
    return;
  }

  // Skip if already completed
  if (download.status === DOWNLOAD_STATUS.COMPLETED) {
    await StorageService.removeFromDownloadQueue(downloadId);
    await processQueue();
    return;
  }

  // Start download (need to get reciter and surah info)
  // This is a limitation - we need to store more metadata or fetch it
  // For now, we'll skip and just remove from queue
  // TODO: Store reciter and surah info in download metadata
  console.log('Queue processing requires reciter/surah info - skipping:', downloadId);
  await StorageService.removeFromDownloadQueue(downloadId);
  await processQueue();
};

/**
 * Get active downloads count
 */
export const getActiveDownloadsCount = (): number => {
  return activeDownloads.size;
};

/**
 * Check if file is downloaded
 */
export const isFileDownloaded = async (
  reciterId: string,
  surahId: number,
): Promise<boolean> => {
  const download = await StorageService.getDownloadByReciterAndSurah(reciterId, surahId);

  if (!download || download.status !== DOWNLOAD_STATUS.COMPLETED) {
    return false;
  }

  // Verify file exists
  return await RNFS.exists(download.localPath);
};

/**
 * Get downloaded file path
 */
export const getDownloadedFilePath = async (
  reciterId: string,
  surahId: number,
): Promise<string | null> => {
  const isDownloaded = await isFileDownloaded(reciterId, surahId);

  if (!isDownloaded) {
    return null;
  }

  return getFilePath(reciterId, surahId);
};

/**
 * Clear all downloads
 */
export const clearAllDownloads = async (): Promise<void> => {
  // Cancel all active downloads
  const activeIds = Array.from(activeDownloads.keys());
  for (const id of activeIds) {
    await cancelDownload(id);
  }

  // Get all downloads
  const downloads = await StorageService.getAllDownloads();

  // Delete all files
  for (const download of downloads) {
    const exists = await RNFS.exists(download.localPath);
    if (exists) {
      await RNFS.unlink(download.localPath);
    }
  }

  // Clear storage
  await StorageService.deleteAllDownloads();
  await StorageService.clearDownloadQueue();
};

/**
 * Get download stats
 */
export const getDownloadStats = async (): Promise<{
  total: number;
  completed: number;
  downloading: number;
  queued: number;
  failed: number;
  totalSize: number;
}> => {
  const downloads = await StorageService.getAllDownloads();

  return {
    total: downloads.length,
    completed: downloads.filter(d => d.status === DOWNLOAD_STATUS.COMPLETED).length,
    downloading: downloads.filter(d => d.status === DOWNLOAD_STATUS.DOWNLOADING).length,
    queued: downloads.filter(d => d.status === DOWNLOAD_STATUS.QUEUED).length,
    failed: downloads.filter(d => d.status === DOWNLOAD_STATUS.FAILED).length,
    totalSize: await StorageService.getTotalDownloadedSize(),
  };
};
