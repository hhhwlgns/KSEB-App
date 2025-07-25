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
import { createClient } from '../lib/api';
import { Client } from '../types';

type ClientFormData = Omit<Client, 'id' | 'createdAt'>;

interface FormErrors {
  [key: string]: string;
}

export default function ClientFormScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { mutate: saveClient, isPending: loading } = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      toast.success('거래처가 성공적으로 등록되었습니다');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigation.goBack();
    },
    onError: (error) => {
      console.error('Failed to create client:', error);
      toast.error(error.message || '거래처 등록 중 오류가 발생했습니다.');
    },
  });

  const [formData, setFormData] = useState<ClientFormData>({
    code: '',
    name: '',
    representative: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '거래처명은 필수입니다.';
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('입력 내용을 확인해주세요.');
      return;
    }
    saveClient(formData);
  };

  const formFields = [
    {
      key: 'code' as keyof ClientFormData,
      label: '거래처 코드',
      placeholder: '거래처 코드를 입력하세요',
      required: false,
      autoCapitalize: 'characters' as const,
    },
    {
      key: 'name' as keyof ClientFormData,
      label: '거래처명',
      placeholder: '거래처명을 입력하세요',
      required: true,
    },
    {
      key: 'representative' as keyof ClientFormData,
      label: '대표자명',
      placeholder: '대표자명을 입력하세요',
      required: false,
    },
    {
      key: 'phone' as keyof ClientFormData,
      label: '전화번호',
      placeholder: '전화번호를 입력하세요',
      required: false,
      keyboardType: 'phone-pad' as const,
    },
    {
      key: 'email' as keyof ClientFormData,
      label: '이메일',
      placeholder: '이메일을 입력하세요',
      required: false,
      keyboardType: 'email-address' as const,
      autoCapitalize: 'none' as const,
    },
    {
      key: 'address' as keyof ClientFormData,
      label: '주소',
      placeholder: '주소를 입력하세요',
      required: false,
      multiline: true,
    },
    {
      key: 'notes' as keyof ClientFormData,
      label: '비고',
      placeholder: '비고사항을 입력하세요 (선택사항)',
      required: false,
      multiline: true,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header title="거래처 등록" showBack />
      
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
            {formFields.map((field) => (
              <View key={field.key} style={styles.inputContainer}>
                <Text style={styles.label}>
                  {field.label}
                  {field.required && <Text style={styles.required}> *</Text>}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    field.multiline && styles.multilineInput,
                    errors[field.key] && styles.inputError,
                  ]}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={formData[field.key]}
                  onChangeText={(value) => handleInputChange(field.key, value)}
                  keyboardType={field.keyboardType}
                  autoCapitalize={field.autoCapitalize}
                  multiline={field.multiline}
                  numberOfLines={field.multiline ? 3 : 1}
                  textAlignVertical={field.multiline ? 'top' : 'center'}
                />
                {errors[field.key] && (
                  <Text style={styles.errorText}>{errors[field.key]}</Text>
                )}
              </View>
            ))}
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
              {loading ? '등록 중...' : '등록하기'}
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