/* eslint-env jest */
/* eslint-disable no-undef */

// Mock React Native's gesture handler
jest.mock('react-native-gesture-handler', () => {
  // eslint-disable-next-line @react-native/no-deep-imports
  const View = require('react-native/Libraries/Components/View/View');
  return {
    GestureHandlerRootView: View,
  };
});

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({children}) => children,
  useSafeAreaInsets: () => ({top: 0, bottom: 0, left: 0, right: 0}),
}));

// Mock @react-navigation/native
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    NavigationContainer: ({children}) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock @react-navigation/bottom-tabs
jest.mock('@react-navigation/bottom-tabs', () => {
  const ReactLib = require('react');
  return {
    createBottomTabNavigator: () => {
      const Navigator = ({children}) =>
        ReactLib.createElement('View', null, children);
      const Screen = ({children}) => children;
      return {Navigator, Screen};
    },
  };
});

// Mock @react-navigation/native-stack
jest.mock('@react-navigation/native-stack', () => ({
  createNativeStackNavigator: () => {
    const ReactLib = require('react');
    return {
      Navigator: ({children}) =>
        ReactLib.createElement('View', null, children),
      Screen: ({children}) => children,
    };
  },
}));

// Mock react-native-track-player
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn(),
    updateOptions: jest.fn(),
    add: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    stop: jest.fn(),
    reset: jest.fn(),
    skipToNext: jest.fn(),
    skipToPrevious: jest.fn(),
    seekTo: jest.fn(),
    setRate: jest.fn(),
    setRepeatMode: jest.fn(),
    getPlaybackState: jest.fn(() => Promise.resolve({state: 'none'})),
    getPosition: jest.fn(() => Promise.resolve(0)),
    getDuration: jest.fn(() => Promise.resolve(0)),
    getActiveTrackIndex: jest.fn(() => Promise.resolve(0)),
    getTrack: jest.fn(() => Promise.resolve(null)),
    getQueue: jest.fn(() => Promise.resolve([])),
    addEventListener: jest.fn(),
    registerPlaybackService: jest.fn(),
  },
  useProgress: () => ({
    position: 0,
    duration: 0,
    buffered: 0,
  }),
  State: {
    None: 'none',
    Ready: 'ready',
    Playing: 'playing',
    Paused: 'paused',
    Stopped: 'stopped',
    Buffering: 'buffering',
    Connecting: 'connecting',
    Ended: 'ended',
  },
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
  Event: {
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteStop: 'remote-stop',
    RemoteNext: 'remote-next',
    RemotePrevious: 'remote-previous',
    RemoteSeek: 'remote-seek',
  },
  AppKilledPlaybackBehavior: {
    ContinuePlayback: 'continue-playback',
    PausePlayback: 'pause-playback',
    StopPlaybackAndRemoveNotification: 'stop-playback-and-remove-notification',
  },
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mock/documents',
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
  stat: jest.fn(() => Promise.resolve({size: '1000000'})),
  downloadFile: jest.fn(() => ({
    jobId: 1,
    promise: Promise.resolve({statusCode: 200}),
  })),
  stopDownload: jest.fn(),
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(() =>
      Promise.resolve({
        type: 'wifi',
        isConnected: true,
      })
    ),
  },
  fetch: jest.fn(() =>
    Promise.resolve({
      type: 'wifi',
      isConnected: true,
    })
  ),
}));
