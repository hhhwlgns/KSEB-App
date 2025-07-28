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
import { useNavigation, useRoute } from '@react-navigation/native';
import { toast } from 'sonner-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES } from '../constants';
import { getClientById, createClient, updateClient } from '../lib/api';
import { Client } from '../types';

type ClientFormData = Omit<Client, 'id' | 'createdAt'>;
type RouteParams = { client?: Client };

export default function ClientFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { client } = (route.params || {}) as RouteParams;
  const isEditMode = !!client;

  const queryClient = useQueryClient();

  const { data: existingClient, isLoading: isLoadingClient } = useQuery({
    queryKey: ['clients', client?.id],
    queryFn: () => getClientById(client!.id),
    enabled: isEditMode,
  });

  const { mutate: saveClient, isPending: isSaving } = useMutation({
    mutationFn: (clientData: ClientFormData) => 
      isEditMode 
        ? updateClient({ ...clientData, id: client.id }) 
        : createClient(clientData),
    onSuccess: () => {
      toast.success(`거래처가 성공적으로 ${isEditMode ? '수정' : '등록'}되었습니다`);
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      navigation.goBack();
    },
    onError: (error) => {
      toast.error(error.message || `거래처 ${isEditMode ? '수정' : '등록'} 중 오류 발생`);
    },
  });

  const [formData, setFormData] = useState<ClientFormData>({
    code: '',
    name: '',
    type: '납품처',
    representative: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditMode && client) {
      setFormData(client);
    }
  }, [client, isEditMode]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = '거래처명은 필수입니다.';
    if (!formData.code.trim()) newErrors.code = '거래처 코드는 필수입니다.';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식을 입력해주세요';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof Omit<ClientFormData, 'type'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleTypeChange = (type: '매입처' | '납품처') => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('필수 입력 항목을 확인해주세요.');
      return;
    }
    saveClient(formData);
  };

  if (isLoadingClient) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="거래처 정보 로딩 중..." showBack />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const formFields = [
    { key: 'representative' as const, label: '대표자명', placeholder: '대표자명을 입력하세요' },
    { key: 'phone' as const, label: '전화번호', placeholder: '전화번호를 입력하세요', keyboardType: 'phone-pad' as const },
    { key: 'email' as const, label: '이메일', placeholder: '이메일을 입력하세요', keyboardType: 'email-address' as const, autoCapitalize: 'none' as const },
    { key: 'address' as const, label: '주소', placeholder: '주소를 입력하세요', multiline: true },
    { key: 'notes' as const, label: '비고', placeholder: '비고사항을 입력하세요 (선택사항)', multiline: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header title={`거래처 ${isEditMode ? '수정' : '등록'}`} showBack />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>거래처 코드 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.code && styles.inputError]}
                placeholder="거래처 코드를 입력하세요"
                placeholderTextColor={COLORS.textMuted}
                value={formData.code}
                onChangeText={(value) => handleInputChange('code', value)}
                autoCapitalize="characters"
              />
              {errors.code && <Text style={styles.errorText}>{errors.code}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>거래처명 <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                placeholder="거래처명을 입력하세요"
                placeholderTextColor={COLORS.textMuted}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>거래처 구분 <Text style={styles.required}>*</Text></Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === '매입처' && styles.typeButtonActive]}
                  onPress={() => handleTypeChange('매입처')}
                >
                  <Text style={[styles.typeButtonText, formData.type === '매입처' && styles.typeButtonTextActive]}>매입처</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === '납품처' && styles.typeButtonActive]}
                  onPress={() => handleTypeChange('납품처')}
                >
                  <Text style={[styles.typeButtonText, formData.type === '납품처' && styles.typeButtonTextActive]}>납품처</Text>
                </TouchableOpacity>
              </View>
            </View>

            {formFields.map((field) => (
              <View key={field.key} style={styles.inputContainer}>
                <Text style={styles.label}>{field.label}</Text>
                <TextInput
                  style={[styles.input, field.multiline && styles.multilineInput, errors[field.key] && styles.inputError]}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={formData[field.key] || ''}
                  onChangeText={(value) => handleInputChange(field.key, value)}
                  keyboardType={field.keyboardType}
                  autoCapitalize={field.autoCapitalize}
                  multiline={field.multiline}
                  numberOfLines={field.multiline ? 3 : 1}
                  textAlignVertical={field.multiline ? 'top' : 'center'}
                />
                {errors[field.key] && <Text style={styles.errorText}>{errors[field.key]}</Text>}
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={styles.footer}>
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
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: SIZES.xl },
  form: { padding: SIZES.lg },
  inputContainer: { marginBottom: SIZES.lg },
  label: { fontSize: SIZES.fontSM, fontWeight: '600', color: COLORS.textPrimary, marginBottom: SIZES.sm },
  required: { color: COLORS.error },
  input: { height: SIZES.inputHeight, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMD, paddingHorizontal: SIZES.md, fontSize: SIZES.fontMD, backgroundColor: COLORS.surface, color: COLORS.textPrimary },
  multilineInput: { height: 80, paddingTop: SIZES.md },
  inputError: { borderColor: COLORS.error },
  errorText: { fontSize: SIZES.fontXS, color: COLORS.error, marginTop: SIZES.xs },
  
  typeSelector: {
    flexDirection: 'row',
    height: SIZES.inputHeight,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMD,
    overflow: 'hidden',
  },
  typeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  typeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  typeButtonText: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  typeButtonTextActive: {
    color: 'white',
  },

  footer: { flexDirection: 'row', padding: SIZES.lg, backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border, gap: SIZES.md },
  cancelButton: { flex: 1, height: SIZES.buttonHeight, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMD, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.surface },
  cancelButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: COLORS.textSecondary },
  submitButton: { flex: 2, height: SIZES.buttonHeight, backgroundColor: COLORS.primary, borderRadius: SIZES.radiusMD, justifyContent: 'center', alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: COLORS.textMuted },
  submitButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: 'white' },
});