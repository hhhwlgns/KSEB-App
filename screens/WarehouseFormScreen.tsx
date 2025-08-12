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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
// import { toast } from 'sonner-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import Header from '../components/Header';
import CustomDropdown from '../components/CustomDropdown';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES } from '../constants';
import { Company } from '../types/company';
import { Item } from '../types/item';
import { createInboundOrder, createOutboundOrder, fetchCompanies, fetchItems, RackInfo } from '../lib/api';

// 구역 생성 함수 (A~T)
const generateAreas = () => {
  const areas = [];
  for (let letter = 'A'.charCodeAt(0); letter <= 'T'.charCodeAt(0); letter++) {
    const area = String.fromCharCode(letter);
    areas.push({ label: `${area}구역`, value: area });
  }
  return areas;
};

// 번호 생성 함수 (1~12번)
const generateNumbers = () => {
  const numbers = [];
  for (let number = 1; number <= 12; number++) {
    numbers.push({ label: `${number}번`, value: number.toString() });
  }
  return numbers;
};

// 라우트 파라미터 타입
type WarehouseFormRouteParams = {
  rack?: RackInfo;
};

type RootStackParamList = {
  WarehouseForm: WarehouseFormRouteParams;
};

type WarehouseFormScreenRouteProp = RouteProp<RootStackParamList, 'WarehouseForm'>;

