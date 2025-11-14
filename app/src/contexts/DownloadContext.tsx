/**
 * DownloadContext
 * Manages download state, queue, and progress across the app
 */

import React, {createContext, useContext, useState, useEffect, useCallback} from 'react';
import {Download, Reciter, Surah, AudioQuality} from '../utils/types';
import {DOWNLOAD_STATUS} from '../utils/constants';
import * as DownloadService from '../services/DownloadService';
import * as StorageService from '../services/StorageService';

interface DownloadContextType {
  downloads: Download[];
  downloadProgress: Map<string, number>;
  downloadQueue: string[];
  isDownloading: boolean;

  // Download operations
  startDownload: (reciter: Reciter, surah: Surah, quality: AudioQuality) => Promise<void>;
  pauseDownload: (downloadId: string) => Promise<void>;
  resumeDownload: (downloadId: string) => Promise<void>;
  cancelDownload: (downloadId: string) => Promise<void>;
  retryDownload: (downloadId: string) => Promise<void>;
  deleteDownload: (downloadId: string) => Promise<void>;

  // Batch operations
  downloadMultipleSurahs: (reciter: Reciter, surahs: Surah[], quality: AudioQuality) => Promise<void>;
  downloadAllSurahs: (reciter: Reciter, allSurahs: Surah[], quality: AudioQuality) => Promise<void>;

  // Query operations
  getDownloadStatus: (reciterId: string, surahId: number) => string;
  getDownloadProgress: (reciterId: string, surahId: number) => number;
  isFileDownloaded: (reciterId: string, surahId: number) => Promise<boolean>;
  getDownloadedFilePath: (reciterId: string, surahId: number) => Promise<string | null>;

  // Stats
  refreshDownloads: () => Promise<void>;
}

const DownloadContext = createContext<DownloadContextType | undefined>(undefined);

