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
