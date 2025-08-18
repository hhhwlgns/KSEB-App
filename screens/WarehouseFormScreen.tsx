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
import { createInboundOrder, createOutboundOrder, fetchCompanies, fetchItems, RackInfo, fetchInOutData } from '../lib/api';

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
  const [availableLocations, setAvailableLocations] = useState<Array<{ locationCode: string; quantity: number }>>([]);

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
  const { data: inOutData } = useQuery({
    queryKey: ['inOutData'],
    queryFn: fetchInOutData,
  });

  // 바코드 스캔으로 가져온 랙 정보로 자동 설정
  useEffect(() => {
    if (rack && items) {
      // SKU 기준으로 품목 찾기 (itemCode가 SKU와 같다고 가정)
      const matchingItem = items.find(item => item.itemCode === rack.sku);
      if (matchingItem) {
        setSelectedItem(matchingItem);
      }
      
      // 수량 설정
      if (rack.quantity) {
        setQuantity(rack.quantity.toString());
      }

      // RACK-001 특별 케이스: 입고로 고정하고 출고 비활성화
      if (rack.disableOutbound) {
        setType('INBOUND');
        // 입고 처리이므로, 기존 위치를 보여주되 새로 선택할 수 있도록
        // 위치 필드를 자동으로 채우지 않음.
        setSelectedArea('');
        setSelectedNumber('');
      } else if (rack.location) {
        // 일반 랙 스캔 시에는 기존 위치를 표시
        const areaMatch = rack.location.match(/^([A-T])(\d+)$/);
        if (areaMatch) {
          const area = areaMatch[1];
          const number = parseInt(areaMatch[2], 10).toString();
          setSelectedArea(area);
          setSelectedNumber(number);
        }
      }
    }
  }, [rack, items]);

  // 출고 시 선택된 품목의 재고 위치 계산 (웹 로직과 동일하게 수정)
  useEffect(() => {
    if (type === 'OUTBOUND' && selectedItem && inOutData && items) {
      // 완료된 입출고 내역만 필터링
      const completedInOut = inOutData.filter(record => 
        record.status === 'completed' || record.status === '완료'
      );
      
      // 각 품목별 랙 위치별 재고 계산 (웹과 동일한 구조)
      const rackItemQuantities: Record<string, Record<number, number>> = {}; // rackCode -> {itemId: quantity}
      
      completedInOut.forEach(record => {
        // 레코드 레벨의 location 사용
        const locationCode = record.location || '';
        let rackCode = locationCode.replace('-', '').toUpperCase();
        
        // 패딩 처리: J5 → J005
        if (rackCode.match(/^[A-T]\d{1,2}$/)) {
          const section = rackCode.charAt(0);
          const position = rackCode.slice(1).padStart(3, '0');
          rackCode = `${section}${position}`;
        }
        
        if (!rackCode) return;
        
        // 아이템 ID 찾기 (SKU 기반)
        const item = items.find(i => i.itemCode === record.sku);
        if (!item) return;
        
        if (!rackItemQuantities[rackCode]) {
          rackItemQuantities[rackCode] = {};
        }
        
        const currentQty = rackItemQuantities[rackCode][item.itemId] || 0;
        
        if (record.type === 'inbound') {
          // 입고: 수량 증가
          rackItemQuantities[rackCode][item.itemId] = currentQty + record.quantity;
        } else if (record.type === 'outbound') {
          // 출고: 수량 감소
          rackItemQuantities[rackCode][item.itemId] = Math.max(0, currentQty - record.quantity);
        }
      });
      
      // 선택된 품목의 출고 가능한 재고 목록 생성 (수량이 0보다 큰 것만)
      const inventoryLocations: Array<{ locationCode: string; quantity: number }> = [];
      
      Object.entries(rackItemQuantities).forEach(([rackCode, itemQuantities]) => {
        const quantity = itemQuantities[selectedItem.itemId] || 0;
        if (quantity > 0) {
          inventoryLocations.push({
            locationCode: rackCode,
            quantity
          });
        }
      });
      
      setAvailableLocations(inventoryLocations);
      
      // 기존 선택된 위치 초기화
      setSelectedArea('');
      setSelectedNumber('');
      setLocation('');
    } else {
      setAvailableLocations([]);
    }
  }, [type, selectedItem, inOutData, items]);

  const areas = generateAreas();
  const numbers = generateNumbers();

  const createOrderMutation = useMutation({
    mutationFn: (data: { itemId: number; quantity: number; companyId?: number; expectedDate?: string; location?: string; }) => {
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
      queryClient.invalidateQueries({ queryKey: ['warehouseCurrent'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryData'] });
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
    if (!location) newErrors.location = type === 'OUTBOUND' ? '출고 위치를 선택해주세요.' : '입고 구역을 선택해주세요.';
    if (!expectedDate) newErrors.date = '예정일을 선택해주세요.';

    // 바코드 스캔 모드가 아닐 때만 품목과 수량을 검사
    if (!isFromRackScan) {
      if (!selectedItem) newErrors.item = '품목을 선택해주세요.';
      if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
        newErrors.quantity = '올바른 수량을 입력해주세요.';
      }
    } else {
      // 바코드 스캔 모드일 때는 selectedItem이 제대로 설정되었는지 확인
      if (!selectedItem) {
        newErrors.item = '스캔된 품목의 정보를 찾을 수 없습니다. 관리자에게 문의하세요.';
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // 오류 메시지를 조합하여 한 번에 보여줌
      const errorMessage = Object.values(newErrors).join('\n');
      Alert.alert('입력 오류', errorMessage);
      return false;
    }
    
    return true;
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
    // validateForm 함수가 Alert를 직접 호출하므로, 여기서 추가 Alert는 필요 없음
    if (!validateForm()) {
      return;
    }

    const orderData = {
      itemId: selectedItem!.itemId,
      quantity: Number(quantity),
      companyId: selectedCompany!.companyId,
      expectedDate: expectedDate.toISOString().split('T')[0],
      location: location, // 선택된 위치 정보 추가
    };
    createOrderMutation.mutate(orderData);
  };

  const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const formatTime = (digits: string) => (digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits);

  const renderRackInfo = () => {
    if (!rack) return null;
    
    return (
      <View style={styles.rackInfoContainer}>
        <Text style={styles.label}>스캔된 정보</Text>
        <View style={styles.rackCard}>
          <View style={styles.rackHeader}>
            <Text style={styles.rackId}>바코드: {rack.id || rack.rackCode}</Text>
            {/* 다시 스캔 버튼 제거 */}
          </View>
          <View style={styles.rackDetails}>
            <Text style={styles.rackName}>{rack.name}</Text>
            <Text style={styles.rackSku}>SKU: {rack.sku}</Text>
            <Text style={styles.rackSpec}>규격: {rack.specification}</Text>
            <Text style={styles.rackQuantity}>수량: {rack.quantity}개</Text>
            {rack.location && <Text style={styles.rackLocation}>현재 위치: {rack.location}</Text>}
          </View>
        </View>
      </View>
    );
  };

  if (isLoadingCompanies || isLoadingItems) {
    return <SafeAreaView style={styles.container}><LoadingSpinner /></SafeAreaView>;
  }

  const isFromRackScan = !!rack;

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
                  style={[styles.typeButton, type === 'INBOUND' && styles.typeButtonActive]} 
                  onPress={() => setType('INBOUND')}
                  disabled={isFromRackScan && rack.disableOutbound}
                >
                  <Text style={[styles.typeButtonText, type === 'INBOUND' && styles.typeButtonTextActive]}>입고</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[
                    styles.typeButton, 
                    type === 'OUTBOUND' && styles.typeButtonActive,
                    (isFromRackScan && rack.disableOutbound) && styles.typeButtonDisabled
                  ]} 
                  onPress={() => setType('OUTBOUND')}
                  disabled={isFromRackScan && rack.disableOutbound}
                >
                  <Text style={[
                    styles.typeButtonText, 
                    type === 'OUTBOUND' && styles.typeButtonTextActive,
                    (isFromRackScan && rack.disableOutbound) && styles.typeButtonTextDisabled
                  ]}>출고</Text>
                </TouchableOpacity>
              </View>
            </View>

            {renderRackInfo()}

            {!isFromRackScan && (
              <>
                <CustomDropdown
                  label="품목 *"
                  data={items || []}
                  value={selectedItem}
                  onSelect={(item) => setSelectedItem(item as Item)}
                  placeholder="품목을 선택하세요"
                  displayKey="itemName"
                  searchable={true}
                />

                {/* 출고 시 위치 선택을 품목 선택 바로 다음에 위치 */}
                {type === 'OUTBOUND' && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>출고 위치 선택 *</Text>
                    {availableLocations.length > 0 ? (
                      <CustomDropdown
                        data={availableLocations.map(loc => ({
                          label: `${loc.locationCode} (재고: ${loc.quantity}개)`,
                          value: loc.locationCode
                        }))}
                        value={location ? {
                          label: `${location} (재고: ${availableLocations.find(loc => loc.locationCode === location)?.quantity || 0}개)`,
                          value: location
                        } : null}
                        onSelect={(selected: any) => {
                          setLocation(selected.value);
                          if (errors.location) setErrors(prev => ({ ...prev, location: undefined }));
                        }}
                        placeholder="재고 위치를 선택하세요"
                        displayKey="label"
                        searchable={false}
                      />
                    ) : selectedItem ? (
                      <View style={styles.noStockContainer}>
                        <Text style={styles.noStockText}>선택한 품목의 재고가 없습니다</Text>
                      </View>
                    ) : (
                      <View style={styles.noStockContainer}>
                        <Text style={styles.noStockText}>품목을 먼저 선택해주세요</Text>
                      </View>
                    )}
                    {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
                  </View>
                )}

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
              </>
            )}
            
            <CustomDropdown
              label="거래처 *"
              data={companies || []}
              value={selectedCompany}
              onSelect={(company) => setSelectedCompany(company as Company)}
              placeholder="거래처를 선택하세요"
              displayKey="companyName"
              searchable={true}
            />

            {/* 입고 시에만 구역 선택 표시 */}
            {type === 'INBOUND' && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>입고 구역 선택 *</Text>
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
            )}

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
  inputDisabled: { backgroundColor: COLORS.surfaceHover, color: COLORS.textMuted },
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
  typeButtonDisabled: { backgroundColor: COLORS.surfaceHover, borderColor: COLORS.border },
  typeButtonText: { fontSize: SIZES.fontMD, fontWeight: '600', color: COLORS.textSecondary },
  typeButtonTextActive: { color: 'white' },
  typeButtonTextDisabled: { color: COLORS.textMuted },
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
    marginTop: SIZES.sm,
    fontStyle: 'italic',
  },
  rackQuantity: {
    fontSize: SIZES.fontMD,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
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
  noStockContainer: {
    padding: SIZES.md,
    backgroundColor: COLORS.surfaceHover,
    borderRadius: SIZES.radiusMD,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noStockText: {
    fontSize: SIZES.fontSM,
    color: COLORS.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});