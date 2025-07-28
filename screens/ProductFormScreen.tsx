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
import { Ionicons } from '@expo/vector-icons';
import { toast } from 'sonner-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES } from '../constants';
import { getProductById, createProduct, updateProduct } from '../lib/api';
import { Product } from '../types';

type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'inPrice' | 'outPrice'> & {
  inPrice: string;
  outPrice: string;
};
type RouteParams = { productId?: string };

export default function ProductFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { productId } = (route.params || {}) as RouteParams;
  const isEditMode = !!productId;

  const queryClient = useQueryClient();

  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['products', productId],
    queryFn: () => getProductById(productId!),
    enabled: isEditMode,
  });

  const { mutate: saveProduct, isPending: isSaving } = useMutation({
    mutationFn: (productData: Omit<Product, 'id' | 'createdAt'>) => 
      isEditMode 
        ? updateProduct({ ...productData, id: productId }) 
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
    code: '', name: '', group: '', specification: '', barcode: '', inPrice: '', outPrice: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditMode && existingProduct) {
      setFormData({
        ...existingProduct,
        inPrice: String(existingProduct.inPrice),
        outPrice: String(existingProduct.outPrice),
      });
    }
  }, [existingProduct, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = '품목명은 필수입니다.';
    if (formData.inPrice.trim() && (isNaN(Number(formData.inPrice)) || Number(formData.inPrice) < 0)) newErrors.inPrice = '올바른 입고단가를 입력해주세요.';
    if (formData.outPrice.trim() && (isNaN(Number(formData.outPrice)) || Number(formData.outPrice) < 0)) newErrors.outPrice = '올바른 출고단가를 입력해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('입력 정보를 확인해주세요.');
      return;
    }
    saveProduct({
      ...formData,
      inPrice: Number(formData.inPrice),
      outPrice: Number(formData.outPrice),
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
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, (field === 'inPrice' || field === 'outPrice') ? formatPriceInput(value) : value)}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        maxLength={options?.maxLength}
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
              <Text style={styles.priceValue}>{formData.inPrice ? Number(formData.inPrice).toLocaleString('ko-KR') + '원' : '0원'}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>출고단가:</Text>
              <Text style={styles.priceValue}>{formData.outPrice ? Number(formData.outPrice).toLocaleString('ko-KR') + '원' : '0원'}</Text>
            </View>
            {formData.inPrice && formData.outPrice && Number(formData.inPrice) > 0 && (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>수익률:</Text>
                <Text style={[styles.priceValue, styles.profitValue]}>{(((Number(formData.outPrice) - Number(formData.inPrice)) / Number(formData.inPrice)) * 100).toFixed(1)}%</Text>
              </View>
            )}
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
  label: { fontSize: SIZES.fontMD, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  required: { color: COLORS.error },
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMD, paddingHorizontal: SIZES.md, paddingVertical: SIZES.md, fontSize: SIZES.fontMD, color: COLORS.textPrimary },
  inputError: { borderColor: COLORS.error },
  multilineInput: { height: 80, textAlignVertical: 'top' },
  errorText: { fontSize: SIZES.fontSM, color: COLORS.error, marginTop: SIZES.xs },
  pricePreview: { margin: SIZES.lg, marginTop: 0, backgroundColor: COLORS.surface, borderRadius: SIZES.radiusLG, padding: SIZES.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  previewTitle: { fontSize: SIZES.fontLG, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SIZES.md },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.sm },
  priceLabel: { fontSize: SIZES.fontMD, color: COLORS.textSecondary },
  priceValue: { fontSize: SIZES.fontMD, fontWeight: '600', color: COLORS.textPrimary },
  profitValue: { color: COLORS.success },
  buttonContainer: { flexDirection: 'row', padding: SIZES.lg, paddingTop: SIZES.md, gap: SIZES.md, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelButton: { flex: 1, backgroundColor: COLORS.surfaceHover, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, alignItems: 'center' },
  cancelButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: COLORS.textSecondary },
  submitButton: { flex: 2, backgroundColor: COLORS.primary, paddingVertical: SIZES.md, borderRadius: SIZES.radiusMD, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: COLORS.textMuted },
  submitButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: 'white' },
});