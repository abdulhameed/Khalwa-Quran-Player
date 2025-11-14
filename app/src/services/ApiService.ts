/**
 * API Service
 * Handles URL building for different Quran audio sources
 */

import {Reciter, Surah, AudioQuality} from '../utils/types';

/**
 * Source URL builders for different platforms
 */

/**
 * EveryAyah.com URL builder
 * Format: https://everyayah.com/data/{reciter_code}/{surah_padded}{ayah_padded}.mp3
 * Note: This is ayah-by-ayah, we'll need to concatenate or use full surah sources
 */
export const buildEveryAyahUrl = (
  reciterCode: string,
  surahNumber: number,
  ayahNumber: number = 1,
): string => {
  const surahPadded = surahNumber.toString().padStart(3, '0');
  const ayahPadded = ayahNumber.toString().padStart(3, '0');
  return `https://everyayah.com/data/${reciterCode}/${surahPadded}${ayahPadded}.mp3`;
};

/**
 * MP3Quran.net URL builder
 * Format: https://server{X}.mp3quran.net/{reciter_code}/{surah_padded}.mp3
 * This provides full surah files
 */
export const buildMp3QuranUrl = (
  reciterCode: string,
  surahNumber: number,
  serverNumber: number = 8,
): string => {
  const surahPadded = surahNumber.toString().padStart(3, '0');
  return `https://server${serverNumber}.mp3quran.net/${reciterCode}/${surahPadded}.mp3`;
};

/**
 * Quran.com URL builder
 * Format: https://verses.quran.com/{reciter_code}/{surah_padded}{ayah_padded}.mp3
 */
export const buildQuranComUrl = (
  reciterCode: string,
  surahNumber: number,
  ayahNumber: number = 1,
): string => {
  const surahPadded = surahNumber.toString().padStart(3, '0');
  const ayahPadded = ayahNumber.toString().padStart(3, '0');
  return `https://verses.quran.com/${reciterCode}/${surahPadded}${ayahPadded}.mp3`;
};

/**
 * QuranicAudio.com URL builder
 * Format: https://download.quranicaudio.com/quran/{reciter_code}/{surah_padded}.mp3
 */
export const buildQuranicAudioUrl = (
  reciterCode: string,
  surahNumber: number,
): string => {
  const surahPadded = surahNumber.toString().padStart(3, '0');
  return `https://download.quranicaudio.com/quran/${reciterCode}/${surahPadded}.mp3`;
};

/**
 * Build audio URL based on reciter's source configuration
 */
export const buildAudioUrl = (
  reciter: Reciter,
  surah: Surah,
  quality: AudioQuality = 'medium',
): string => {
  // Get the first available source for the reciter
  const source = reciter.sources[0];

  if (!source) {
    throw new Error(`No sources available for reciter: ${reciter.nameEnglish}`);
  }

  // For now, use the baseUrl from the source
  // In a real implementation, we'd parse the baseUrl and build the proper URL
  // based on the source type

  switch (source.sourceId) {
    case 'everyayah':
      // Extract reciter code from baseUrl
      // Example: "https://everyayah.com/data/Abdul_Basit_Murattal_192kbps"
      const everyAyahCode = source.baseUrl.split('/').pop() || '';
      return buildEveryAyahUrl(everyAyahCode, surah.id);

    case 'mp3quran':
      // Extract reciter code from baseUrl
      // Example: "https://server8.mp3quran.net/basit"
      const mp3QuranCode = source.baseUrl.split('/').pop() || '';
      const serverMatch = source.baseUrl.match(/server(\d+)/);
      const serverNumber = serverMatch ? parseInt(serverMatch[1], 10) : 8;
      return buildMp3QuranUrl(mp3QuranCode, surah.id, serverNumber);

    case 'quranicaudio':
      // Extract reciter code from baseUrl
      const quranicAudioCode = source.baseUrl.split('/').pop() || '';
      return buildQuranicAudioUrl(quranicAudioCode, surah.id);

    case 'qurancom':
      // Extract reciter code from baseUrl
      const quranComCode = source.baseUrl.split('/').pop() || '';
      return buildQuranComUrl(quranComCode, surah.id);

    default:
      // Fallback: try to construct URL using baseUrl + surah number
      const surahPadded = surah.id.toString().padStart(3, '0');
      return `${source.baseUrl}/${surahPadded}.mp3`;
  }
};

/**
 * Check if a source provides full surah files or per-ayah files
 */
export const isFullSurahSource = (sourceId: string): boolean => {
  // These sources provide complete surah files
  const fullSurahSources = ['mp3quran', 'quranicaudio'];
  return fullSurahSources.includes(sourceId);
};

/**
 * Build URLs for all ayahs in a surah (for per-ayah sources)
 */
export const buildAyahUrls = (
  reciter: Reciter,
  surah: Surah,
): string[] => {
  const source = reciter.sources[0];

  if (!source) {
    throw new Error(`No sources available for reciter: ${reciter.nameEnglish}`);
  }

  const urls: string[] = [];

  switch (source.sourceId) {
    case 'everyayah':
      const everyAyahCode = source.baseUrl.split('/').pop() || '';
      for (let ayah = 1; ayah <= surah.numberOfAyahs; ayah++) {
        urls.push(buildEveryAyahUrl(everyAyahCode, surah.id, ayah));
      }
      break;

    case 'qurancom':
      const quranComCode = source.baseUrl.split('/').pop() || '';
      for (let ayah = 1; ayah <= surah.numberOfAyahs; ayah++) {
        urls.push(buildQuranComUrl(quranComCode, surah.id, ayah));
      }
      break;

    default:
      // For full surah sources, just return a single URL
      urls.push(buildAudioUrl(reciter, surah));
  }

  return urls;
};

/**
 * Validate if a URL is accessible
 */
export const validateAudioUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, {method: 'HEAD'});
    return response.ok;
  } catch (error) {
    console.error('Error validating audio URL:', error);
    return false;
  }
};

/**
 * Get estimated file size for a surah
 * This is approximate based on average bitrate and duration
 */
export const getEstimatedFileSize = (
  duration: number | undefined,
  quality: AudioQuality,
): number => {
  if (!duration) {
    return 0;
  }

  // Bitrate in kbps
  const bitrates = {
    low: 32,
    medium: 64,
    high: 128,
  };

  const bitrate = bitrates[quality];
  // Size in bytes = (bitrate in kbps * 1000 / 8) * duration in seconds
  return (bitrate * 1000 / 8) * duration;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Test connectivity to a source
 */
export const testSourceConnectivity = async (
  sourceBaseUrl: string,
): Promise<boolean> => {
  try {
    // Try to fetch the base URL or a known test file
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(sourceBaseUrl, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Source connectivity test failed:', error);
    return false;
  }
};
