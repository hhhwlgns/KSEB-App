import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import FormSelector from '../components/FormSelector';
import { COLORS, SIZES } from '../constants';
import { createWarehouseTransaction, getProducts, getClients } from '../lib/api';
import { useWarehouseForm } from '../context/WarehouseFormContext';

type WarehouseFormData = {
  type: 'IN' | 'OUT';
  quantity: string;
  notes: string;
  destination: string;
};

export default function WarehouseFormScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { selectedProduct, selectedClient, setFieldValue } = useWarehouseForm();

  useEffect(() => {
    // 화면을 벗어날 때 컨텍스트 상태를 초기화하여 다른 폼에 영향을 주지 않도록 합니다.
    return () => {
      setFieldValue('selectedProduct', null);
      setFieldValue('selectedClient', null);
    };
  }, [setFieldValue]);

  const { data: products, isLoading: isLoadingProducts } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { data: clients, isLoading: isLoadingClients } = useQuery({ queryKey: ['clients'], queryFn: getClients });

  const [formData, setFormData] = useState<WarehouseFormData>({
    type: 'IN',
    quantity: '',
    notes: '',
    destination: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { mutate: saveTransaction, isPending: isSaving } = useMutation({
    mutationFn: createWarehouseTransaction,
    onSuccess: () => {
      toast.success('입출고 요청이 성공적으로 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['warehouseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseCurrent'] });
      navigation.goBack();
    },
    onError: (error) => {
      toast.error(error.message || '입출고 요청 등록 중 오류가 발생했습니다.');
    },
  });

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!selectedProduct) newErrors.product = '품목을 선택해주세요.';
    if (!selectedClient) newErrors.client = '거래처를 선택해주세요.';
    if (!formData.quantity.trim() || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = '올바른 수량을 입력해주세요.';
    }
    if (formData.type === 'OUT' && !formData.destination.trim()) {
      newErrors.destination = '목적지를 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof WarehouseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('입력 정보를 확인해주세요.');
      return;
    }
    const transactionData = {
      type: formData.type,
      productName: selectedProduct!.name,
      category: selectedProduct!.group,
      client: selectedClient!.name,
      quantity: Number(formData.quantity),
      notes: formData.notes,
      location: '',
      destination: formData.type === 'OUT' ? formData.destination : undefined,
    };
    saveTransaction(transactionData);
  };

  if (isLoadingProducts || isLoadingClients) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="입출고 등록" showBack />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>작업 유형 *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'IN' && styles.typeButtonActive]}
                  onPress={() => handleInputChange('type', 'IN')}
                >
                  <Text style={[styles.typeButtonText, formData.type === 'IN' && styles.typeButtonTextActive]}>입고</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'OUT' && styles.typeButtonActive]}
                  onPress={() => handleInputChange('type', 'OUT')}
                >
                  <Text style={[styles.typeButtonText, formData.type === 'OUT' && styles.typeButtonTextActive]}>출고</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FormSelector
              label="품목"
              value={selectedProduct?.name}
              placeholder="품목을 선택하세요"
              onPress={() => navigation.navigate('Selection', { 
                title: '품목 선택', 
                items: products || [], 
                returnKey: 'selectedProduct',
              })}
              required
              error={errors.product}
            />

            <FormSelector
              label="거래처"
              value={selectedClient?.name}
              placeholder="거래처를 선택하세요"
              onPress={() => navigation.navigate('Selection', { 
                title: '거래처 선택', 
                items: clients || [], 
                returnKey: 'selectedClient',
              })}
              required
              error={errors.client}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>수량 *</Text>
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                placeholder="수량을 입력하세요"
                placeholderTextColor={COLORS.textMuted}
                value={formData.quantity}
                onChangeText={(value) => handleInputChange('quantity', value.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
              {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            </View>

            {formData.type === 'OUT' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>목적지 *</Text>
                <TextInput
                  style={[styles.input, errors.destination && styles.inputError]}
                  placeholder="목적지를 입력하세요"
                  placeholderTextColor={COLORS.textMuted}
                  value={formData.destination}
                  onChangeText={(value) => handleInputChange('destination', value)}
                />
                {errors.destination && <Text style={styles.errorText}>{errors.destination}</Text>}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>비고</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="특이사항 (선택사항)"
                placeholderTextColor={COLORS.textMuted}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                multiline
              />
            </View>
          </View>
        </ScrollView>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} disabled={isSaving}>
            <Text style={styles.cancelButtonText}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitButton, isSaving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSaving}>
            <Text style={styles.submitButtonText}>{isSaving ? '요청 중...' : '입출고 요청'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: SIZES.xl },
  form: { padding: SIZES.lg },
  inputContainer: { marginBottom: SIZES.lg },
  label: { fontSize: SIZES.fontSM, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  required: { color: COLORS.error },
  input: { height: SIZES.inputHeight, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMD, paddingHorizontal: SIZES.md, fontSize: SIZES.fontMD, backgroundColor: COLORS.surface, color: COLORS.textPrimary },
  multilineInput: { height: 80, paddingTop: SIZES.md, textAlignVertical: 'top' },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: SIZES.fontXS, color: COLORS.error, marginTop: SIZES.xs },
  typeSelector: { flexDirection: 'row', gap: SIZES.md },
  typeButton: { flex: 1, height: SIZES.inputHeight, borderRadius: SIZES.radiusMD, borderWidth: 1, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  typeButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: COLORS.textSecondary },
  typeButtonTextActive: { color: 'white' },
  footer: { flexDirection: 'row', padding: SIZES.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SIZES.md },
  cancelButton: { flex: 1, height: SIZES.buttonHeight, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMD, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  cancelButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: COLORS.textSecondary },
  submitButton: { flex: 2, height: SIZES.buttonHeight, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMD, justifyContent: 'center', alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: COLORS.textMuted },
  submitButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: 'white' },
});