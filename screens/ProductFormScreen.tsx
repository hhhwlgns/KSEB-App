import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Header from '../components/Header';
import { COLORS, SIZES } from '../constants';
import { createProduct } from '../lib/api';
import { Product } from '../types';

type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'inPrice' | 'outPrice'> & {
  inPrice: string;
  outPrice: string;
};

interface FormErrors {
  [key: string]: string;
}

export default function ProductFormScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { mutate: saveProduct, isPending: loading } = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      toast.success('품목이 성공적으로 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigation.goBack();
    },
    onError: (error) => {
      console.error('Error creating product:', error);
      toast.error(error.message || '품목 등록 중 오류가 발생했습니다.');
    },
  });

  const [formData, setFormData] = useState<ProductFormData>({
    code: '',
    name: '',
    group: '',
    specification: '',
    barcode: '',
    inPrice: '',
    outPrice: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '품목명은 필수입니다.';
    }
    if (formData.inPrice.trim() && (isNaN(Number(formData.inPrice)) || Number(formData.inPrice) <= 0)) {
      newErrors.inPrice = '올바른 입고단가를 입력해주세요.';
    }
    if (formData.outPrice.trim() && (isNaN(Number(formData.outPrice)) || Number(formData.outPrice) <= 0)) {
      newErrors.outPrice = '올바른 출고단가를 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('입력 정보를 확인해주세요.');
      return;
    }

    const productDataToSubmit = {
      ...formData,
      inPrice: Number(formData.inPrice),
      outPrice: Number(formData.outPrice),
    };
    
    saveProduct(productDataToSubmit);
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatPriceInput = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    return numericValue;
  };

  const renderInput = (
    label: string,
    field: keyof ProductFormData,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'numeric';
      multiline?: boolean;
      maxLength?: number;
      required?: boolean;
    }
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label}
        {options?.required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          errors[field] && styles.inputError,
          options?.multiline && styles.multilineInput,
        ]}
        value={formData[field]}
        onChangeText={(value) => {
          if (field === 'inPrice' || field === 'outPrice') {
            handleInputChange(field, formatPriceInput(value));
          } else {
            handleInputChange(field, value);
          }
        }}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        maxLength={options?.maxLength}
        editable={!loading}
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="품목 등록" subtitle="새로운 품목을 등록하세요" showBack />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {renderInput('품목코드', 'code', 'PRD001')}
            {renderInput('품목명', 'name', '노트북 - ThinkPad X1', { required: true })}
            {renderInput('품목그룹', 'group', '전자제품')}
            {renderInput('규격', 'specification', '14인치, i7, 16GB RAM', { multiline: true })}
            {renderInput('바코드', 'barcode', '1234567890123', { keyboardType: 'numeric', maxLength: 20 })}
            {renderInput('입고단가', 'inPrice', '1200000', { keyboardType: 'numeric' })}
            {renderInput('출고단가', 'outPrice', '1500000', { keyboardType: 'numeric' })}
          </View>

          <View style={styles.pricePreview}>
            <Text style={styles.previewTitle}>가격 미리보기</Text>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>입고단가:</Text>
              <Text style={styles.priceValue}>
                {formData.inPrice ? Number(formData.inPrice).toLocaleString('ko-KR') + '원' : '0원'}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>출고단가:</Text>
              <Text style={styles.priceValue}>
                {formData.outPrice ? Number(formData.outPrice).toLocaleString('ko-KR') + '원' : '0원'}
              </Text>
            </View>
            {formData.inPrice && formData.outPrice && Number(formData.inPrice) > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>수익률:</Text>
                <Text style={[styles.priceValue, styles.profitValue]}>
                  {(((Number(formData.outPrice) - Number(formData.inPrice)) / Number(formData.inPrice)) * 100).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Ionicons name="sync" size={20} color="white" />
                <Text style={styles.submitButtonText}>등록 중...</Text>
              </View>
            ) : (
              <Text style={styles.submitButtonText}>품목 등록</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: SIZES.lg,
  },
  inputContainer: {
    marginBottom: SIZES.lg,
  },
  label: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  required: {
    color: COLORS.error,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMD,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.md,
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: SIZES.fontSM,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  pricePreview: {
    margin: SIZES.lg,
    marginTop: 0,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  priceLabel: {
    fontSize: SIZES.fontMD,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  profitValue: {
    color: COLORS.success,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: SIZES.lg,
    paddingTop: SIZES.md,
    gap: SIZES.md,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.surfaceHover,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMD,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 2,
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radiusMD,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.textMuted,
  },
  submitButtonText: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
});