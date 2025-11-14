/**
 * Khalwa Quran Player
 * Main App Component
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {StatusBar, StyleSheet, View, ActivityIndicator} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import MainNavigator from './src/navigation/MainNavigator';
import {COLORS} from './src/utils/constants';
import {setupPlayer} from './src/services/AudioService';
import {initializeDownloadService} from './src/services/DownloadService';
import {DownloadProvider} from './src/contexts/DownloadContext';

function App() {
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize audio player
        await setupPlayer();

        // Initialize download service (resume queued downloads)
        await initializeDownloadService();

        setIsPlayerReady(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Still allow app to run even if initialization fails
        setIsPlayerReady(true);
      }
    };

    initializeApp();
  }, []);

  if (!isPlayerReady) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <DownloadProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
            <View style={styles.container}>
              <MainNavigator />
            </View>
          </NavigationContainer>
        </DownloadProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

export default App;