export default function WarehouseFormScreen() {
  const navigation = useNavigation();
  const route = useRoute<WarehouseFormScreenRouteProp>();
  const queryClient = useQueryClient();

  const [type, setType] = useState<'INBOUND' | 'OUTBOUND'>('INBOUND');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedDate, setExpectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>(''); // 구역 선택 (A~T)
  const [selectedNumber, setSelectedNumber] = useState<string>(''); // 번호 선택 (1~12)
  const [location, setLocation] = useState<string>(''); // 조합된 구역 (예: G010)
  const [rack, setRack] = useState<RackInfo | null>(route.params?.rack || null); // 바코드 스캔된 랙 정보
  const [errors, setErrors] = useState<{ company?: string; item?: string; quantity?: string; date?: string; location?: string }>({});

  // 구역과 번호 조합
  useEffect(() => {
    if (selectedArea && selectedNumber) {
      const paddedNumber = selectedNumber.padStart(3, '0');
      setLocation(`${selectedArea}${paddedNumber}`);
    } else {
      setLocation('');
    }
  }, [selectedArea, selectedNumber]);

  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });
  const { data: items, isLoading: isLoadingItems } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  // 바코드 스캔으로 가져온 랙 정보로 품목 자동 선택
  useEffect(() => {
    if (rack && items) {
      // SKU 기준으로 품목 찾기
      const matchingItem = items.find(item => item.itemCode === rack.sku);
      if (matchingItem) {
        setSelectedItem(matchingItem);
      }
      
      // 위치 정보 설정
      if (rack.location) {
        const areaMatch = rack.location.match(/^([A-T])(\d+)$/);
        if (areaMatch) {
          setSelectedArea(areaMatch[1]);
          setSelectedNumber(areaMatch[2]);
        }
      }
    }
  }, [rack, items]);

  const areas = generateAreas();
  const numbers = generateNumbers();

  const createOrderMutation = useMutation({
    mutationFn: (data: { itemId: number; quantity: number; companyId?: number; expectedDate?: string; }) => {
      if (type === 'INBOUND') {
        return createInboundOrder(data);
      } else {
        return createOutboundOrder(data);
      }
    },
    onSuccess: () => {
      Alert.alert('성공', '입출고 요청이 성공적으로 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['inOutData'] });
      queryClient.invalidateQueries({ queryKey: ['inOutRequests'] });
      navigation.goBack();
    },
    onError: (error) => {
      console.error("Order creation failed:", error);
      Alert.alert('오류', error.message || '요청 등록 중 오류가 발생했습니다.');
    },
  });

  const isSaving = createOrderMutation.isPending;

  const validateForm = (): boolean => {
    const newErrors: { company?: string; item?: string; quantity?: string; date?: string; location?: string } = {};
    if (!selectedCompany) newErrors.company = '거래처를 선택해주세요.';
    if (!selectedItem) newErrors.item = '품목을 선택해주세요.';
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      newErrors.quantity = '올바른 수량을 입력해주세요.';
    }
    if (!expectedDate) newErrors.date = '예정일을 선택해주세요.';
    if (!location) newErrors.location = '구역을 선택해주세요.';
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

  const renderRackInfo = () => {
    if (!rack) return null;
    
    return (
      <View style={styles.rackInfoContainer}>
        <Text style={styles.label}>스캔된 랙 정보</Text>
        <View style={styles.rackCard}>
          <View style={styles.rackHeader}>
            <Text style={styles.rackId}>랙 ID: {rack.id}</Text>
            <TouchableOpacity 
              style={styles.rescanButton} 
              onPress={() => navigation.navigate('BarcodeScreen' as never, {
                title: '랙 바코드 스캔',
                scanMode: 'rackProcess'
              } as never)}
            >
              <Text style={styles.rescanButtonText}>다시 스캔</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.rackDetails}>
            <Text style={styles.rackName}>{rack.name}</Text>
            <Text style={styles.rackSku}>SKU: {rack.sku}</Text>
            <Text style={styles.rackSpec}>규격: {rack.specification}</Text>
            <Text style={styles.rackLocation}>위치: {rack.location}</Text>
            <Text style={styles.rackQuantity}>재고: {rack.quantity}개</Text>
          </View>
        </View>
      </View>
    );
  };

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
                  <Text style={[styles.typeButtonText, type === 'INBOUND' && styles.typeButtonTextActive]}>입고</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeButton, type === 'OUTBOUND' && styles.typeButtonActive]} onPress={() => setType('OUTBOUND')}>
                  <Text style={[styles.typeButtonText, type === 'OUTBOUND' && styles.typeButtonTextActive]}>출고</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 바코드 스캔된 랙 정보 표시 */}
            {renderRackInfo()}

            <CustomDropdown
              label="품목 *"
              data={items || []}
              value={selectedItem}
              onSelect={(item) => setSelectedItem(item as Item)}
              placeholder="품목을 선택하세요"
              displayKey="itemName"
              searchable={true}
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
              data={companies || []}
              value={selectedCompany}
              onSelect={(company) => setSelectedCompany(company as Company)}
              placeholder="거래처를 선택하세요"
              displayKey="companyName"
              searchable={true}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.label}>구역 선택 *</Text>
              <View style={styles.locationContainer}>
                <View style={styles.locationItem}>
                  <Text style={styles.locationSubLabel}>구역</Text>
                  <CustomDropdown
                    data={areas}
                    value={selectedArea ? { label: `${selectedArea}구역`, value: selectedArea } : null}
                    onSelect={(area: any) => {
                      setSelectedArea(area.value);
                      if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
                    }}
                    placeholder="구역"
                    displayKey="label"
                    searchable={false}
                  />
                </View>
                <View style={styles.locationItem}>
                  <Text style={styles.locationSubLabel}>번호</Text>
                  <CustomDropdown
                    data={numbers}
                    value={selectedNumber ? { label: `${selectedNumber}번`, value: selectedNumber } : null}
                    onSelect={(number: any) => {
                      setSelectedNumber(number.value);
                      if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
                    }}
                    placeholder="번호"
                    displayKey="label"
                    searchable={false}
                  />
                </View>
              </View>
              {location && (
                <View style={styles.locationPreview}>
                  <Text style={styles.locationPreviewText}>선택된 구역: {location}</Text>
                </View>
              )}
              {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
            </View>

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
  rackInfoContainer: {
    marginBottom: SIZES.lg,
  },
  rackCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  rackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  rackId: {
    fontSize: SIZES.fontMD,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  rescanButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: SIZES.fontXS,
    fontWeight: '600',
  },
  rackDetails: {
    gap: SIZES.xs,
  },
  rackName: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  rackSku: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  rackSpec: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  rackLocation: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  rackQuantity: {
    fontSize: SIZES.fontMD,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  locationContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  locationItem: {
    flex: 1,
  },
  locationSubLabel: {
    fontSize: SIZES.fontXS,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  locationPreview: {
    marginTop: SIZES.sm,
    padding: SIZES.sm,
    backgroundColor: COLORS.surfaceHover,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  locationPreviewText: {
    fontSize: SIZES.fontSM,
    color: COLORS.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
});