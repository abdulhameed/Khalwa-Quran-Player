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
import {useRoute, RouteProp} from '@react-navigation/native';
import TrackPlayer, {useProgress, State} from 'react-native-track-player';
import {COLORS, DIMENSIONS} from '../utils/constants';
import {Surah, Reciter} from '../utils/types';
import * as AudioService from '../services/AudioService';
import {buildAudioUrl, buildAyahUrls, isFullSurahSource} from '../services/ApiService';
import * as DownloadService from '../services/DownloadService';

type PlayerScreenRouteProp = RouteProp<
  {Player: {surah: Surah; reciter: Reciter}},
  'Player'
>;

export default function PlayerScreen() {
  const route = useRoute<PlayerScreenRouteProp>();
  const {surah, reciter} = route.params;
  const progress = useProgress();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);

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

    return () => {
      // Cleanup if needed
    };
  }, []);

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

  const initializePlayer = async () => {
    try {
      setIsLoading(true);

      // Check if file is downloaded locally
      const localPath = await DownloadService.getDownloadedFilePath(reciter.id, surah.id);

      if (localPath) {
        // Play from local storage (assuming local files are full surah)
        const url = `file://${localPath}`;
        console.log('Playing from local storage:', url);
        await AudioService.playSurah(surah, reciter, url);
      } else {
        // Stream from online source
        const source = reciter.sources[0];

        if (source && isFullSurahSource(source.sourceId)) {
          // Source provides full surah files
          const url = buildAudioUrl(reciter, surah);
          console.log('Streaming full surah URL:', url);
          await AudioService.playSurah(surah, reciter, url);
        } else {
          // Source provides per-ayah files, build playlist
          const urls = buildAyahUrls(reciter, surah);
          console.log(`Streaming ${urls.length} ayahs for full surah`);
          await AudioService.playSurahFull(surah, reciter, urls);
        }
      }

      setIsPlaying(true);
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
    try {
      await AudioService.skipToNext();
    } catch (error) {
      console.log('No next track');
    }
  };

  const handleSkipPrevious = async () => {
    try {
      await AudioService.skipToPrevious();
    } catch (error) {
      console.log('No previous track');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'off':
        return '🔁';
      case 'one':
        return '🔂';
      case 'all':
        return '🔁';
      default:
        return '🔁';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.surahName}>{surah.nameEnglish}</Text>
        <Text style={styles.surahNameArabic}>{surah.nameArabic}</Text>
        <Text style={styles.reciterName}>{reciter.nameEnglish}</Text>
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
          <Text style={[styles.modeIcon, repeatMode !== 'off' && styles.modeIconActive]}>
            {getRepeatIcon()}
          </Text>
          <Text style={[styles.modeLabel, repeatMode !== 'off' && styles.modeLabelActive]}>
            {repeatMode === 'one' ? 'One' : repeatMode === 'all' ? 'All' : 'Off'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={changeSpeed}>
          <Text style={styles.modeIcon}>⚡</Text>
          <Text style={styles.modeLabel}>{playbackSpeed}x</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeButton}
          onPress={toggleShuffle}>
          <Text style={[styles.modeIcon, isShuffleEnabled && styles.modeIconActive]}>
            🔀
          </Text>
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
          <Text style={styles.controlIcon}>⏮</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.white} />
          ) : (
            <Text style={styles.playButtonText}>
              {isPlaying ? '⏸' : '▶'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleSkipNext}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Surah {surah.id} • {surah.numberOfAyahs} Ayahs
        </Text>
        <Text style={styles.infoText}>
          {surah.revelationPlace}
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
  modeIcon: {
    fontSize: 24,
    marginBottom: DIMENSIONS.spacing.xs / 2,
    opacity: 0.5,
  },
  modeIconActive: {
    opacity: 1,
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
  controlIcon: {
    fontSize: 24,
    color: COLORS.primary,
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
  playButtonText: {
    fontSize: 32,
    color: COLORS.white,
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
