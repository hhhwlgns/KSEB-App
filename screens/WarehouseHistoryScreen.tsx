import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import CollapsibleSection from '../components/CollapsibleSection';
import { COLORS, SIZES } from '../constants';
import { InOutRecord } from '../types/inout';
import { fetchInOutData } from '../lib/api';

const FILTER_OPTIONS = {
  type: [
    { label: '전체', value: 'all' },
    { label: '입고', value: 'inbound' },
    { label: '출고', value: 'outbound' },
  ],
};

export default function WarehouseHistoryScreen() {
  const navigation = useNavigation();
  const { data: inOutRecords, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inOutData'],
    queryFn: fetchInOutData,
  });

  const [filteredRecords, setFilteredRecords] = useState<InOutRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);

  const todaySummary = useMemo(() => {
    if (!inOutRecords) return { inbound: 0, outbound: 0 };
    const today = new Date().toISOString().split('T')[0];
    
    const todayCompletedItems = inOutRecords.filter(item => item.date === today && item.status === '완료');

    return {
      inbound: todayCompletedItems.filter(item => item.type === 'inbound').length,
      outbound: todayCompletedItems.filter(item => item.type === 'outbound').length,
    };
  }, [inOutRecords]);

  useEffect(() => {
    if (inOutRecords) {
      let filtered = [...inOutRecords];
      
      if (activeType !== 'all') {
        filtered = filtered.filter(item => item.type === activeType);
      }

      if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
          (item.productName || '').toLowerCase().includes(lowercasedQuery) ||
          (item.sku || '').toLowerCase().includes(lowercasedQuery) ||
          (item.company || '').toLowerCase().includes(lowercasedQuery) ||
          (item.individualCode || '').toLowerCase().includes(lowercasedQuery)
        );
      }
      
      filtered.sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

      setFilteredRecords(filtered);
    }
  }, [inOutRecords, searchQuery, activeType]);

  const formatDateTime = (date: string, time: string) => {
    if (!date || !time) return 'N/A';
    return `${date} ${time}`;
  };

  const renderFilterChips = (
    options: Array<{ label: string; value: string }>,
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[styles.filterChip, selectedValue === option.value && styles.filterChipActive]}
          onPress={() => onSelect(option.value)}
        >
          <Text style={[styles.filterChipText, selectedValue === option.value && styles.filterChipTextActive]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderHistoryItem = ({ item }: { item: InOutRecord }) => {
    const isOutbound = item.type === 'outbound';

    return (
      <View style={styles.itemCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, isOutbound ? styles.outboundBadge : styles.inboundBadge]}>
            <Ionicons name={isOutbound ? 'arrow-up' : 'arrow-down'} size={14} color={isOutbound ? COLORS.error : COLORS.success} />
            <Text style={[styles.typeText, isOutbound ? styles.outboundText : styles.inboundText]}>
              {isOutbound ? '출고' : '입고'}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons name={'checkmark-done-outline'} size={16} color={COLORS.statusCompleted} />
            <Text style={[styles.statusText, { color: COLORS.statusCompleted }]}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.productName} numberOfLines={1}>{item.productName}</Text>
          <Text style={styles.itemSku}>SKU: {item.sku}</Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>개별코드</Text><Text style={styles.detailValue}>{item.individualCode}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>수량</Text><Text style={[styles.detailValue, styles.quantityValue]}>{item.quantity} 개</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>위치</Text><Text style={styles.detailValue}>{item.location}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>거래처</Text><Text style={styles.detailValue} numberOfLines={1}>{item.company}</Text></View>
        </View>

        <Text style={styles.dateTimeText}>{formatDateTime(item.date, item.time)}</Text>
      </View>
    );
  };

  if (isLoading && !inOutRecords) {
    return <SafeAreaView style={styles.container}><LoadingSpinner /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="입출고 내역" 
        subtitle="완료된 입출고 내역" 
        showBack
        rightComponent={
          <TouchableOpacity style={styles.searchButton} onPress={() => setSearchVisible(!searchVisible)}>
            <Ionicons name={searchVisible ? "close" : "search"} size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />
      
      {searchVisible && (
        <View style={styles.toolbar}>
          <SearchBar
            placeholder="품목명, SKU, 개별코드, 거래처 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      <CollapsibleSection title="오늘 요약 및 필터" isCollapsed={searchVisible}>
        <View style={styles.collapsibleContent}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Ionicons name="arrow-down-circle-outline" size={24} color={COLORS.success} />
              <Text style={styles.summaryValue}>{todaySummary.inbound}</Text>
              <Text style={styles.summaryLabel}>입고완료</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="arrow-up-circle-outline" size={24} color={COLORS.error} />
              <Text style={styles.summaryValue}>{todaySummary.outbound}</Text>
              <Text style={styles.summaryLabel}>출고완료</Text>
            </View>
          </View>
          <View style={styles.filterToolbar}>
            {renderFilterChips(FILTER_OPTIONS.type, activeType, setActiveType)}
          </View>
        </View>
      </CollapsibleSection>

      <FlatList
        data={filteredRecords}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery || activeType !== 'all' ? '조건에 맞는 내역이 없습니다.' : '입출고 내역이 없습니다.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchButton: { padding: SIZES.sm },
  toolbar: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.surface,
  },
  collapsibleContent: {
    paddingHorizontal: SIZES.md,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.md,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: SIZES.fontXXL,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginVertical: SIZES.xs,
  },
  summaryLabel: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  filterToolbar: {
    paddingVertical: SIZES.sm,
  },
  filterContainer: {
    gap: SIZES.sm,
    paddingVertical: SIZES.sm,
  },
  filterChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusXL,
    backgroundColor: COLORS.surfaceHover,
  },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: SIZES.fontSM, fontWeight: '600', color: COLORS.textSecondary },
  filterChipTextActive: { color: 'white' },
  listContainer: { padding: SIZES.md, paddingBottom: 80 },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius,
  },
  inboundBadge: { backgroundColor: '#e0f2fe' },
  outboundBadge: { backgroundColor: '#fee2e2' },
  typeText: { fontSize: SIZES.fontSM, fontWeight: 'bold', marginLeft: SIZES.xs },
  inboundText: { color: COLORS.success },
  outboundText: { color: COLORS.error },
  itemInfo: {
    paddingBottom: SIZES.sm,
    marginBottom: SIZES.sm,
  },
  productName: { fontSize: SIZES.fontLG, fontWeight: 'bold', color: COLORS.textPrimary },
  itemSku: { fontSize: SIZES.fontSM, color: COLORS.textSecondary },
  detailGrid: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.md,
    gap: SIZES.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: { fontSize: SIZES.fontSM, color: COLORS.textSecondary },
  detailValue: { fontSize: SIZES.fontSM, color: COLORS.textPrimary, fontWeight: '500', flex: 1, textAlign: 'right' },
  quantityValue: { color: COLORS.primary, fontWeight: 'bold' },
  dateTimeText: {
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
    marginTop: 50,
  },
  emptyText: {
    fontSize: SIZES.fontMD,
    color: COLORS.textMuted,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
});