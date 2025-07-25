import React, { useState } from 'react';
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
import { useMutation, useQueryClient } from '@tanstack/react-query';

import Header from '../components/Header';
import { COLORS, SIZES } from '../constants';
import { createWarehouseTransaction } from '../lib/api';
import { WarehouseItem } from '../types';

type WarehouseFormData = Omit<WarehouseItem, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'quantity' | 'category' | 'location' | 'client'> & {
  quantity: string;
  category: string;
  location: string;
  client: string;
};

interface FormErrors {
  [key: string]: string;
}

export default function WarehouseFormScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { mutate: saveTransaction, isPending: loading } = useMutation({
    mutationFn: createWarehouseTransaction,
    onSuccess: () => {
      toast.success('입출고 요청이 성공적으로 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['warehouseRequests'] });
      queryClient.invalidateQueries({ queryKey: ['warehouseCurrent'] });
      navigation.goBack();
    },
    onError: (error) => {
      console.error('Error creating warehouse transaction:', error);
      toast.error(error.message || '입출고 요청 등록 중 오류가 발생했습니다.');
    },
  });

  const [formData, setFormData] = useState<WarehouseFormData>({
    type: 'IN', // 기본값 '입고'
    productName: '',
    quantity: '',
    notes: '',
    category: '',
    location: '',
    client: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.productName.trim()) {
      newErrors.productName = '품목명은 필수입니다.';
    }
    if (!formData.quantity.trim() || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = '올바른 수량을 입력해주세요.';
    }
    if (formData.type !== 'IN' && formData.type !== 'OUT') {
      newErrors.type = "유형은 'IN' 또는 'OUT' 이어야 합니다.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof WarehouseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('입력 정보를 확인해주세요.');
      return;
    }

    const transactionData = {
      ...formData,
      quantity: Number(formData.quantity),
    };
    saveTransaction(transactionData);
  };

  const renderInput = (
    label: string,
    field: keyof WarehouseFormData,
    placeholder: string,
    options?: {
      keyboardType?: 'default' | 'numeric';
      multiline?: boolean;
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
          options?.multiline && styles.multilineInput,
          errors[field] && styles.inputError,
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={formData[field]}
        onChangeText={(value) => handleInputChange(field, value)}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        editable={!loading}
      />
      {errors[field] && (
        <Text style={styles.errorText}>{errors[field]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="입출고 등록" showBack />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
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

            {renderInput('품목명', 'productName', '예: 노트북 - ThinkPad X1', { required: true })}
            {renderInput('수량', 'quantity', '예: 10', { required: true, keyboardType: 'numeric' })}
            {renderInput('카테고리', 'category', '예: 전자제품')}
            {renderInput('위치', 'location', '예: A구역-01')}
            {renderInput('거래처', 'client', '예: 삼성전자')}
            {renderInput('비고', 'notes', '특이사항 (선택사항)', { multiline: true })}
          </View>
        </ScrollView>

        <View style={styles.footer}>
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
            <Text style={styles.submitButtonText}>
              {loading ? '요청 중...' : '입출고 요청'}
            </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SIZES.xl,
  },
  form: {
    padding: SIZES.lg,
  },
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
    fontSize: SIZES.fontMD,
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
  },
  multilineInput: {
    height: 80,
    paddingTop: SIZES.md,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    fontSize: SIZES.fontXS,
    color: COLORS.error,
    marginTop: SIZES.xs,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  typeButton: {
    flex: 1,
    height: SIZES.inputHeight,
    borderRadius: SIZES.radiusMD,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeButtonTextActive: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    padding: SIZES.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SIZES.md,
  },
  cancelButton: {
    flex: 1,
    height: SIZES.buttonHeight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMD,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  cancelButtonText: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  submitButton: {
    flex: 2,
    height: SIZES.buttonHeight,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusMD,
    justifyContent: 'center',
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
});