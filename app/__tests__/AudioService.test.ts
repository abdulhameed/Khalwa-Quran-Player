/**
 * AudioService Tests
 */

import * as AudioService from '../src/services/AudioService';
import TrackPlayer, {RepeatMode} from 'react-native-track-player';
import {Reciter, Surah} from '../src/utils/types';
import {AUDIO_QUALITY} from '../src/utils/constants';

// Mock TrackPlayer
jest.mock('react-native-track-player', () => ({
  setupPlayer: jest.fn(() => Promise.resolve()),
  updateOptions: jest.fn(() => Promise.resolve()),
  reset: jest.fn(() => Promise.resolve()),
  add: jest.fn(() => Promise.resolve()),
  play: jest.fn(() => Promise.resolve()),
  pause: jest.fn(() => Promise.resolve()),
  stop: jest.fn(() => Promise.resolve()),
  skipToNext: jest.fn(() => Promise.resolve()),
  skipToPrevious: jest.fn(() => Promise.resolve()),
  seekTo: jest.fn(() => Promise.resolve()),
  setRate: jest.fn(() => Promise.resolve()),
  setRepeatMode: jest.fn(() => Promise.resolve()),
  getPlaybackState: jest.fn(() => Promise.resolve({state: 'playing'})),
  getPosition: jest.fn(() => Promise.resolve(0)),
  getDuration: jest.fn(() => Promise.resolve(120)),
  getActiveTrackIndex: jest.fn(() => Promise.resolve(0)),
  getTrack: jest.fn(() => Promise.resolve(null)),
  getQueue: jest.fn(() => Promise.resolve([])),
  addEventListener: jest.fn(),
  Capability: {
    Play: 'play',
    Pause: 'pause',
    SkipToNext: 'skip-to-next',
    SkipToPrevious: 'skip-to-previous',
    SeekTo: 'seek-to',
    Stop: 'stop',
  },
  RepeatMode: {
    Off: 0,
    Track: 1,
    Queue: 2,
  },
  State: {
    None: 'none',
    Playing: 'playing',
    Paused: 'paused',
    Stopped: 'stopped',
  },
  AppKilledPlaybackBehavior: {
    ContinuePlayback: 'continue-playback',
    PausePlayback: 'pause-playback',
    StopPlaybackAndRemoveNotification: 'stop-playback-and-remove-notification',
  },
}));

