import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

interface CustomDropdownProps<T> {
  data: T[];
  value: T | null;
  onSelect: (item: T) => void;
  placeholder: string;
  displayKey: keyof T;
  label?: string;
  style?: any;
  disabled?: boolean;
  searchable?: boolean;
}

function CustomDropdown<T extends Record<string, any>>({
  data,
  value,
  onSelect,
  placeholder,
  displayKey,
  label,
  style,
  disabled = false,
  searchable = false,
}: CustomDropdownProps<T>) {
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsVisible(false);
    setSearchQuery('');
  };

  const filteredData = searchable && searchQuery
    ? data.filter(item => 
        String(item[displayKey]).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : data;

  const renderItem = ({ item }: { item: T }) => (
    <TouchableOpacity 
      style={[
        styles.dropdownItem,
        value && value[displayKey] === item[displayKey] && styles.selectedItem
      ]}
      onPress={() => handleSelect(item)}
    >
      <Text style={[
        styles.dropdownItemText,
        value && value[displayKey] === item[displayKey] && styles.selectedItemText
      ]}>
        {item[displayKey]}
      </Text>
      {value && value[displayKey] === item[displayKey] && (
        <Ionicons name="checkmark" size={16} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.dropdown,
          disabled && styles.disabledDropdown
        ]}
        onPress={() => !disabled && setIsVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.dropdownText,
          !value && styles.placeholderText,
          disabled && styles.disabledText
        ]}>
          {value ? value[displayKey] : placeholder}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={20} 
          color={disabled ? COLORS.textMuted : COLORS.textSecondary} 
        />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || placeholder}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.closeButton}>닫기</Text>
              </TouchableOpacity>
            </View>
            
            {searchable && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="검색..."
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholderTextColor={COLORS.textMuted}
                />
                <Ionicons name="search" size={16} color={COLORS.textMuted} />
              </View>
            )}
            
            <FlatList
              data={filteredData}
              keyExtractor={(item, index) => `${item[displayKey]}-${index}`}
              renderItem={renderItem}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.sm,
  },
  label: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMD,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: SIZES.inputHeight,
  },
  disabledDropdown: {
    backgroundColor: COLORS.surfaceHover,
    borderColor: COLORS.borderLight,
  },
  dropdownText: {
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
    flex: 1,
  },
  placeholderText: {
    color: COLORS.textMuted,
  },
  disabledText: {
    color: COLORS.textMuted,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.md,
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    width: '90%',
    maxHeight: '70%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: SIZES.fontLG,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closeButton: {
    fontSize: SIZES.fontMD,
    color: COLORS.primary,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
    paddingVertical: SIZES.xs,
    paddingRight: SIZES.sm,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  selectedItem: {
    backgroundColor: COLORS.primaryDark + '10',
  },
  dropdownItemText: {
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
    flex: 1,
  },
  selectedItemText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default CustomDropdown;