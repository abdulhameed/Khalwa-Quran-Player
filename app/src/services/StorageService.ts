/**
 * StorageService
 * Manages download metadata using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import {Download, UserPreferences} from '../utils/types';
import {AUDIO_QUALITY, DOWNLOAD_STATUS} from '../utils/constants';

const STORAGE_KEYS = {
  DOWNLOADS: '@khalwa:downloads',
  PREFERENCES: '@khalwa:preferences',
  DOWNLOAD_QUEUE: '@khalwa:download_queue',
  FAVORITES: '@khalwa:favorites',
};

/**
 * Default user preferences
 */
const DEFAULT_PREFERENCES: UserPreferences = {
  defaultQuality: AUDIO_QUALITY.MEDIUM,
  wifiOnlyDownloads: true,
  autoPlay: false,
  theme: 'auto',
  language: 'ar',
};

/**
 * Get all downloads
 */
export const getAllDownloads = async (): Promise<Download[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting downloads:', error);
    return [];
  }
};

/**
 * Get download by ID
 */
export const getDownload = async (downloadId: string): Promise<Download | null> => {
  try {
    const downloads = await getAllDownloads();
    return downloads.find(d => d.id === downloadId) || null;
  } catch (error) {
    console.error('Error getting download:', error);
    return null;
  }
};

/**
 * Get download by reciter and surah
 */
export const getDownloadByReciterAndSurah = async (
  reciterId: string,
  surahId: number,
): Promise<Download | null> => {
  try {
    const downloads = await getAllDownloads();
    return downloads.find(
      d => d.reciterId === reciterId && d.surahId === surahId
    ) || null;
  } catch (error) {
    console.error('Error getting download by reciter and surah:', error);
    return null;
  }
};

/**
 * Get downloads by reciter
 */
export const getDownloadsByReciter = async (reciterId: string): Promise<Download[]> => {
  try {
    const downloads = await getAllDownloads();
    return downloads.filter(d => d.reciterId === reciterId);
  } catch (error) {
    console.error('Error getting downloads by reciter:', error);
    return [];
  }
};

/**
 * Get downloads by status
 */
export const getDownloadsByStatus = async (status: string): Promise<Download[]> => {
  try {
    const downloads = await getAllDownloads();
    return downloads.filter(d => d.status === status);
  } catch (error) {
    console.error('Error getting downloads by status:', error);
    return [];
  }
};

/**
 * Save download
 */
export const saveDownload = async (download: Download): Promise<void> => {
  try {
    const downloads = await getAllDownloads();
    const index = downloads.findIndex(d => d.id === download.id);

    if (index >= 0) {
      // Update existing download
      downloads[index] = download;
    } else {
      // Add new download
      downloads.push(download);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(downloads));
  } catch (error) {
    console.error('Error saving download:', error);
    throw error;
  }
};

/**
 * Update download progress
 */
export const updateDownloadProgress = async (
  downloadId: string,
  progress: number,
): Promise<void> => {
  try {
    const downloads = await getAllDownloads();
    const index = downloads.findIndex(d => d.id === downloadId);

    if (index >= 0) {
      downloads[index].progress = progress;
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(downloads));
    }
  } catch (error) {
    console.error('Error updating download progress:', error);
  }
};

/**
 * Update download status
 */
export const updateDownloadStatus = async (
  downloadId: string,
  status: string,
): Promise<void> => {
  try {
    const downloads = await getAllDownloads();
    const index = downloads.findIndex(d => d.id === downloadId);

    if (index >= 0) {
      downloads[index].status = status as any;
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(downloads));
    }
  } catch (error) {
    console.error('Error updating download status:', error);
  }
};

/**
 * Delete download
 */
export const deleteDownload = async (downloadId: string): Promise<void> => {
  try {
    const downloads = await getAllDownloads();
    const filtered = downloads.filter(d => d.id !== downloadId);
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting download:', error);
    throw error;
  }
};

/**
 * Delete all downloads
 */
export const deleteAllDownloads = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify([]));
  } catch (error) {
    console.error('Error deleting all downloads:', error);
    throw error;
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return data ? {...DEFAULT_PREFERENCES, ...JSON.parse(data)} : DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error getting preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Save user preferences
 */
export const saveUserPreferences = async (preferences: Partial<UserPreferences>): Promise<void> => {
  try {
    const current = await getUserPreferences();
    const updated = {...current, ...preferences};
    await AsyncStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw error;
  }
};

/**
 * Get download queue
 */
export const getDownloadQueue = async (): Promise<string[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOAD_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting download queue:', error);
    return [];
  }
};

/**
 * Save download queue
 */
export const saveDownloadQueue = async (queue: string[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOAD_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error saving download queue:', error);
    throw error;
  }
};

/**
 * Add to download queue
 */
export const addToDownloadQueue = async (downloadId: string): Promise<void> => {
  try {
    const queue = await getDownloadQueue();
    if (!queue.includes(downloadId)) {
      queue.push(downloadId);
      await saveDownloadQueue(queue);
    }
  } catch (error) {
    console.error('Error adding to download queue:', error);
    throw error;
  }
};

/**
 * Remove from download queue
 */
export const removeFromDownloadQueue = async (downloadId: string): Promise<void> => {
  try {
    const queue = await getDownloadQueue();
    const filtered = queue.filter(id => id !== downloadId);
    await saveDownloadQueue(filtered);
  } catch (error) {
    console.error('Error removing from download queue:', error);
    throw error;
  }
};

/**
 * Clear download queue
 */
