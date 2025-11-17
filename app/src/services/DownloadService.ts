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

// Maximum concurrent downloads (PRD requires 3-5)
const MAX_CONCURRENT_DOWNLOADS = 5;

// Queue processing flag
let isProcessingQueue = false;

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
  const url = buildAudioUrl(reciter, surah, quality);

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
    // Store metadata for queue processing
    reciterNameEnglish: reciter.nameEnglish,
    reciterNameArabic: reciter.nameArabic,
    surahNameEnglish: surah.nameEnglish,
    surahNameArabic: surah.nameArabic,
    url,
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

  // Check device storage (PRD requirement: warn if download size > available storage)
  const hasSpace = await StorageService.hasEnoughSpace(download.fileSize);
  if (!hasSpace) {
    throw new Error('Insufficient storage space. Please free up some space and try again.');
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
  reciter?: Reciter,
  surah?: Surah,
  quality?: AudioQuality,
): Promise<void> => {
  try {
    // Update status to downloading
    download.status = DOWNLOAD_STATUS.DOWNLOADING;
    download.progress = 0;
    await StorageService.saveDownload(download);
    statusCallback?.(download.id, DOWNLOAD_STATUS.DOWNLOADING);

    // Build audio URL (use stored URL if available, otherwise build it)
    let url = download.url;
    if (!url && reciter && surah && quality) {
      url = buildAudioUrl(reciter, surah, quality);
      // Store the URL for future use
      download.url = url;
      await StorageService.saveDownload(download);
    }

    if (!url) {
      throw new Error('No URL available for download');
    }

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
 * Note: Currently restarts the download from beginning.
 * True resume with HTTP range requests would require server support
 * and more complex implementation with partial file management.
 */
export const resumeDownload = async (downloadId: string): Promise<void> => {
  const download = await StorageService.getDownload(downloadId);

  if (!download) {
    throw new Error('Download not found');
  }

  if (download.status !== DOWNLOAD_STATUS.PAUSED && download.status !== DOWNLOAD_STATUS.FAILED) {
    throw new Error('Download is not paused or failed');
  }

  // Restart the download
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
 * Supports concurrent downloads (up to MAX_CONCURRENT_DOWNLOADS)
 */
export const processQueue = async (): Promise<void> => {
  // Prevent concurrent queue processing
  if (isProcessingQueue) {
    return;
  }

  isProcessingQueue = true;

  try {
    // Check if we've reached max concurrent downloads
    if (activeDownloads.size >= MAX_CONCURRENT_DOWNLOADS) {
      isProcessingQueue = false;
      return;
    }

    // Get queue
    const queue = await StorageService.getDownloadQueue();

    if (queue.length === 0) {
      isProcessingQueue = false;
      return;
    }

    // Check WiFi requirement for all queued downloads
    const preferences = await StorageService.getUserPreferences();
    if (preferences.wifiOnlyDownloads) {
      const isWiFi = await isWiFiConnected();
      if (!isWiFi) {
        // WiFi required but not available - keep items in queue
        console.log('WiFi required for downloads. Waiting for WiFi connection...');
        isProcessingQueue = false;
        return;
      }
    }

    // Process multiple downloads up to MAX_CONCURRENT_DOWNLOADS
    const downloadsToStart = Math.min(
      MAX_CONCURRENT_DOWNLOADS - activeDownloads.size,
      queue.length
    );

    for (let i = 0; i < downloadsToStart; i++) {
      const downloadId = queue[i];
      const download = await StorageService.getDownload(downloadId);

      if (!download) {
        // Remove invalid download from queue
        await StorageService.removeFromDownloadQueue(downloadId);
        continue;
      }

      // Skip if already completed
      if (download.status === DOWNLOAD_STATUS.COMPLETED) {
        await StorageService.removeFromDownloadQueue(downloadId);
        continue;
      }

      // Skip if already downloading
      if (activeDownloads.has(downloadId)) {
        continue;
      }

      // Start download without blocking (fire and forget)
      startDownloadFromQueue(download).catch(error => {
        console.error(`Error starting download ${downloadId} from queue:`, error);
      });
    }
  } catch (error) {
    console.error('Error processing queue:', error);
  } finally {
    isProcessingQueue = false;
  }
};

/**
 * Start a download from the queue
 * This is called by processQueue and doesn't require reciter/surah objects
 */
const startDownloadFromQueue = async (download: Download): Promise<void> => {
  try {
    await startDownload(download);
  } catch (error) {
    console.error(`Failed to start download ${download.id}:`, error);
    throw error;
  }
};

/**
 * Get active downloads count
 */
export const getActiveDownloadsCount = (): number => {
  return activeDownloads.size;
};

/**
 * Initialize download service
 * Should be called on app startup to resume queued downloads
 */
export const initializeDownloadService = async (): Promise<void> => {
  try {
    console.log('Initializing download service...');

    // Process any queued downloads
    await processQueue();

    // Set up WiFi change listener to resume downloads when WiFi becomes available
    NetInfo.addEventListener(state => {
      if (state.type === 'wifi' && state.isConnected) {
        console.log('WiFi connected - processing queue...');
        processQueue().catch(error => {
          console.error('Error processing queue on WiFi connect:', error);
        });
      }
    });

    console.log('Download service initialized');
  } catch (error) {
    console.error('Error initializing download service:', error);
  }
};

/**
 * Get queue length
 */
export const getQueueLength = async (): Promise<number> => {
  const queue = await StorageService.getDownloadQueue();
  return queue.length;
};

/**
 * Queue multiple downloads
 * Creates download records and adds them to queue without starting immediately
 */
export const queueMultipleDownloads = async (
  reciter: Reciter,
  surahs: Surah[],
  quality: AudioQuality,
): Promise<void> => {
  // Calculate total size for all downloads
  let totalSize = 0;
  for (const surah of surahs) {
    const downloadId = `${reciter.id}_${surah.id}_${quality}`;
    const existingDownload = await StorageService.getDownload(downloadId);

    if (!existingDownload || existingDownload.status !== DOWNLOAD_STATUS.COMPLETED) {
      totalSize += getEstimatedFileSize(surah.duration, quality);
    }
  }

  // Check device storage before queuing (PRD requirement)
  if (totalSize > 0) {
    const hasSpace = await StorageService.hasEnoughSpace(totalSize);
    if (!hasSpace) {
      throw new Error(`Insufficient storage space. Need approximately ${(totalSize / (1024 * 1024)).toFixed(1)} MB. Please free up some space and try again.`);
    }
  }

  // Check WiFi requirement
  const preferences = await StorageService.getUserPreferences();
  if (preferences.wifiOnlyDownloads) {
    const isWiFi = await isWiFiConnected();
    if (!isWiFi) {
      console.log('Downloads queued. Will start when WiFi is available.');
    }
  }

  // Create download records and add to queue
  for (const surah of surahs) {
    const downloadId = `${reciter.id}_${surah.id}_${quality}`;

    // Check if download already exists
    let download = await StorageService.getDownload(downloadId);

    if (!download) {
      download = await createDownload(reciter, surah, quality);
    }

    // Skip if already completed
    if (download.status === DOWNLOAD_STATUS.COMPLETED) {
      const fileExists = await RNFS.exists(download.localPath);
      if (fileExists) {
        continue;
      }
    }

    // Add to queue
    await addToQueue(downloadId);
  }

  // Start processing queue
  await processQueue();
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

/**
 * Delete all downloads for a reciter (files and metadata)
 */
export const deleteDownloadsByReciter = async (reciterId: string): Promise<void> => {
  try {
    // Get all downloads for this reciter
    const downloads = await StorageService.getDownloadsByReciter(reciterId);

    // Cancel any active downloads for this reciter
    for (const download of downloads) {
      if (activeDownloads.has(download.id)) {
        await cancelDownload(download.id);
      }
    }

    // Delete all files for this reciter
    for (const download of downloads) {
      const exists = await RNFS.exists(download.localPath);
      if (exists) {
        await RNFS.unlink(download.localPath);
      }

      // Remove from queue if present
      await StorageService.removeFromDownloadQueue(download.id);
    }

    // Delete metadata for all downloads from this reciter
    await StorageService.deleteDownloadsByReciter(reciterId);

    console.log(`Deleted all downloads for reciter: ${reciterId}`);
  } catch (error) {
    console.error('Error deleting downloads by reciter:', error);
    throw error;
  }
};