describe('AudioService', () => {
  const mockReciter: Reciter = {
    id: 'abdul-basit',
    nameArabic: 'عبد الباسط عبد الصمد',
    nameEnglish: 'Abdul Basit',
    photo: 'https://example.com/photo.jpg',
    bio: 'Famous Egyptian reciter',
    style: 'Murattal',
    country: 'Egypt',
    sources: [
      {
        sourceId: 'everyayah',
        sourceName: 'EveryAyah',
        baseUrl: 'https://everyayah.com/data/Abdul_Basit_Murattal_192kbps',
        qualities: [AUDIO_QUALITY.HIGH],
      },
    ],
  };

  const mockSurah: Surah = {
    id: 1,
    nameArabic: 'الفاتحة',
    nameEnglish: 'Al-Fatihah',
    transliteration: 'Al-Fatihah',
    revelationPlace: 'Makkah',
    numberOfAyahs: 7,
    duration: 120,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('setupPlayer', () => {
    it('should setup Track Player with correct options', async () => {
      await AudioService.setupPlayer();

      expect(TrackPlayer.setupPlayer).toHaveBeenCalled();
      expect(TrackPlayer.updateOptions).toHaveBeenCalled();
    });

    it('should handle setup errors gracefully', async () => {
      (TrackPlayer.setupPlayer as jest.Mock).mockRejectedValueOnce(
        new Error('Setup failed')
      );

      await expect(AudioService.setupPlayer()).rejects.toThrow('Setup failed');
    });
  });

  describe('buildTrack', () => {
    it('should build track object with correct properties', () => {
      const url = 'https://example.com/audio.mp3';
      const track = AudioService.buildTrack(mockSurah, mockReciter, url);

      expect(track).toEqual({
        url,
        title: mockSurah.nameEnglish,
        artist: mockReciter.nameEnglish,
        artwork: mockReciter.photo,
        duration: mockSurah.duration,
        id: `${mockReciter.id}-${mockSurah.id}`,
        surahId: mockSurah.id,
        reciterId: mockReciter.id,
        surahNameArabic: mockSurah.nameArabic,
        reciterNameArabic: mockReciter.nameArabic,
      });
    });
  });

  describe('playSurah', () => {
    it('should play a surah with correct track', async () => {
      const url = 'https://example.com/audio.mp3';

      await AudioService.playSurah(mockSurah, mockReciter, url);

      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalled();
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should handle playback errors', async () => {
      const url = 'https://example.com/audio.mp3';
      (TrackPlayer.play as jest.Mock).mockRejectedValueOnce(
        new Error('Playback failed')
      );

      await expect(
        AudioService.playSurah(mockSurah, mockReciter, url)
      ).rejects.toThrow('Playback failed');
    });
  });

  describe('play/pause/stop', () => {
    it('should call TrackPlayer.play', async () => {
      await AudioService.play();
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it('should call TrackPlayer.pause', async () => {
      await AudioService.pause();
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it('should call TrackPlayer.stop', async () => {
      await AudioService.stop();
      expect(TrackPlayer.stop).toHaveBeenCalled();
    });
  });

  describe('skipToNext/skipToPrevious', () => {
    it('should skip to next track', async () => {
      await AudioService.skipToNext();
      expect(TrackPlayer.skipToNext).toHaveBeenCalled();
    });

    it('should skip to previous track', async () => {
      await AudioService.skipToPrevious();
      expect(TrackPlayer.skipToPrevious).toHaveBeenCalled();
    });
  });

  describe('seekTo', () => {
    it('should seek to specified position', async () => {
      const position = 60;
      await AudioService.seekTo(position);
      expect(TrackPlayer.seekTo).toHaveBeenCalledWith(position);
    });
  });

  describe('setPlaybackSpeed', () => {
    it('should set playback speed', async () => {
      const speed = 1.5;
      await AudioService.setPlaybackSpeed(speed);
      expect(TrackPlayer.setRate).toHaveBeenCalledWith(speed);
    });
  });

  describe('setRepeatMode', () => {
    it('should set repeat mode to off', async () => {
      await AudioService.setRepeatMode('off');
      expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Off);
    });

    it('should set repeat mode to one', async () => {
      await AudioService.setRepeatMode('one');
      expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Track);
    });

    it('should set repeat mode to all', async () => {
      await AudioService.setRepeatMode('all');
      expect(TrackPlayer.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Queue);
    });
  });

  describe('getPlaybackState', () => {
    it('should return current playback state', async () => {
      const state = await AudioService.getPlaybackState();
      expect(state).toEqual({state: 'playing'});
      expect(TrackPlayer.getPlaybackState).toHaveBeenCalled();
    });
  });

  describe('getPosition/getDuration', () => {
    it('should get current position', async () => {
      const position = await AudioService.getPosition();
      expect(position).toBe(0);
      expect(TrackPlayer.getPosition).toHaveBeenCalled();
    });

    it('should get current duration', async () => {
      const duration = await AudioService.getDuration();
      expect(duration).toBe(120);
      expect(TrackPlayer.getDuration).toHaveBeenCalled();
    });
  });

  describe('getCurrentTrack', () => {
    it('should return null when no track is active', async () => {
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValue(null);

      const track = await AudioService.getCurrentTrack();
      expect(track).toBeNull();
    });

    it('should return current track when active', async () => {
      const mockTrack = {id: '1', title: 'Test'};
      (TrackPlayer.getActiveTrackIndex as jest.Mock).mockResolvedValue(0);
      (TrackPlayer.getTrack as jest.Mock).mockResolvedValue(mockTrack);

      const track = await AudioService.getCurrentTrack();
      expect(track).toEqual(mockTrack);
    });
  });

  describe('addToQueue', () => {
    it('should add tracks to queue', async () => {
      const tracks = [
        {
          surah: mockSurah,
          reciter: mockReciter,
          url: 'https://example.com/audio1.mp3',
        },
      ];

      await AudioService.addToQueue(tracks);
      expect(TrackPlayer.add).toHaveBeenCalled();
    });
  });

  describe('getQueue', () => {
    it('should return current queue', async () => {
      const queue = await AudioService.getQueue();
      expect(queue).toEqual([]);
      expect(TrackPlayer.getQueue).toHaveBeenCalled();
    });
  });

  describe('clearQueue', () => {
    it('should clear the queue', async () => {
      await AudioService.clearQueue();
      expect(TrackPlayer.reset).toHaveBeenCalled();
    });
  });

  describe('enableShuffle', () => {
    it('should shuffle and reset queue', async () => {
      const mockQueue = [
        {id: '1', title: 'Track 1'},
        {id: '2', title: 'Track 2'},
        {id: '3', title: 'Track 3'},
      ];
      (TrackPlayer.getQueue as jest.Mock).mockResolvedValue(mockQueue);

      await AudioService.enableShuffle();

      expect(TrackPlayer.getQueue).toHaveBeenCalled();
      expect(TrackPlayer.reset).toHaveBeenCalled();
      expect(TrackPlayer.add).toHaveBeenCalled();
    });
  });
});
