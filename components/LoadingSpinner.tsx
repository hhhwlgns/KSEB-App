import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SIZES } from '../constants';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  color?: string;
  style?: any;
}

export default function LoadingSpinner({ 
  size = 'large', 
  color = COLORS.primary,
  style 
}: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
});