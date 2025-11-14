import React from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {COLORS, DIMENSIONS} from '../utils/constants';
import recitersData from '../data/reciters.json';
import surahsData from '../data/surahs.json';
import {Reciter, Surah, RootStackParamList} from '../utils/types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function RecitersScreen() {
  const navigation = useNavigation<NavigationProp>();
  const reciters = recitersData as Reciter[];
  const surahs = surahsData as Surah[];

  const handleReciterPress = (reciter: Reciter) => {
    // For now, play the first surah (Al-Fatihah)
    const firstSurah = surahs[0];
    if (firstSurah) {
      navigation.navigate('Player', {reciter, surah: firstSurah});
    }
  };

  const renderReciter = ({item}: {item: Reciter}) => (
    <TouchableOpacity
      style={styles.reciterCard}
      onPress={() => handleReciterPress(item)}
      activeOpacity={0.7}>
      <Text style={styles.reciterName}>{item.nameEnglish}</Text>
      <Text style={styles.reciterNameArabic}>{item.nameArabic}</Text>
      <Text style={styles.reciterStyle}>{item.style}</Text>
      <Text style={styles.reciterCountry}>{item.country}</Text>
      <Text style={styles.tapHint}>Tap to play Al-Fatihah</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reciters</Text>
      <Text style={styles.subtitle}>
        Browse {reciters.length} available reciters
      </Text>
      <FlatList
        data={reciters}
        renderItem={renderReciter}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
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
    marginBottom: DIMENSIONS.spacing.lg,
  },
  listContent: {
    paddingBottom: DIMENSIONS.spacing.lg,
  },
  reciterCard: {
    backgroundColor: COLORS.white,
    padding: DIMENSIONS.spacing.lg,
    marginBottom: DIMENSIONS.spacing.md,
    borderRadius: DIMENSIONS.borderRadius.lg,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reciterName: {
    fontSize: DIMENSIONS.fontSize.xl,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  reciterNameArabic: {
    fontSize: DIMENSIONS.fontSize.lg,
    color: COLORS.primary,
    marginBottom: DIMENSIONS.spacing.sm,
  },
  reciterStyle: {
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.textSecondary,
    marginBottom: DIMENSIONS.spacing.xs,
  },
  reciterCountry: {
    fontSize: DIMENSIONS.fontSize.sm,
    color: COLORS.textLight,
  },
  tapHint: {
    fontSize: DIMENSIONS.fontSize.xs,
    color: COLORS.accent,
    marginTop: DIMENSIONS.spacing.sm,
    fontStyle: 'italic',
  },
});
