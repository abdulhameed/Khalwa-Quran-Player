import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import TrackPlayer, {useProgress, State, Track, usePlaybackState} from 'react-native-track-player';
import {COLORS, DIMENSIONS} from '../utils/constants';
import * as AudioService from '../services/AudioService';

const {width} = Dimensions.get('window');

export default function MiniPlayer() {
  const navigation = useNavigation();
  const progress = useProgress();
  const playbackState = usePlaybackState();
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const loadCurrentTrack = async () => {
      const track = await TrackPlayer.getActiveTrack();
      setCurrentTrack(track || null);
    };

    loadCurrentTrack();

    // Update track when it changes
    const interval = setInterval(loadCurrentTrack, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (playbackState.state) {
      setIsPlaying(playbackState.state === State.Playing);
    }
  }, [playbackState]);

  const togglePlayPause = async () => {
    if (isPlaying) {
      await AudioService.pause();
    } else {
      await AudioService.play();
    }
  };

  const handlePress = () => {
    if (currentTrack?.reciter && currentTrack?.surah) {
      navigation.navigate('Player' as never, {
        surah: currentTrack.surah,
        reciter: currentTrack.reciter,
      } as never);
    }
  };

  // Don't show if no track is loaded
  if (!currentTrack) {
    return null;
  }

  const progressPercentage = progress.duration > 0
    ? (progress.position / progress.duration) * 100
    : 0;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}>
      {/* Progress bar */}
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBar, {width: `${progressPercentage}%`}]} />
      </View>

      <View style={styles.content}>
        {/* Track info */}
        <View style={styles.trackInfo}>
          <Text style={styles.surahName} numberOfLines={1}>
            {currentTrack.title || 'No track playing'}
          </Text>
          <Text style={styles.reciterName} numberOfLines={1}>
            {currentTrack.artist || ''}
          </Text>
        </View>

        {/* Play/Pause button */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 49, // Above tab bar (tab bar is typically 49px)
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 1000,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: COLORS.lightGray,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DIMENSIONS.spacing.md,
    paddingVertical: DIMENSIONS.spacing.sm,
    height: 60,
  },
  trackInfo: {
    flex: 1,
    marginRight: DIMENSIONS.spacing.md,
  },
  surahName: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  reciterName: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  playButtonText: {
    fontSize: 20,
    color: COLORS.white,
  },
});