export const clearDownloadQueue = async (): Promise<void> => {
  try {
    await saveDownloadQueue([]);
  } catch (error) {
    console.error('Error clearing download queue:', error);
    throw error;
  }
};

/**
 * Get total downloaded size
 */
export const getTotalDownloadedSize = async (): Promise<number> => {
  try {
    const downloads = await getDownloadsByStatus(DOWNLOAD_STATUS.COMPLETED);
    return downloads.reduce((total, download) => total + download.fileSize, 0);
  } catch (error) {
    console.error('Error getting total downloaded size:', error);
    return 0;
  }
};

/**
 * Favorite item type
 */
export interface FavoriteItem {
  reciterId: string;
  surahId: number;
  addedAt: number;
}

/**
 * Get all favorites
 */
export const getFavorites = async (): Promise<FavoriteItem[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
};

/**
 * Check if item is favorited
 */
export const isFavorite = async (reciterId: string, surahId: number): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    return favorites.some(f => f.reciterId === reciterId && f.surahId === surahId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
};

/**
 * Add to favorites
 */
export const addFavorite = async (reciterId: string, surahId: number): Promise<void> => {
  try {
    const favorites = await getFavorites();

    // Check if already favorited
    if (favorites.some(f => f.reciterId === reciterId && f.surahId === surahId)) {
      return;
    }

    favorites.push({
      reciterId,
      surahId,
      addedAt: Date.now(),
    });

    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

/**
 * Remove from favorites
 */
export const removeFavorite = async (reciterId: string, surahId: number): Promise<void> => {
  try {
    const favorites = await getFavorites();
    const filtered = favorites.filter(f => !(f.reciterId === reciterId && f.surahId === surahId));
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

/**
 * Toggle favorite
 */
export const toggleFavorite = async (reciterId: string, surahId: number): Promise<boolean> => {
  try {
    const isCurrentlyFavorite = await isFavorite(reciterId, surahId);

    if (isCurrentlyFavorite) {
      await removeFavorite(reciterId, surahId);
      return false;
    } else {
      await addFavorite(reciterId, surahId);
      return true;
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    throw error;
  }
};

/**
 * Clear all favorites
 */
export const clearFavorites = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing favorites:', error);
    throw error;
  }
};

/**
 * Clear all storage (for testing/debugging)
 */
export const clearAllStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing storage:', error);
    throw error;
  }
};

/**
 * Storage info by reciter
 */
export interface ReciterStorageInfo {
  reciterId: string;
  reciterName: string;
  downloadCount: number;
  totalSize: number;
  downloads: Download[];
}

/**
 * Get storage breakdown by reciter
 */
export const getStorageByReciter = async (): Promise<ReciterStorageInfo[]> => {
  try {
    const downloads = await getDownloadsByStatus(DOWNLOAD_STATUS.COMPLETED);

    // Group by reciter
    const reciterMap = new Map<string, ReciterStorageInfo>();

    for (const download of downloads) {
      const existing = reciterMap.get(download.reciterId);

      if (existing) {
        existing.downloadCount++;
        existing.totalSize += download.fileSize;
        existing.downloads.push(download);
      } else {
        reciterMap.set(download.reciterId, {
          reciterId: download.reciterId,
          reciterName: download.reciterNameEnglish || download.reciterId,
          downloadCount: 1,
          totalSize: download.fileSize,
          downloads: [download],
        });
      }
    }

    // Convert to array and sort by size (largest first)
    return Array.from(reciterMap.values()).sort((a, b) => b.totalSize - a.totalSize);
  } catch (error) {
    console.error('Error getting storage by reciter:', error);
    return [];
  }
};

/**
 * Delete all downloads for a specific reciter
 */
export const deleteDownloadsByReciter = async (reciterId: string): Promise<void> => {
  try {
    const downloads = await getDownloadsByReciter(reciterId);
    const allDownloads = await getAllDownloads();

    // Filter out downloads for this reciter
    const filtered = allDownloads.filter(d => d.reciterId !== reciterId);
    await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting downloads by reciter:', error);
    throw error;
  }
};

/**
 * Device storage info
 */
export interface DeviceStorageInfo {
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
}

/**
 * Get device storage information
 */
export const getDeviceStorageInfo = async (): Promise<DeviceStorageInfo> => {
  try {
    const fsi = await RNFS.getFSInfo();

    return {
      totalSpace: fsi.totalSpace,
      freeSpace: fsi.freeSpace,
      usedSpace: fsi.totalSpace - fsi.freeSpace,
    };
  } catch (error) {
    console.error('Error getting device storage info:', error);
    return {
      totalSpace: 0,
      freeSpace: 0,
      usedSpace: 0,
    };
  }
};

/**
 * Check if device has low storage (< 500 MB)
 */
export const hasLowStorage = async (): Promise<boolean> => {
  try {
    const storageInfo = await getDeviceStorageInfo();
    const lowStorageThreshold = 500 * 1024 * 1024; // 500 MB in bytes
    return storageInfo.freeSpace < lowStorageThreshold;
  } catch (error) {
    console.error('Error checking low storage:', error);
    return false;
  }
};

/**
 * Check if device has enough space for a download
 */
export const hasEnoughSpace = async (requiredSize: number): Promise<boolean> => {
  try {
    const storageInfo = await getDeviceStorageInfo();
    // Add 10% buffer for safety
    const requiredWithBuffer = requiredSize * 1.1;
    return storageInfo.freeSpace >= requiredWithBuffer;
  } catch (error) {
    console.error('Error checking available space:', error);
    return false;
  }
};
