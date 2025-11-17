/**
 * SearchInput Component
 * Reusable search input with icon and clear button
 */

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {COLORS, DIMENSIONS} from '../utils/constants';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  autoFocus = false,
}) => {
  const handleClear = () => {
    onChangeText('');
  };

  return (
    <View style={styles.container}>
      <Icon name="search-outline" size={20} color={COLORS.textLight} style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textLight}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Icon name="close-circle" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundAlt,
    borderRadius: DIMENSIONS.borderRadius.lg,
    marginHorizontal: DIMENSIONS.spacing.md,
    marginVertical: DIMENSIONS.spacing.sm,
    paddingHorizontal: DIMENSIONS.spacing.md,
    height: 48,
    shadowColor: COLORS.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: DIMENSIONS.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: DIMENSIONS.fontSize.md,
    color: COLORS.text,
    padding: 0,
    ...Platform.select({
      ios: {
        paddingVertical: 0,
      },
    }),
  },
  clearButton: {
    padding: DIMENSIONS.spacing.xs,
    marginLeft: DIMENSIONS.spacing.xs,
  },
});