export const DownloadProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Map<string, number>>(new Map());
  const [downloadQueue, setDownloadQueue] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Load downloads on mount
  useEffect(() => {
    loadDownloads();
    loadQueue();
  }, []);

  // Set up callbacks
  useEffect(() => {
    DownloadService.setProgressCallback((downloadId, progress) => {
      setDownloadProgress(prev => {
        const updated = new Map(prev);
        updated.set(downloadId, progress);
        return updated;
      });
    });

    DownloadService.setStatusCallback(async (downloadId, status) => {
      await loadDownloads();

      if (status === DOWNLOAD_STATUS.DOWNLOADING) {
        setIsDownloading(true);
      } else if (status === DOWNLOAD_STATUS.COMPLETED || status === DOWNLOAD_STATUS.FAILED) {
        setIsDownloading(DownloadService.getActiveDownloadsCount() > 0);
      }
    });
  }, []);

  /**
   * Load all downloads from storage
   */
  const loadDownloads = useCallback(async () => {
    try {
      const allDownloads = await StorageService.getAllDownloads();
      setDownloads(allDownloads);

      // Update progress map
      const progressMap = new Map<string, number>();
      allDownloads.forEach(download => {
        if (download.progress !== undefined) {
          progressMap.set(download.id, download.progress);
        }
      });
      setDownloadProgress(progressMap);
    } catch (error) {
      console.error('Error loading downloads:', error);
    }
  }, []);

  /**
   * Load download queue
   */
  const loadQueue = useCallback(async () => {
    try {
      const queue = await StorageService.getDownloadQueue();
      setDownloadQueue(queue);
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }, []);

  /**
   * Refresh downloads
   */
  const refreshDownloads = useCallback(async () => {
    await loadDownloads();
    await loadQueue();
  }, [loadDownloads, loadQueue]);

  /**
   * Start a download
   */
  const startDownload = useCallback(async (
    reciter: Reciter,
    surah: Surah,
    quality: AudioQuality,
  ) => {
    try {
      await DownloadService.downloadFile(reciter, surah, quality);
      await refreshDownloads();
    } catch (error) {
      console.error('Error starting download:', error);
      throw error;
    }
  }, [refreshDownloads]);

  /**
   * Pause a download
   */
  const pauseDownload = useCallback(async (downloadId: string) => {
    try {
      await DownloadService.pauseDownload(downloadId);
      await refreshDownloads();
    } catch (error) {
      console.error('Error pausing download:', error);
      throw error;
    }
  }, [refreshDownloads]);

  /**
   * Resume a download
   */
  const resumeDownload = useCallback(async (downloadId: string) => {
    try {
      await DownloadService.resumeDownload(downloadId);
      await refreshDownloads();
    } catch (error) {
      console.error('Error resuming download:', error);
      throw error;
    }
  }, [refreshDownloads]);

  /**
   * Cancel a download
   */
  const cancelDownload = useCallback(async (downloadId: string) => {
    try {
      await DownloadService.cancelDownload(downloadId);
      await refreshDownloads();
    } catch (error) {
      console.error('Error canceling download:', error);
      throw error;
    }
  }, [refreshDownloads]);

  /**
   * Retry a failed download
   */
  const retryDownload = useCallback(async (downloadId: string) => {
    try {
      await DownloadService.retryDownload(downloadId);
      await refreshDownloads();
    } catch (error) {
      console.error('Error retrying download:', error);
      throw error;
    }
  }, [refreshDownloads]);

  /**
   * Delete a download
   */
  const deleteDownload = useCallback(async (downloadId: string) => {
    try {
      await DownloadService.deleteDownload(downloadId);
      await refreshDownloads();
    } catch (error) {
      console.error('Error deleting download:', error);
      throw error;
    }
  }, [refreshDownloads]);

  /**
   * Download multiple surahs
   */
  const downloadMultipleSurahs = useCallback(async (
    reciter: Reciter,
    surahs: Surah[],
    quality: AudioQuality,
  ) => {
    try {
      for (const surah of surahs) {
        await DownloadService.downloadFile(reciter, surah, quality);
      }
      await refreshDownloads();
    } catch (error) {
      console.error('Error downloading multiple surahs:', error);
      throw error;
    }
  }, [refreshDownloads]);

  /**
   * Download all surahs for a reciter
   */
  const downloadAllSurahs = useCallback(async (
    reciter: Reciter,
    allSurahs: Surah[],
    quality: AudioQuality,
  ) => {
    try {
      for (const surah of allSurahs) {
        await DownloadService.downloadFile(reciter, surah, quality);
      }
      await refreshDownloads();
    } catch (error) {
      console.error('Error downloading all surahs:', error);
      throw error;
    }
  }, [refreshDownloads]);

  /**
   * Get download status for a reciter and surah
   */
  const getDownloadStatus = useCallback((reciterId: string, surahId: number): string => {
    const download = downloads.find(
      d => d.reciterId === reciterId && d.surahId === surahId
    );
    return download?.status || DOWNLOAD_STATUS.NOT_DOWNLOADED;
  }, [downloads]);

  /**
   * Get download progress for a reciter and surah
   */
  const getDownloadProgress = useCallback((reciterId: string, surahId: number): number => {
    const download = downloads.find(
      d => d.reciterId === reciterId && d.surahId === surahId
    );
    if (!download) return 0;
    return downloadProgress.get(download.id) || download.progress || 0;
  }, [downloads, downloadProgress]);

  /**
   * Check if file is downloaded
   */
  const isFileDownloaded = useCallback(async (
    reciterId: string,
    surahId: number,
  ): Promise<boolean> => {
    return await DownloadService.isFileDownloaded(reciterId, surahId);
  }, []);

  /**
   * Get downloaded file path
   */
  const getDownloadedFilePath = useCallback(async (
    reciterId: string,
    surahId: number,
  ): Promise<string | null> => {
    return await DownloadService.getDownloadedFilePath(reciterId, surahId);
  }, []);

  const value: DownloadContextType = {
    downloads,
    downloadProgress,
    downloadQueue,
    isDownloading,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    deleteDownload,
    downloadMultipleSurahs,
    downloadAllSurahs,
    getDownloadStatus,
    getDownloadProgress,
    isFileDownloaded,
    getDownloadedFilePath,
    refreshDownloads,
  };

  return (
    <DownloadContext.Provider value={value}>
      {children}
    </DownloadContext.Provider>
  );
};

/**
 * Hook to use download context
 */
export const useDownload = (): DownloadContextType => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
};
