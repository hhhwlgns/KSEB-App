import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { COLORS, SIZES } from '../constants';

interface CustomDropdownProps<T> {
  data: T[];
  value: T | null;
  onSelect: (item: T) => void;
  placeholder: string;
  displayKey: keyof T;
  style?: any;
  disabled?: boolean;
}

function CustomDropdown<T extends Record<string, any>>({
  data,
  value,
  onSelect,
  placeholder,
  displayKey,
  style,
  disabled = false,
}: CustomDropdownProps<T>) {
  const [isVisible, setIsVisible] = useState(false);

  const handleSelect = (item: T) => {
    onSelect(item);
    setIsVisible(false);
  };

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
        <Check size={16} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
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
        <ChevronDown 
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
              <Text style={styles.modalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setIsVisible(false)}>
                <Text style={styles.closeButton}>닫기</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={data}
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