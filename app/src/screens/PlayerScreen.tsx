import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TouchableWithoutFeedback,
  GestureResponderEvent,
  PanResponder,
  Animated,
} from 'react-native';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import TrackPlayer, {useProgress, State} from 'react-native-track-player';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, DIMENSIONS} from '../utils/constants';
import {Surah, Reciter} from '../utils/types';
import surahsData from '../data/surahs.json';
import * as AudioService from '../services/AudioService';
import {buildAudioUrl, buildAyahUrls, isFullSurahSource} from '../services/ApiService';
import * as DownloadService from '../services/DownloadService';
import * as PlaybackStateService from '../services/PlaybackStateService';
import * as StorageService from '../services/StorageService';
import {useDownload} from '../contexts/DownloadContext';
import {AUDIO_QUALITY} from '../utils/constants';

type PlayerScreenRouteProp = RouteProp<
  {Player: {surah: Surah; reciter: Reciter}},
  'Player'
>;

export default function PlayerScreen() {
  const route = useRoute<PlayerScreenRouteProp>();
  const {surah: initialSurah, reciter} = route.params;
  const progress = useProgress();
  const downloadContext = useDownload();
  const surahs = surahsData as Surah[];

  const [currentSurah, setCurrentSurah] = useState<Surah>(initialSurah);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const progressBarRef = useRef<View>(null);
  const progressBarWidth = useRef(0);

  // Pan responder for drag-to-seek
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        setIsSeeking(true);
        handleProgressBarSeek(event.nativeEvent.locationX);
      },
      onPanResponderMove: (event) => {
        handleProgressBarSeek(event.nativeEvent.locationX);
      },
      onPanResponderRelease: () => {
        setTimeout(() => setIsSeeking(false), 300);
      },
    })
  ).current;

  useEffect(() => {
    initializePlayer();
    checkFavoriteStatus();
    checkDownloadStatus();

    return () => {
      // Cleanup if needed
    };
  }, [currentSurah.id]);

  // Check download status periodically
  useEffect(() => {
    const downloadStatus = downloadContext.getDownloadStatus(reciter.id, currentSurah.id);
    const progress = downloadContext.getDownloadProgress(reciter.id, currentSurah.id);

    setIsDownloaded(downloadStatus === 'completed');
    setDownloadProgress(progress);
  }, [downloadContext.downloads, downloadContext.downloadProgress, currentSurah.id]);

  useEffect(() => {
    const checkPlaybackState = async () => {
      const state = await TrackPlayer.getPlaybackState();
      setIsPlaying(state.state === State.Playing);
      setIsLoading(state.state === State.Buffering || state.state === State.Connecting);
    };

    checkPlaybackState();
    const interval = setInterval(checkPlaybackState, 500);

    return () => clearInterval(interval);
  }, []);

  // Track playback position periodically
  useEffect(() => {
    const interval = setInterval(async () => {
      if (progress.position > 0 && progress.duration > 0) {
        // Update playback state every 5 seconds
        await PlaybackStateService.savePlaybackState({
          currentReciterId: reciter.id,
          currentSurahId: currentSurah.id,
          currentPosition: progress.position,
          isPlaying,
        });

        // Update position in recently played
        await PlaybackStateService.updateRecentlyPlayedPosition(
          reciter.id,
          currentSurah.id,
          progress.position,
        );
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [progress.position, progress.duration, reciter.id, currentSurah.id, isPlaying]);

  const initializePlayer = async () => {
    try {
      setIsLoading(true);

      // Check if file is downloaded locally
      const localPath = await DownloadService.getDownloadedFilePath(reciter.id, currentSurah.id);

      if (localPath) {
        // Play from local storage (assuming local files are full surah)
        const url = `file://${localPath}`;
        console.log('Playing from local storage:', url);
        await AudioService.playSurah(currentSurah, reciter, url);
      } else {
        // Stream from online source
        const source = reciter.sources[0];

        if (source && isFullSurahSource(source.sourceId)) {
          // Source provides full surah files
          const url = buildAudioUrl(reciter, currentSurah);
          console.log('Streaming full surah URL:', url);
          await AudioService.playSurah(currentSurah, reciter, url);
        } else {
          // Source provides per-ayah files, build playlist
          const urls = buildAyahUrls(reciter, currentSurah);
          console.log(`Streaming ${urls.length} ayahs for full surah`);
          await AudioService.playSurahFull(currentSurah, reciter, urls);
        }
      }

      setIsPlaying(true);

      // Track playback in recently played
      await PlaybackStateService.addToRecentlyPlayed(reciter, currentSurah, 0);

      // Save playback state
      await PlaybackStateService.savePlaybackState({
        currentReciterId: reciter.id,
        currentSurahId: currentSurah.id,
        currentPosition: 0,
        isPlaying: true,
      });
    } catch (error) {
      console.error('Error initializing player:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = async () => {
    if (isPlaying) {
      await AudioService.pause();
      setIsPlaying(false);
    } else {
      await AudioService.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = async (value: number) => {
    await AudioService.seekTo(value);
  };

  const handleProgressBarSeek = (locationX: number) => {
    if (progress.duration === 0 || progressBarWidth.current === 0) return;

    // Calculate seek position, ensuring it's within bounds
    const seekPosition = (locationX / progressBarWidth.current) * progress.duration;
    const clampedPosition = Math.max(0, Math.min(seekPosition, progress.duration));

    handleSeek(clampedPosition);
  };

  const handleProgressBarPress = (event: GestureResponderEvent) => {
    setIsSeeking(true);
    handleProgressBarSeek(event.nativeEvent.locationX);
    setTimeout(() => setIsSeeking(false), 300);
  };

  const handleProgressBarLayout = (event: any) => {
    progressBarWidth.current = event.nativeEvent.layout.width;
  };

  const changeSpeed = async () => {
    const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speeds.length;
    const newSpeed = speeds[nextIndex];

    await AudioService.setPlaybackSpeed(newSpeed);
    setPlaybackSpeed(newSpeed);
  };

  const toggleRepeatMode = async () => {
    const modes: Array<'off' | 'one' | 'all'> = ['off', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const newMode = modes[nextIndex];

    await AudioService.setRepeatMode(newMode);
    setRepeatMode(newMode);
  };

  const toggleShuffle = async () => {
    const newShuffleState = !isShuffleEnabled;
    setIsShuffleEnabled(newShuffleState);
    if (newShuffleState) {
      await AudioService.enableShuffle();
    }
  };

  const handleSkipNext = async () => {
    // Find the next surah
    const currentIndex = surahs.findIndex(s => s.id === currentSurah.id);
    if (currentIndex < surahs.length - 1) {
      const nextSurah = surahs[currentIndex + 1];
      // Update the current surah state (this will trigger re-initialization via useEffect)
      setCurrentSurah(nextSurah);
    } else {
      console.log('Already at the last surah');
    }
  };

  const handleSkipPrevious = async () => {
    // Find the previous surah
    const currentIndex = surahs.findIndex(s => s.id === currentSurah.id);
    if (currentIndex > 0) {
      const previousSurah = surahs[currentIndex - 1];
      // Update the current surah state (this will trigger re-initialization via useEffect)
      setCurrentSurah(previousSurah);
    } else {
      console.log('Already at the first surah');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkFavoriteStatus = async () => {
    const favoriteStatus = await StorageService.isFavorite(reciter.id, currentSurah.id);
    setIsFavorite(favoriteStatus);
  };

  const checkDownloadStatus = async () => {
    const downloaded = await DownloadService.isFileDownloaded(reciter.id, currentSurah.id);
    setIsDownloaded(downloaded);
  };

  const handleToggleFavorite = async () => {
    try {
      const newStatus = await StorageService.toggleFavorite(reciter.id, currentSurah.id);
      setIsFavorite(newStatus);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleDownload = async () => {
    if (isDownloaded) return;

    try {
      // Use user's preferred quality
      const preferences = await StorageService.getUserPreferences();
      await downloadContext.startDownload(reciter, currentSurah, preferences.defaultQuality);
    } catch (error) {
      console.error('Error starting download:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.surahName}>{currentSurah.nameEnglish}</Text>
        <Text style={styles.surahNameArabic}>{currentSurah.nameArabic}</Text>
        <Text style={styles.reciterName}>{reciter.nameEnglish}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleToggleFavorite}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Icon
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={28}
            color={isFavorite ? '#E74C3C' : COLORS.text}
            style={styles.actionButtonIcon}
          />
          <Text style={styles.actionButtonLabel}>
            {isFavorite ? 'Favorited' : 'Favorite'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isDownloaded && styles.actionButtonDisabled]}
          onPress={handleDownload}
          disabled={isDownloaded}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          {isDownloaded ? (
            <>
              <Icon
                name="checkmark-circle"
                size={28}
                color={COLORS.primary}
                style={styles.actionButtonIcon}
              />
              <Text style={styles.actionButtonLabel}>Downloaded</Text>
            </>
          ) : downloadProgress > 0 && downloadProgress < 100 ? (
            <>
              <Icon
                name="download"
                size={28}
                color={COLORS.primary}
                style={styles.actionButtonIcon}
              />
              <Text style={styles.actionButtonLabel}>{Math.round(downloadProgress)}%</Text>
            </>
          ) : (
            <>
              <Icon
                name="download-outline"
                size={28}
                color={COLORS.text}
                style={styles.actionButtonIcon}
              />
              <Text style={styles.actionButtonLabel}>Download</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <View
          ref={progressBarRef}
          style={styles.progressBarContainer}
          onLayout={handleProgressBarLayout}
          {...panResponder.panHandlers}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    progress.duration > 0
                      ? (progress.position / progress.duration) * 100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
          {/* Seek thumb indicator */}
          {progress.duration > 0 && (
            <View
              style={[
                styles.progressThumb,
                {
                  left: `${
                    (progress.position / progress.duration) * 100
                  }%`,
                },
                isSeeking && styles.progressThumbActive,
              ]}
            />
          )}
        </View>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(progress.position)}</Text>
          <Text style={styles.timeText}>{formatTime(progress.duration)}</Text>
        </View>
      </View>

      {/* Playback Mode Controls */}
      <View style={styles.modesContainer}>
        <TouchableOpacity
          style={styles.modeButton}
          onPress={toggleRepeatMode}>
          <Icon
            name={repeatMode === 'one' ? 'repeat-once' : 'repeat'}
            size={24}
            color={repeatMode !== 'off' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.modeLabel, repeatMode !== 'off' && styles.modeLabelActive]}>
            {repeatMode === 'one' ? 'One' : repeatMode === 'all' ? 'All' : 'Off'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={changeSpeed}>
          <Icon
            name="speedometer-outline"
            size={24}
            color={COLORS.textSecondary}
          />
          <Text style={styles.modeLabel}>{playbackSpeed}x</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={toggleShuffle}>
          <Icon
            name="shuffle"
            size={24}
            color={isShuffleEnabled ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.modeLabel, isShuffleEnabled && styles.modeLabelActive]}>
            Shuffle
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSkipPrevious}>
          <Icon name="play-skip-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.white} />
          ) : (
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={36}
              color={COLORS.white}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSkipNext}>
          <Icon name="play-skip-forward" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Surah {currentSurah.id} • {currentSurah.numberOfAyahs} Ayahs
        </Text>
        <Text style={styles.infoText}>
          {currentSurah.revelationPlace}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: DIMENSIONS.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: DIMENSIONS.spacing.xxl,
    marginBottom: DIMENSIONS.spacing.xxl,
  },
  surahName: {
    fontSize: DIMENSIONS.fontSize.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  surahNameArabic: {
    fontSize: DIMENSIONS.fontSize.xxl,
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.md,
  },
  reciterName: {
    fontSize: DIMENSIONS.fontSize.lg,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: DIMENSIONS.spacing.xl,
    marginTop: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    paddingVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
    minWidth: 100,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonIcon: {
    marginBottom: DIMENSIONS.spacing.xs / 2,
  },
  actionButtonLabel: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.text,
    fontWeight: '500',
  },
  progressContainer: {
    marginVertical: DIMENSIONS.spacing.xl,
  },
  progressBarContainer: {
    paddingVertical: DIMENSIONS.spacing.md, // Increase touch area
    marginVertical: -DIMENSIONS.spacing.md,
    position: 'relative',
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: DIMENSIONS.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: DIMENSIONS.borderRadius.sm,
  },
  progressThumb: {
    position: 'absolute',
    top: '50%',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginLeft: -6,
    marginTop: -4,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  progressThumbActive: {
    transform: [{scale: 1.3}],
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 6,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: DIMENSIONS.spacing.sm,
  },
  timeText: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
  },
  modesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginVertical: DIMENSIONS.spacing.lg,
    paddingHorizontal: DIMENSIONS.spacing.xl,
  },
  modeButton: {
    alignItems: 'center',
    padding: DIMENSIONS.spacing.sm,
  },
  modeLabel: {
    fontSize: DIMENSIONS.fontSize.xs,
    color: COLORS.textSecondary,
  },
  modeLabelActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: DIMENSIONS.spacing.xl,
    gap: DIMENSIONS.spacing.xl,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: DIMENSIONS.spacing.xl,
  },
  infoText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.xs,
  },
});
