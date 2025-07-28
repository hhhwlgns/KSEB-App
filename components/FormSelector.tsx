import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

interface FormSelectorProps {
  label: string;
  value: string | null | undefined;
  placeholder: string;
  onPress: () => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function FormSelector({ label, value, placeholder, onPress, error, required, disabled }: FormSelectorProps) {
  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TouchableOpacity 
        style={[styles.input, error && styles.inputError, disabled && styles.disabled]} 
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[styles.inputText, !value && styles.placeholderText]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    height: SIZES.inputHeight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMD,
    paddingHorizontal: SIZES.md,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputText: {
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textMuted,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: SIZES.fontXS,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  disabled: {
    backgroundColor: COLORS.surfaceHover,
  }
});