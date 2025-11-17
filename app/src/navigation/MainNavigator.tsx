import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {COLORS, DIMENSIONS} from '../utils/constants';

// Screens
import HomeScreen from '../screens/HomeScreen';
import RecitersScreen from '../screens/RecitersScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PlayerScreen from '../screens/PlayerScreen';
import {SurahsScreen} from '../screens/SurahsScreen';
import {ReciterDetailScreen} from '../screens/ReciterDetailScreen';
import StorageManagementScreen from '../screens/StorageManagementScreen';

// Components
import MiniPlayer from '../components/MiniPlayer';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.lightGray,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: DIMENSIONS.fontSize.xs,
          fontWeight: '600',
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen
        name="Reciters"
        component={RecitersScreen}
        options={{
          tabBarLabel: 'Reciters',
        }}
      />
      <Tab.Screen
        name="Library"
        component={LibraryScreen}
        options={{
          tabBarLabel: 'Library',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  const [currentRouteName, setCurrentRouteName] = useState<string | undefined>();

  // Show mini player on all screens except Player screen
  const showMiniPlayer = currentRouteName !== 'Player';

  return (
    <View style={styles.container}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          listeners={{
            focus: () => setCurrentRouteName('MainTabs'),
          }}
        />
        <Stack.Screen
          name="ReciterDetail"
          component={ReciterDetailScreen}
          options={{
            headerShown: true,
            headerTitle: 'Reciter Details',
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
          listeners={{
            focus: () => setCurrentRouteName('ReciterDetail'),
          }}
        />
        <Stack.Screen
          name="Surahs"
          component={SurahsScreen}
          options={{
            headerShown: true,
            headerTitle: 'Select Surah',
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
          listeners={{
            focus: () => setCurrentRouteName('Surahs'),
          }}
        />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            headerShown: true,
            headerTitle: 'Now Playing',
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
          listeners={{
            focus: () => setCurrentRouteName('Player'),
          }}
        />
        <Stack.Screen
          name="StorageManagement"
          component={StorageManagementScreen}
          options={{
            headerShown: true,
            headerTitle: 'Storage Management',
            headerStyle: {
              backgroundColor: COLORS.primary,
            },
            headerTintColor: COLORS.white,
            headerTitleStyle: {
              fontWeight: '600',
            },
          }}
          listeners={{
            focus: () => setCurrentRouteName('StorageManagement'),
          }}
        />
      </Stack.Navigator>
      {showMiniPlayer && <MiniPlayer />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
