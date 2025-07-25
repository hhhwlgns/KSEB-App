import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: () => void;
  collapsible?: boolean;
  style?: any;
}

export default function SearchBar({
  placeholder = '검색어를 입력하세요',
  value,
  onChangeText,
  onSubmit,
  collapsible = false,
  style,
}: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsible);
  const animatedWidth = useState(new Animated.Value(collapsible ? 44 : 300))[0];

  const toggleSearch = () => {
    if (collapsible) {
      const toValue = isExpanded ? 44 : 300;
      
      Animated.timing(animatedWidth, {
        toValue,
        duration: 300,
        useNativeDriver: false,
      }).start();
      
      setIsExpanded(!isExpanded);
      
      if (isExpanded && value) {
        onChangeText('');
      }
    }
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        collapsible && { width: animatedWidth },
        style,
      ]}
    >
      {(!collapsible || isExpanded) && (
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
          autoFocus={collapsible && isExpanded}
        />
      )}
      
      <TouchableOpacity
        style={styles.searchButton}
        onPress={collapsible ? toggleSearch : onSubmit}
      >
        <Ionicons
          name={isExpanded && collapsible && value ? 'close' : 'search'}
          size={20}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMD,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.md,
    height: 44,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
    paddingVertical: 0,
  },
  searchButton: {
    padding: SIZES.xs,
    marginLeft: SIZES.xs,
  },
});