import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS, DIMENSIONS} from '../utils/constants';
import {
  getPlaybackState,
  getRecentlyPlayed,
  RecentlyPlayedItem,
} from '../services/PlaybackStateService';
import {PlaybackState} from '../utils/types';
import reciters from '../data/reciters.json';
import surahs from '../data/surahs.json';

type NavigationProp = NativeStackNavigationProp<any>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, []),
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const state = await getPlaybackState();
      const recent = await getRecentlyPlayed();
      setPlaybackState(state);
      setRecentlyPlayed(recent);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueListening = () => {
    if (playbackState?.currentReciterId && playbackState?.currentSurahId) {
      navigation.navigate('Player', {
        reciter: reciters.find(r => r.id === playbackState.currentReciterId),
        surah: surahs.find(s => s.id === playbackState.currentSurahId),
      });
    }
  };

  const handleRecentItemPress = (item: RecentlyPlayedItem) => {
    const reciter = reciters.find(r => r.id === item.reciterId);
    const surah = surahs.find(s => s.id === item.surahId);

    if (reciter && surah) {
      navigation.navigate('Player', {reciter, surah});
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const hasContinueListening =
    playbackState?.currentReciterId &&
    playbackState?.currentSurahId &&
    playbackState.lastPlayedAt > 0;

  const getCurrentReciterName = (): string => {
    if (!playbackState?.currentReciterId) return '';
    const reciter = reciters.find(r => r.id === playbackState.currentReciterId);
    return reciter?.nameEnglish || '';
  };

  const getCurrentSurahName = (): string => {
    if (!playbackState?.currentSurahId) return '';
    const surah = surahs.find(s => s.id === playbackState.currentSurahId);
    return surah?.nameEnglish || '';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Home</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>Your Quranic Journey</Text>

      {/* Continue Listening Section */}
      {hasContinueListening ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Listening</Text>
          <TouchableOpacity
            style={styles.continueCard}
            onPress={handleContinueListening}>
            <View style={styles.continueCardContent}>
              <View style={styles.continueCardText}>
                <Text style={styles.continueCardSurah}>{getCurrentSurahName()}</Text>
                <Text style={styles.continueCardReciter}>
                  {getCurrentReciterName()}
                </Text>
                <Text style={styles.continueCardPosition}>
                  Resume from {formatTime(playbackState.currentPosition)}
                </Text>
              </View>
              <View style={styles.playButton}>
                <Text style={styles.playButtonText}>▶</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${Math.min(100, (playbackState.currentPosition / 600) * 100)}%`},
                ]}
              />
            </View>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Recently Played Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recently Played</Text>
        {recentlyPlayed.length > 0 ? (
          <FlatList
            data={recentlyPlayed.slice(0, 10)}
            scrollEnabled={false}
            keyExtractor={item => `${item.reciterId}-${item.surahId}`}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.recentItem}
                onPress={() => handleRecentItemPress(item)}>
                <View style={styles.recentItemContent}>
                  <View style={styles.recentItemText}>
                    <Text style={styles.recentItemSurah}>{item.surahName}</Text>
                    <Text style={styles.recentItemReciter}>{item.reciterName}</Text>
                  </View>
                  <Text style={styles.recentItemTime}>
                    {formatRelativeTime(item.playedAt)}
                  </Text>
                </View>
                {item.position > 0 && (
                  <Text style={styles.recentItemPosition}>
                    Last at {formatTime(item.position)}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recent plays</Text>
            <Text style={styles.emptySubtext}>
              Start listening to see your history here
            </Text>
          </View>
        )}
      </View>

      {/* Quick Access Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickAccessGrid}>
          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => navigation.navigate('Reciters')}>
            <Text style={styles.quickAccessIcon}>🎙️</Text>
            <Text style={styles.quickAccessText}>Browse Reciters</Text>
            <Text style={styles.quickAccessSubtext}>20 available</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAccessCard}
            onPress={() => navigation.navigate('Library')}>
            <Text style={styles.quickAccessIcon}>📚</Text>
            <Text style={styles.quickAccessText}>My Library</Text>
            <Text style={styles.quickAccessSubtext}>Downloads</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Welcome Message if no activity */}
      {!hasContinueListening && recentlyPlayed.length === 0 && (
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Khalwa Quran Player</Text>
          <Text style={styles.welcomeText}>
            Your personal companion for listening to the Holy Quran
          </Text>
          <Text style={styles.welcomeText}>
            • Choose from 20 renowned reciters{'\n'}
            • Access all 114 surahs{'\n'}
            • Download for offline listening{'\n'}
            • Track your listening progress
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: DIMENSIONS.spacing.lg,
  },
  title: {
    fontSize: DIMENSIONS.fontSize.xxxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  subtitle: {
    fontSize: DIMENSIONS.fontSize.lg,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    fontSize: DIMENSIONS.fontSize.lg,
    color: COLORS.textSecondary,
  },
  section: {
    marginBottom: DIMENSIONS.spacing.xxl,
  },
  sectionTitle: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.md,
  },
  continueCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius.lg,
    padding: DIMENSIONS.spacing.lg,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  continueCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DIMENSIONS.spacing.md,
  },
  continueCardText: {
    flex: 1,
  },
  continueCardSurah: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  continueCardReciter: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  continueCardPosition: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 20,
    color: COLORS.white,
    marginLeft: 3,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  recentItem: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius.md,
    padding: DIMENSIONS.spacing.md,
    marginBottom: DIMENSIONS.spacing.sm,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  recentItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentItemText: {
    flex: 1,
  },
  recentItemSurah: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  recentItemReciter: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
  },
  recentItemTime: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
  },
  recentItemPosition: {
    fontSize: DIMENSIONS.fontSize.xs,
    color: COLORS.primary,
    marginTop: 4,
  },
  emptyState: {
    paddingVertical: DIMENSIONS.spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: DIMENSIONS.fontSize.lg,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: DIMENSIONS.spacing.sm,
  },
  emptySubtext: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    gap: DIMENSIONS.spacing.md,
  },
  quickAccessCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius.lg,
    padding: DIMENSIONS.spacing.lg,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickAccessIcon: {
    fontSize: 40,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  quickAccessText: {
    fontSize: DIMENSIONS.fontSize.md,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  quickAccessSubtext: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  welcomeSection: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: DIMENSIONS.borderRadius.lg,
    padding: DIMENSIONS.spacing.xl,
    marginTop: DIMENSIONS.spacing.lg,
  },
  welcomeTitle: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.md,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: DIMENSIONS.spacing.sm,
  },
});
