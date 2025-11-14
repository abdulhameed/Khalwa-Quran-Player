/**
 * StorageService
 * Manages download metadata using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {Download, UserPreferences} from '../utils/types';
import {AUDIO_QUALITY, DOWNLOAD_STATUS} from '../utils/constants';

const STORAGE_KEYS = {
  DOWNLOADS: '@khalwa:downloads',
  PREFERENCES: '@khalwa:preferences',
  DOWNLOAD_QUEUE: '@khalwa:download_queue',
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
