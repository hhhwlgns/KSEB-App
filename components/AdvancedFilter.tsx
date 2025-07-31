import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

export interface FilterOptions {
  status: string[];
  categories: string[];
  locations: string[];
  quantityRange: {
    min: number | null;
    max: number | null;
  };
}

interface AdvancedFilterProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  onReset: () => void;
  initialFilters: FilterOptions;
}

const statusOptions = [
  { value: '정상', label: '정상', color: COLORS.success },
  { value: '부족', label: '부족', color: COLORS.warning },
  { value: '위험', label: '위험', color: COLORS.error },
];

const categoryOptions = [
  '전자기기', '디스플레이', '주변기기', '네트워크', '저장장치'
];

const locationOptions = [
  'A-1-1', 'A-1-2', 'A-2-1', 'B-1-1', 'B-2-1', 'C-1-1', 'C-2-1', 'C-3-5'
];

export default function AdvancedFilter({ 
  visible, 
  onClose, 
  onApply, 
  onReset,
  initialFilters 
}: AdvancedFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const toggleArrayFilter = (key: keyof Pick<FilterOptions, 'status' | 'categories' | 'locations'>, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(item => item !== value)
        : [...prev[key], value]
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      status: [],
      categories: [],
      locations: [],
      quantityRange: { min: null, max: null }
    };
    setFilters(resetFilters);
    onReset();
    onClose();
  };

  const getActiveFiltersCount = () => {
    return filters.status.length + 
           filters.categories.length + 
           filters.locations.length +
           (filters.quantityRange.min !== null || filters.quantityRange.max !== null ? 1 : 0);
  };

  const renderMultiSelect = (
    title: string, 
    options: string[] | typeof statusOptions, 
    selectedValues: string[], 
    onToggle: (value: string) => void
  ) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const label = typeof option === 'string' ? option : option.label;
          const color = typeof option === 'string' ? COLORS.primary : option.color;
          const isSelected = selectedValues.includes(value);
          
          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.optionButton,
                isSelected && { backgroundColor: color + '20', borderColor: color }
              ]}
              onPress={() => onToggle(value)}
            >
              <Text style={[
                styles.optionText,
                isSelected && { color: color, fontWeight: '600' }
              ]}>
                {label}
              </Text>
              {isSelected && (
                <Ionicons name="checkmark" size={16} color={color} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>필터</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>초기화</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderMultiSelect(
            '상태',
            statusOptions,
            filters.status,
            (value) => toggleArrayFilter('status', value)
          )}

          {renderMultiSelect(
            '카테고리',
            categoryOptions,
            filters.categories,
            (value) => toggleArrayFilter('categories', value)
          )}

          {renderMultiSelect(
            '위치',
            locationOptions,
            filters.locations,
            (value) => toggleArrayFilter('locations', value)
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>
              필터 적용 ({getActiveFiltersCount()})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: SIZES.fontLG,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resetText: {
    fontSize: SIZES.fontMD,
    color: COLORS.primary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
  },
  filterSection: {
    marginVertical: SIZES.lg,
  },
  filterTitle: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusMD,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: SIZES.xs,
  },
  optionText: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SIZES.md,
  },
  cancelButton: {
    flex: 1,
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radiusMD,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  applyButton: {
    flex: 2,
    height: SIZES.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radiusMD,
    backgroundColor: COLORS.primary,
  },
  applyButtonText: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: 'white',
  },
});