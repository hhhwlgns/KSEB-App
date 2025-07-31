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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import Header from '../components/Header';
import CustomDropdown from '../components/CustomDropdown';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES } from '../constants';
import { Company } from '../types/company';
import { Item } from '../types/item';
import { createInboundOrder, createOutboundOrder, fetchCompanies, fetchItems } from '../lib/api';

export default function WarehouseFormScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [type, setType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState('');
  const [expectedDate, setExpectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ company?: string; item?: string; quantity?: string; date?: string }>({});

  useEffect(() => {
    // Clean up any previous form state if necessary
  }, []);

  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: { itemId: number; quantity: number; companyId?: number; expectedDate?: string; }) => {
      if (type === 'INBOUND') {
        return createInboundOrder(data);
      } else {
        return createOutboundOrder(data);
      }
    },
    onSuccess: () => {
      toast.success('입출고 요청이 성공적으로 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['inOutData'] });
      queryClient.invalidateQueries({ queryKey: ['inOutRequests'] });
      navigation.goBack();
    },
    onError: (error) => {
      console.error("Order creation failed:", error);
      toast.error(error.message || '요청 등록 중 오류가 발생했습니다.');
    },
  });

  const isSaving = createOrderMutation.isPending;

  const validateForm = (): boolean => {
    const newErrors: { company?: string; item?: string; quantity?: string; date?: string } = {};
    if (!selectedCompany) newErrors.company = '거래처를 선택해주세요.';
    if (!selectedItem) newErrors.item = '품목을 선택해주세요.';
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = '올바른 수량을 입력해주세요.';
    }
    if (!expectedDate) newErrors.date = '예정일을 선택해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showDatePickerModal = () => {
    DateTimePickerAndroid.open({
      value: expectedDate,
      onChange: (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (event.type === 'set' && selectedDate) {
          setExpectedDate(selectedDate);
        }
      },
      mode: 'date',
      display: 'default',
    });
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      Alert.alert('입력 오류', '필수 입력 항목을 확인해주세요.');
      return;
    }

    const orderData = {
      itemId: selectedItem!.itemId,
      quantity: Number(quantity),
      companyId: selectedCompany!.companyId,
      expectedDate: expectedDate.toISOString().split('T')[0],
    };
    createOrderMutation.mutate(orderData);
  };

  const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const formatTime = (digits: string) => (digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits);

  const renderRackContents = () => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>처리 품목 (랙: {rack?.id})</Text>
      <View style={styles.rackContentsContainer}>
        <View style={styles.rackItem}>
          <View>
            <Text style={styles.rackItemName} numberOfLines={1}>{rack?.name}</Text>
            <Text style={styles.rackItemSku}>SKU: {rack?.sku}</Text>
          </View>
          <Text style={styles.rackItemQuantity}>{rack?.quantity} 개</Text>
        </View>
      </View>
    </View>
  );

  if (isLoadingCompanies || isLoadingItems) {
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
                <TouchableOpacity style={[styles.typeButton, type === 'INBOUND' && styles.typeButtonActive]} onPress={() => setType('INBOUND')}>
                  <Text style={[styles.typeButtonText, formData.type === 'inbound' && styles.typeButtonTextActive]}>입고</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeButton, type === 'OUTBOUND' && styles.typeButtonActive]} onPress={() => setType('OUTBOUND')}>
                  <Text style={[styles.typeButtonText, type === 'OUTBOUND' && styles.typeButtonTextActive]}>출고</Text>
                </TouchableOpacity>
              </View>
            </View>

            <CustomDropdown
              label="품목 *"
              placeholder="품목을 선택하세요"
              options={items || []}
              value={selectedItem ? selectedItem.itemName : ''}
              onSelect={(item) => setSelectedItem(item as Item)}
              keyExtractor={(item) => item.itemId.toString()}
              labelExtractor={(item) => item.itemName}
              error={errors.item}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>수량 *</Text>
              <TextInput
                style={[styles.input, errors.quantity && styles.inputError]}
                placeholder="수량을 입력하세요"
                placeholderTextColor={COLORS.textMuted}
                value={quantity}
                onChangeText={(text) => {
                  setQuantity(text.replace(/[^0-9]/g, ''));
                  if (errors.quantity) setErrors(prev => ({ ...prev, quantity: undefined }));
                }}
                keyboardType="numeric"
              />
              {errors.quantity && <Text style={styles.errorText}>{errors.quantity}</Text>}
            </View>
            
            <CustomDropdown
              label="거래처 *"
              placeholder="거래처를 선택하세요"
              options={companies || []}
              value={selectedCompany ? selectedCompany.companyName : ''}
              onSelect={(company) => setSelectedCompany(company as Company)}
              keyExtractor={(company) => company.companyId.toString()}
              labelExtractor={(company) => company.companyName}
              error={errors.company}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>예정일 *</Text>
              <TouchableOpacity onPress={showDatePickerModal} style={[styles.input, styles.dateInput]}>
                <Text style={styles.dateText}>{expectedDate.toISOString().split('T')[0]}</Text>
              </TouchableOpacity>
              {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>비고</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="특이사항 (선택사항)"
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
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
            <Text style={styles.submitButtonText}>{isSaving ? '요청 중...' : '요청 전송'}</Text>
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
  rackContentsContainer: {
    backgroundColor: COLORS.surfaceHover,
    borderRadius: SIZES.radiusMD,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  rackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  rackItemName: {
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
    flex: 1,
  },
  rackItemQuantity: {
    fontSize: SIZES.fontMD,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});