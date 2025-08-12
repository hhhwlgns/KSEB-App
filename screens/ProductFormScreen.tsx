import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { toast } from 'sonner-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import { COLORS, SIZES } from '../constants';
import { createItem, updateItem } from '../lib/api';
import { Item } from '../types/item';

type RouteParams = { item?: Item };

export default function ProductFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { item } = (route.params || {}) as RouteParams;
  const isEditMode = !!item;

  const queryClient = useQueryClient();

  const { mutate: saveItem, isPending: isSaving } = useMutation({
    mutationFn: (itemData: Omit<Item, 'itemId' | 'createdAt'>) => 
      isEditMode 
        ? updateItem(item.itemId, itemData) 
        : createItem(itemData),
    onSuccess: () => {
      toast.success(`품목이 성공적으로 ${isEditMode ? '수정' : '등록'}되었습니다`);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      navigation.goBack();
    },
    onError: (error) => {
      toast.error(error.message || `품목 ${isEditMode ? '수정' : '등록'} 중 오류 발생`);
    },
  });

  const [formData, setFormData] = useState({
    itemCode: '',
    itemName: '',
    itemGroup: '',
    spec: '',
    unit: '',
    unitPriceIn: '',
    unitPriceOut: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditMode && item) {
      setFormData({
        itemCode: item.itemCode,
        itemName: item.itemName,
        itemGroup: item.itemGroup || '',
        spec: item.spec || '',
        unit: item.unit || '',
        unitPriceIn: String(item.unitPriceIn || ''),
        unitPriceOut: String(item.unitPriceOut || ''),
      });
    }
  }, [item, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.itemCode.trim()) newErrors.itemCode = '품목코드는 필수입니다.';
    if (!formData.itemName.trim()) newErrors.itemName = '품목명은 필수입니다.';
    if (formData.unitPriceIn.trim() && (isNaN(Number(formData.unitPriceIn)) || Number(formData.unitPriceIn) < 0)) newErrors.unitPriceIn = '올바른 입고단가를 입력해주세요.';
    if (formData.unitPriceOut.trim() && (isNaN(Number(formData.unitPriceOut)) || Number(formData.unitPriceOut) < 0)) newErrors.unitPriceOut = '올바른 출고단가를 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('필수 입력 항목을 확인해주세요.');
      return;
    }
    saveItem({
      ...formData,
      unitPriceIn: Number(formData.unitPriceIn) || 0,
      unitPriceOut: Number(formData.unitPriceOut) || 0,
    });
  };

  const formatPriceInput = (value: string) => value.replace(/[^0-9]/g, '');

  const renderInput = (
    label: string, field: keyof typeof formData, placeholder: string,
    options?: { keyboardType?: 'default' | 'numeric'; multiline?: boolean; maxLength?: number; required?: boolean; }
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{options?.required && <Text style={styles.required}> *</Text>}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError, options?.multiline && styles.multilineInput]}
        value={String(formData[field] || '')}
        onChangeText={(value) => handleInputChange(field, (field === 'unitPriceIn' || field === 'unitPriceOut') ? formatPriceInput(value) : value)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 3 : 1}
        textAlignVertical={options?.multiline ? 'top' : 'center'}
        editable={!isSaving}
      />
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={`품목 ${isEditMode ? '수정' : '등록'}`} showBack />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {renderInput('품목코드', 'itemCode', '예: PRD001', { required: true })}
            {renderInput('품목명', 'itemName', '예: 씽크패드 X1 카본', { required: true })}
            {renderInput('품목그룹', 'itemGroup', '예: 노트북')}
            {renderInput('규격', 'spec', '예: 14인치, i7, 16GB RAM')}
            {renderInput('단위', 'unit', '예: EA')}
            <View style={styles.priceInputContainer}>
              <View style={{flex: 1}}>
                {renderInput('입고단가', 'unitPriceIn', '0', { keyboardType: 'numeric' })}
              </View>
              <View style={{flex: 1}}>
                {renderInput('출고단가', 'unitPriceOut', '0', { keyboardType: 'numeric' })}
              </View>
            </View>
          </View>
        </ScrollView>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, isSaving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSaving}>
            <Text style={styles.submitButtonText}>{isSaving ? '저장 중...' : (isEditMode ? '수정하기' : '등록하기')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  keyboardView: { 
    flex: 1 
  },
  content: { 
    flex: 1 
  },
  form: { 
    padding: SIZES.lg 
  },
  inputContainer: { 
    marginBottom: SIZES.lg 
  },
  label: { 
    fontSize: SIZES.fontSM, 
    fontWeight: '600', 
    color: COLORS.textPrimary, 
    marginBottom: SIZES.sm 
  },
  required: { 
    color: COLORS.error 
  },
  input: { 
    height: SIZES.inputHeight, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: SIZES.radiusMD, 
    paddingHorizontal: SIZES.md, 
    fontSize: SIZES.fontMD, 
    backgroundColor: COLORS.surface, 
    color: COLORS.textPrimary 
  },
  multilineInput: { 
    height: 80, 
    paddingTop: SIZES.md 
  },
  inputError: { 
    borderColor: COLORS.error 
  },
  errorText: { 
    fontSize: SIZES.fontXS, 
    color: COLORS.error, 
    marginTop: SIZES.xs 
  },
  priceInputContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  buttonContainer: { 
    flexDirection: 'row', 
    padding: SIZES.lg, 
    backgroundColor: COLORS.surface, 
    borderTopWidth: 1, 
    borderTopColor: COLORS.border, 
    gap: SIZES.md 
  },
  cancelButton: { 
    flex: 1, 
    height: SIZES.buttonHeight, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: SIZES.radiusMD, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: COLORS.surface 
  },
  cancelButtonText: { 
    fontSize: SIZES.fontMD, 
    fontWeight: '600', 
    color: COLORS.textSecondary 
  },
  submitButton: { 
    flex: 2, 
    height: SIZES.buttonHeight, 
    backgroundColor: COLORS.primary, 
    borderRadius: SIZES.radiusMD, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  submitButtonDisabled: { 
    backgroundColor: COLORS.textMuted 
  },
  submitButtonText: { 
    fontSize: SIZES.fontMD, 
    fontWeight: '600', 
    color: 'white' 
  },
});