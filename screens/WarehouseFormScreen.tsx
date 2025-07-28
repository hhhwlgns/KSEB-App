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
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import FormSelector from '../components/FormSelector';
import { COLORS, SIZES } from '../constants';
import { createWarehouseRequest, getProducts, getClients } from '../lib/api';
import { useWarehouseForm } from '../context/WarehouseFormContext';
import { Product, Client } from '../types';

type WarehouseFormData = {
  type: 'inbound' | 'outbound';
  quantity: string;
  notes: string;
  scheduledDateTime: Date;
};

export default function WarehouseFormScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { selectedProduct, selectedClient, setFieldValue } = useWarehouseForm();

  const [formData, setFormData] = useState<WarehouseFormData>({
    type: 'inbound',
    quantity: '',
    notes: '',
    scheduledDateTime: new Date(),
  });
  const [timeDigits, setTimeDigits] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    setTimeDigits(hours + minutes);

    // 화면을 벗어날 때 컨텍스트 상태를 초기화
    return () => {
      setFieldValue('selectedProduct', null);
      setFieldValue('selectedClient', null);
    };
  }, [setFieldValue]);

  const { data: products, isLoading: isLoadingProducts } = useQuery({ queryKey: ['products'], queryFn: getProducts });
  const { data: clients, isLoading: isLoadingClients } = useQuery({ queryKey: ['clients'], queryFn: getClients });

  const { mutate: saveRequest, isPending: isSaving } = useMutation({
    mutationFn: createWarehouseRequest,
    onSuccess: () => {
      toast.success('입출고 요청이 성공적으로 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['warehouseRequests'] });
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
    if (timeDigits.length !== 4) {
      newErrors.time = '올바른 시간 형식(HH:MM)을 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof Omit<WarehouseFormData, 'scheduledDateTime'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleTimeChange = (text: string) => {
    const newDigits = text.replace(/[^0-9]/g, '');
    if (newDigits.length > 4) return;

    let hours = newDigits.slice(0, 2);
    if (hours.length === 2 && parseInt(hours, 10) > 23) hours = '23';

    let minutes = newDigits.slice(2, 4);
    if (minutes.length === 2 && parseInt(minutes, 10) > 59) minutes = '59';

    setTimeDigits(hours + minutes);
    if (errors.time) setErrors(prev => ({ ...prev, time: '' }));
  };

  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: formData.scheduledDateTime,
      onChange: (event, selectedDate) => {
        if (event.type === 'set' && selectedDate) {
          const newDate = new Date(formData.scheduledDateTime);
          newDate.setFullYear(selectedDate.getFullYear());
          newDate.setMonth(selectedDate.getMonth());
          newDate.setDate(selectedDate.getDate());
          setFormData(prev => ({ ...prev, scheduledDateTime: newDate }));
        }
      },
      mode: 'date',
    });
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      toast.error('필수 입력 항목을 확인해주세요.');
      return;
    }
    const hours = parseInt(timeDigits.slice(0, 2), 10);
    const minutes = parseInt(timeDigits.slice(2, 4), 10);
    const finalDateTime = new Date(formData.scheduledDateTime);
    finalDateTime.setHours(hours);
    finalDateTime.setMinutes(minutes);

    const requestData = {
      type: formData.type,
      itemCode: selectedProduct!.code,
      itemName: selectedProduct!.name,
      specification: selectedProduct!.specification,
      quantity: Number(formData.quantity),
      companyCode: selectedClient!.code,
      companyName: selectedClient!.name,
      scheduledDateTime: finalDateTime.toISOString(),
      notes: formData.notes,
    };
    saveRequest(requestData);
  };

  const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  
  const formatTime = (digits: string) => {
    if (digits.length > 2) return `${digits.slice(0, 2)}:${digits.slice(2)}`;
    return digits;
  };

  if (isLoadingProducts || isLoadingClients) {
    return <SafeAreaView style={styles.container}><LoadingSpinner /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="입출고 요청 등록" showBack />
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>작업 유형 *</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'inbound' && styles.typeButtonActive]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'inbound' }))}
                >
                  <Text style={[styles.typeButtonText, formData.type === 'inbound' && styles.typeButtonTextActive]}>입고</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, formData.type === 'outbound' && styles.typeButtonActive]}
                  onPress={() => setFormData(prev => ({ ...prev, type: 'outbound' }))}
                >
                  <Text style={[styles.typeButtonText, formData.type === 'outbound' && styles.typeButtonTextActive]}>출고</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FormSelector label="품목" value={selectedProduct?.name} placeholder="품목을 선택하세요" onPress={() => navigation.navigate('Selection', { title: '품목 선택', items: products || [], returnKey: 'selectedProduct' })} required error={errors.product} />
            <FormSelector label="거래처" value={selectedClient?.name} placeholder="거래처를 선택하세요" onPress={() => navigation.navigate('Selection', { title: '거래처 선택', items: clients || [], returnKey: 'selectedClient' })} required error={errors.client} />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>수량 *</Text>
              <TextInput style={[styles.input, errors.quantity && styles.inputError]} placeholder="수량을 입력하세요" placeholderTextColor={COLORS.textMuted} value={formData.quantity} onChangeText={(value) => handleInputChange('quantity', value.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
              {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>예정일시 *</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity onPress={showDatePicker} style={[styles.input, styles.dateInput]}>
                  <Text style={styles.dateText}>{formatDate(formData.scheduledDateTime)}</Text>
                </TouchableOpacity>
                <TextInput style={[styles.input, styles.timeInput, errors.time && styles.inputError]} placeholder="HH:MM" value={formatTime(timeDigits)} onChangeText={handleTimeChange} keyboardType="number-pad" maxLength={5} />
              </View>
              {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>비고</Text>
              <TextInput style={[styles.input, styles.multilineInput]} placeholder="특이사항 (선택사항)" placeholderTextColor={COLORS.textMuted} value={formData.notes} onChangeText={(value) => handleInputChange('notes', value)} multiline />
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
  input: { height: SIZES.inputHeight, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusMD, paddingHorizontal: SIZES.md, fontSize: SIZES.fontMD, backgroundColor: COLORS.surface, color: COLORS.textPrimary, justifyContent: 'center' },
  dateTimeContainer: { flexDirection: 'row', gap: SIZES.sm },
  dateInput: { flex: 2, justifyContent: 'center', alignItems: 'center' },
  timeInput: { flex: 1, textAlign: 'center' },
  dateText: { fontSize: SIZES.fontMD, color: COLORS.textPrimary },
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