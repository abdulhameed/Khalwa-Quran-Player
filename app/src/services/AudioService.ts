/**
 * Audio Service
 * Handles all audio playback using react-native-track-player
 */

import TrackPlayer, {
  Capability,
  Event,
  RepeatMode,
  State,
  Track,
  AppKilledPlaybackBehavior,
} from 'react-native-track-player';
import {Surah, Reciter} from '../utils/types';

/**
 * Initialize the Track Player
 */
export const setupPlayer = async (): Promise<void> => {
  try {
    await TrackPlayer.setupPlayer();

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.ContinuePlayback,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
        Capability.Stop,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
      ],
      progressUpdateEventInterval: 1,
    });

    console.log('Track Player setup complete');
  } catch (error) {
    console.error('Error setting up Track Player:', error);
    throw error;
  }
};

/**
 * Build a track object from Surah and Reciter data
 */
export const buildTrack = (
  surah: Surah,
  reciter: Reciter,
  url: string,
): Track => {
  return {
    url,
    title: surah.nameEnglish,
    artist: reciter.nameEnglish,
    artwork: reciter.photo || undefined,
    duration: surah.duration,
    id: `${reciter.id}-${surah.id}`,
    // Custom metadata
    surahId: surah.id,
    reciterId: reciter.id,
    surahNameArabic: surah.nameArabic,
    reciterNameArabic: reciter.nameArabic,
    // Store full objects for navigation
    surah,
    reciter,
  };
};

/**
 * Play a single track
 */
export const playSurah = async (
  surah: Surah,
  reciter: Reciter,
  url: string,
): Promise<void> => {
  try {
    const track = buildTrack(surah, reciter, url);

    // Reset the queue and add the new track
    await TrackPlayer.reset();
    await TrackPlayer.add(track);
    await TrackPlayer.play();

    console.log(`Playing: ${surah.nameEnglish} by ${reciter.nameEnglish}`);
  } catch (error) {
    console.error('Error playing surah:', error);
    throw error;
  }
};

/**
 * Build a track object for an individual ayah
 */
export const buildAyahTrack = (
  surah: Surah,
  reciter: Reciter,
  url: string,
  ayahNumber: number,
): Track => {
  return {
    url,
    title: `${surah.nameEnglish} - Ayah ${ayahNumber}`,
    artist: reciter.nameEnglish,
    artwork: reciter.photo || undefined,
    id: `${reciter.id}-${surah.id}-${ayahNumber}`,
    // Custom metadata
    surahId: surah.id,
    reciterId: reciter.id,
    surahNameArabic: surah.nameArabic,
    reciterNameArabic: reciter.nameArabic,
    ayahNumber,
  };
};

/**
 * Play full surah by creating a playlist of all ayahs
 */
export const playSurahFull = async (
  surah: Surah,
  reciter: Reciter,
  urls: string[],
): Promise<void> => {
  try {
    // Reset the queue
    await TrackPlayer.reset();

    // Build tracks for all ayahs
    const tracks = urls.map((url, index) =>
      buildAyahTrack(surah, reciter, url, index + 1),
    );

    // Add all tracks to the queue
    await TrackPlayer.add(tracks);

    // Start playing
    await TrackPlayer.play();

    console.log(
      `Playing full surah: ${surah.nameEnglish} by ${reciter.nameEnglish} (${urls.length} ayahs)`,
    );
  } catch (error) {
    console.error('Error playing full surah:', error);
    throw error;
  }
};

/**
 * Play/Resume
 */
export const play = async (): Promise<void> => {
  await TrackPlayer.play();
};

/**
 * Pause
 */
export const pause = async (): Promise<void> => {
  await TrackPlayer.pause();
};

/**
 * Stop
 */
export const stop = async (): Promise<void> => {
  await TrackPlayer.stop();
};

/**
 * Skip to next track
 */
export const skipToNext = async (): Promise<void> => {
  await TrackPlayer.skipToNext();
};

/**
 * Skip to previous track
 */
export const skipToPrevious = async (): Promise<void> => {
  await TrackPlayer.skipToPrevious();
};

/**
 * Seek to position (in seconds)
 */
export const seekTo = async (position: number): Promise<void> => {
  await TrackPlayer.seekTo(position);
};

/**
 * Set playback speed
 */
export const setPlaybackSpeed = async (speed: number): Promise<void> => {
  await TrackPlayer.setRate(speed);
};

/**
 * Set repeat mode
 */
export const setRepeatMode = async (mode: 'off' | 'one' | 'all'): Promise<void> => {
  const repeatMode =
    mode === 'off'
      ? RepeatMode.Off
      : mode === 'one'
      ? RepeatMode.Track
      : RepeatMode.Queue;

  await TrackPlayer.setRepeatMode(repeatMode);
};

/**
 * Get current playback state
 */
export const getPlaybackState = async () => {
  return await TrackPlayer.getPlaybackState();
};

/**
 * Get current track position (in seconds)
 */
export const getPosition = async (): Promise<number> => {
  return await TrackPlayer.getPosition();
};

/**
 * Get current track duration (in seconds)
 */
export const getDuration = async (): Promise<number> => {
  return await TrackPlayer.getDuration();
};

/**
 * Get current track
 */
export const getCurrentTrack = async (): Promise<Track | null> => {
  const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
  if (currentTrackIndex === null || currentTrackIndex === undefined) {
    return null;
  }
  const track = await TrackPlayer.getTrack(currentTrackIndex);
  return track || null;
};

/**
 * Add multiple tracks to queue
 */
export const addToQueue = async (
  tracks: Array<{surah: Surah; reciter: Reciter; url: string}>,
): Promise<void> => {
  const trackObjects = tracks.map(({surah, reciter, url}) =>
    buildTrack(surah, reciter, url),
  );
  await TrackPlayer.add(trackObjects);
};

/**
 * Get the queue
 */
export const getQueue = async (): Promise<Track[]> => {
  return await TrackPlayer.getQueue();
};

/**
 * Clear the queue
 */
export const clearQueue = async (): Promise<void> => {
  await TrackPlayer.reset();
};

/**
 * Enable shuffle
 */
export const enableShuffle = async (): Promise<void> => {
  // Track Player doesn't have built-in shuffle, we'll need to implement it manually
  // by reordering the queue
  const queue = await getQueue();
  const shuffled = [...queue].sort(() => Math.random() - 0.5);
  await TrackPlayer.reset();
  await TrackPlayer.add(shuffled);
};

/**
 * Playback Service Handler
 * This runs in the background
 */
export const PlaybackService = async function () {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () =>
    TrackPlayer.skipToPrevious(),
  );
  TrackPlayer.addEventListener(Event.RemoteSeek, ({position}) =>
    TrackPlayer.seekTo(position),
  );
};
