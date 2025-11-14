/**
 * PlaybackStateService
 * Manages playback state persistence and recently played history
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {PlaybackState, Reciter, Surah} from '../utils/types';
import {REPEAT_MODE} from '../utils/constants';

const STORAGE_KEYS = {
  PLAYBACK_STATE: '@khalwa:playback_state',
  RECENTLY_PLAYED: '@khalwa:recently_played',
};

/**
 * Recently played item
 */
export interface RecentlyPlayedItem {
  reciterId: string;
  reciterName: string;
  surahId: number;
  surahName: string;
  playedAt: number;
  position: number; // Last position in seconds
}

/**
 * Default playback state
 */
const DEFAULT_PLAYBACK_STATE: PlaybackState = {
  currentReciterId: null,
  currentSurahId: null,
  currentPosition: 0,
  playbackSpeed: 1.0,
  repeatMode: REPEAT_MODE.OFF,
  shuffleMode: false,
  isPlaying: false,
  lastPlayedAt: 0,
};

/**
 * Get current playback state
 */
export const getPlaybackState = async (): Promise<PlaybackState> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAYBACK_STATE);
    return data ? JSON.parse(data) : DEFAULT_PLAYBACK_STATE;
  } catch (error) {
    console.error('Error getting playback state:', error);
    return DEFAULT_PLAYBACK_STATE;
  }
};

/**
 * Save playback state
 */
export const savePlaybackState = async (state: Partial<PlaybackState>): Promise<void> => {
  try {
    const current = await getPlaybackState();
    const updated = {...current, ...state, lastPlayedAt: Date.now()};
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYBACK_STATE, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving playback state:', error);
    throw error;
  }
};

/**
 * Clear playback state
 */
export const clearPlaybackState = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.PLAYBACK_STATE,
      JSON.stringify(DEFAULT_PLAYBACK_STATE),
    );
  } catch (error) {
    console.error('Error clearing playback state:', error);
    throw error;
  }
};

/**
 * Get recently played items
 */
export const getRecentlyPlayed = async (): Promise<RecentlyPlayedItem[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.RECENTLY_PLAYED);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting recently played:', error);
    return [];
  }
};

/**
 * Add item to recently played
 */
export const addToRecentlyPlayed = async (
  reciter: Reciter,
  surah: Surah,
  position: number = 0,
): Promise<void> => {
  try {
    const recentlyPlayed = await getRecentlyPlayed();

    // Create new item
    const newItem: RecentlyPlayedItem = {
      reciterId: reciter.id,
      reciterName: reciter.nameEnglish,
      surahId: surah.id,
      surahName: surah.nameEnglish,
      playedAt: Date.now(),
      position,
    };

    // Remove existing entry for same reciter/surah combo
    const filtered = recentlyPlayed.filter(
      item => !(item.reciterId === reciter.id && item.surahId === surah.id),
    );

    // Add new item to beginning
    filtered.unshift(newItem);

    // Keep only last 20 items
    const limited = filtered.slice(0, 20);

    await AsyncStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(limited));
  } catch (error) {
    console.error('Error adding to recently played:', error);
    throw error;
  }
};

/**
 * Clear recently played
 */
export const clearRecentlyPlayed = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify([]));
  } catch (error) {
    console.error('Error clearing recently played:', error);
    throw error;
  }
};

/**
 * Update position for recently played item
 */
export const updateRecentlyPlayedPosition = async (
  reciterId: string,
  surahId: number,
  position: number,
): Promise<void> => {
  try {
    const recentlyPlayed = await getRecentlyPlayed();
    const updated = recentlyPlayed.map(item => {
      if (item.reciterId === reciterId && item.surahId === surahId) {
        return {...item, position, playedAt: Date.now()};
      }
      return item;
    });

    await AsyncStorage.setItem(STORAGE_KEYS.RECENTLY_PLAYED, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating recently played position:', error);
    throw error;
  }
};
