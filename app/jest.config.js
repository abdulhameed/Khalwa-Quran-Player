module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@react-native-community|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-fs|react-native-track-player)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
