/**
 * TypeScript type definitions for the application
 */

import {AUDIO_QUALITY, REPEAT_MODE, DOWNLOAD_STATUS} from './constants';

/**
 * Reciter type definition
 */
export interface Reciter {
  id: string;
  nameArabic: string;
  nameEnglish: string;
  photo: string;
  bio: string;
  style: string;
  country: string;
  sources: ReciterSource[];
}

/**
 * Reciter source definition
 */
export interface ReciterSource {
  sourceId: string;
  sourceName: string;
  baseUrl: string;
  qualities: AudioQuality[];
}

/**
 * Surah type definition
 */
export interface Surah {
  id: number;
  nameArabic: string;
  nameEnglish: string;
  transliteration: string;
  revelationPlace: 'Makkah' | 'Madinah';
  numberOfAyahs: number;
  duration?: number; // Optional, may vary by reciter
}

/**
 * Juz Surah definition (for surahs within a Juz)
 */
export interface JuzSurah {
  surahId: number;
  isComplete: boolean;
  startAyah?: number; // For partial surahs
  endAyah?: number; // For partial surahs
}

/**
 * Juz type definition
 */
export interface Juz {
  id: number; // 1-30
  nameArabic: string;
  nameEnglish: string;
  surahs: JuzSurah[];
}

/**
 * Download type definition
 */
export interface Download {
  id: string;
  reciterId: string;
  surahId: number;
  sourceId: string;
  quality: AudioQuality;
  fileSize: number;
  localPath: string;
  downloadedAt: number;
  status: DownloadStatus;
  progress?: number; // 0-100
  // Metadata for queue processing
  reciterNameEnglish?: string;
  reciterNameArabic?: string;
  surahNameEnglish?: string;
  surahNameArabic?: string;
  url?: string; // Audio URL for download
}

/**
 * Playback state definition
 */
export interface PlaybackState {
  currentReciterId: string | null;
  currentSurahId: number | null;
  currentPosition: number; // in seconds
  playbackSpeed: number;
  repeatMode: RepeatMode;
  shuffleMode: boolean;
  isPlaying: boolean;
  lastPlayedAt: number;
}

/**
 * User preferences definition
 */
export interface UserPreferences {
  defaultQuality: AudioQuality;
  wifiOnlyDownloads: boolean;
  autoPlay: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

/**
 * Audio quality types
 */
export type AudioQuality =
  (typeof AUDIO_QUALITY)[keyof typeof AUDIO_QUALITY];

/**
 * Repeat mode types
 */
export type RepeatMode = (typeof REPEAT_MODE)[keyof typeof REPEAT_MODE];

/**
 * Download status types
 */
export type DownloadStatus =
  (typeof DOWNLOAD_STATUS)[keyof typeof DOWNLOAD_STATUS];

/**
 * Navigation param list for type-safe navigation
 */
export type RootStackParamList = {
  Home: undefined;
  Reciters: undefined;
  Library: undefined;
  Settings: undefined;
  ReciterDetail: {reciter: Reciter};
  Surahs: {reciter: Reciter};
  Player: {reciter: Reciter; surah: Surah};
};
