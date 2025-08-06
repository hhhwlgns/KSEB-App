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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES } from '../constants';
import { getProductById, createProduct, updateProduct } from '../lib/api';
import { Product } from '../types';

type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'inboundPrice' | 'outboundPrice'> & {
  inboundPrice: string;
  outboundPrice: string;
};
type RouteParams = { product?: Product };

export default function ProductFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { product } = (route.params || {}) as RouteParams;
  const isEditMode = !!product;

  const queryClient = useQueryClient();

  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['products', product?.id],
    queryFn: () => getProductById(product!.id),
    enabled: isEditMode,
  });

  const { mutate: saveProduct, isPending: isSaving } = useMutation({
    mutationFn: (productData: Omit<Product, 'id' | 'createdAt'>) => 
      isEditMode 
        ? updateProduct({ ...productData, id: product.id }) 
        : createProduct(productData),
    onSuccess: () => {
      toast.success(`품목이 성공적으로 ${isEditMode ? '수정' : '등록'}되었습니다`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigation.goBack();
    },
    onError: (error) => {
      toast.error(error.message || `품목 ${isEditMode ? '수정' : '등록'} 중 오류 발생`);
    },
  });

  const [formData, setFormData] = useState<ProductFormData>({
    code: '', name: '', group: '', spec: '', inboundPrice: '', outboundPrice: '', notes: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditMode && product) {
      setFormData({
        ...product,
        inboundPrice: String(product.inboundPrice || ''),
        outboundPrice: String(product.outboundPrice || ''),
        notes: product.notes || '',
      });
    }
  }, [product, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.code.trim()) newErrors.code = '품목코드는 필수입니다.';
    if (!formData.name.trim()) newErrors.name = '품목명은 필수입니다.';
    if (formData.inboundPrice.trim() && (isNaN(Number(formData.inboundPrice)) || Number(formData.inboundPrice) < 0)) newErrors.inboundPrice = '올바른 입고단가를 입력해주세요.';
    if (formData.outboundPrice.trim() && (isNaN(Number(formData.outboundPrice)) || Number(formData.outboundPrice) < 0)) newErrors.outboundPrice = '올바른 출고단가를 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('필수 입력 항목을 확인해주세요.');
      return;
    }
    saveProduct({
      ...formData,
      inboundPrice: Number(formData.inboundPrice) || 0,
      outboundPrice: Number(formData.outboundPrice) || 0,
    });
  };

  const formatPriceInput = (value: string) => value.replace(/[^0-9]/g, '');

  if (isLoadingProduct) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="품목 정보 로딩 중..." showBack />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const renderInput = (
    label: string, field: keyof ProductFormData, placeholder: string,
    options?: { keyboardType?: 'default' | 'numeric'; multiline?: boolean; maxLength?: number; required?: boolean; }
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}{options?.required && <Text style={styles.required}> *</Text>}</Text>
      <TextInput
        style={[styles.input, errors[field] && styles.inputError, options?.multiline && styles.multilineInput]}
        value={String(formData[field] || '')}
        onChangeText={(value) => handleInputChange(field, (field === 'inboundPrice' || field === 'outboundPrice') ? formatPriceInput(value) : value)}
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
            {renderInput('품목코드', 'code', '예: PRD001', { required: true })}
            {renderInput('품목명', 'name', '예: 씽크패드 X1 카본', { required: true })}
            {renderInput('품목그룹', 'group', '예: 노트북')}
            {renderInput('규격', 'spec', '예: 14인치, i7, 16GB RAM')}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>바코드</Text>
              <View style={styles.barcodeContainer}>
                <TextInput
                  style={[styles.input, styles.barcodeInput, errors.barcode && styles.inputError]}
                  value={String(formData.barcode || '')}
                  onChangeText={(value) => handleInputChange('barcode', value.replace(/[^0-9]/g, ''))}
                  placeholder="예: 1234567890123"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="numeric"
                  maxLength={20}
                  editable={!isSaving}
                />
                <TouchableOpacity
                  style={styles.scanButton}
                  onPress={() => navigation.navigate('BarcodeScreen' as never, { 
                    title: '바코드 스캔',
                    onScanComplete: (data: string) => {
                      handleInputChange('barcode', data);
                      toast.success('바코드가 입력되었습니다');
                    }
                  } as never)}
                >
                  <Ionicons name="scan" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {errors.barcode && <Text style={styles.errorText}>{errors.barcode}</Text>}
            </View>
            <View style={styles.priceInputContainer}>
              <View style={{flex: 1}}>
                {renderInput('입고단가', 'inboundPrice', '0', { keyboardType: 'numeric' })}
              </View>
              <View style={{flex: 1}}>
                {renderInput('출고단가', 'outboundPrice', '0', { keyboardType: 'numeric' })}
              </View>
            </View>
            {renderInput('비고', 'notes', '제품 관련 비고사항을 입력하세요.', { multiline: true })}
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
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  content: { flex: 1 },
  form: { padding: SIZES.lg },
  inputContainer: { marginBottom: SIZES.lg },
  label: { fontSize: SIZES.fontSM, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  required: { color: COLORS.error },
  input: { backgroundColor: COLORS.surface, height: SIZES.inputHeight, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMD, paddingHorizontal: SIZES.md, fontSize: SIZES.fontMD, color: COLORS.textPrimary },
  inputError: { borderColor: COLORS.error },
  multilineInput: { height: 80, textAlignVertical: 'top', paddingTop: SIZES.md },
  errorText: { fontSize: SIZES.fontXS, color: COLORS.error, marginTop: SIZES.xs },
  barcodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  barcodeInput: {
    flex: 1,
  },
  scanButton: {
    width: 44,
    height: SIZES.inputHeight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMD,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  priceInputContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  buttonContainer: { flexDirection: 'row', padding: SIZES.lg, paddingTop: SIZES.md, gap: SIZES.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelButton: { flex: 1, height: SIZES.buttonHeight, backgroundColor: COLORS.surfaceHover, justifyContent: 'center', alignItems: 'center', borderRadius: SIZES.radiusMD, borderWidth: 1, borderColor: COLORS.border },
  cancelButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: COLORS.textSecondary },
  submitButton: { flex: 2, height: SIZES.buttonHeight, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', borderRadius: SIZES.radiusMD },
  submitButtonDisabled: { backgroundColor: COLORS.textMuted },
  submitButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: 'white' },
});