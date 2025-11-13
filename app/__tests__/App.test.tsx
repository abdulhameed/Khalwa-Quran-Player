/**
 * @format
 */

describe('App Structure Tests', () => {
  test('App component can be imported', () => {
    const App = require('../App').default;
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });

  test('Navigation structure can be imported', () => {
    const MainNavigator = require('../src/navigation/MainNavigator').default;
    expect(MainNavigator).toBeDefined();
  });

  test('All screens can be imported', () => {
    const HomeScreen = require('../src/screens/HomeScreen').default;
    const RecitersScreen = require('../src/screens/RecitersScreen').default;
    const LibraryScreen = require('../src/screens/LibraryScreen').default;
    const SettingsScreen = require('../src/screens/SettingsScreen').default;

    expect(HomeScreen).toBeDefined();
    expect(RecitersScreen).toBeDefined();
    expect(LibraryScreen).toBeDefined();
    expect(SettingsScreen).toBeDefined();
  });

  test('Constants are properly defined', () => {
    const {COLORS, DIMENSIONS} = require('../src/utils/constants');

    expect(COLORS).toBeDefined();
    expect(COLORS.primary).toBe('#006B5E');
    expect(COLORS.secondary).toBe('#F9A825');

    expect(DIMENSIONS).toBeDefined();
    expect(DIMENSIONS.spacing).toBeDefined();
    expect(DIMENSIONS.borderRadius).toBeDefined();
  });

  test('Data files are valid JSON', () => {
    const reciters = require('../src/data/reciters.json');
    const surahs = require('../src/data/surahs.json');

    expect(Array.isArray(reciters)).toBe(true);
    expect(Array.isArray(surahs)).toBe(true);
    expect(reciters.length).toBeGreaterThan(0);
    expect(surahs.length).toBeGreaterThan(0);
  });
});
