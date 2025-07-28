import React, { useState, useEffect } from 'react';
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
import { WarehouseHistoryItem } from '../types';
import { getWarehouseHistory } from '../lib/api';

const FILTER_OPTIONS = {
  type: [
    { label: '전체', value: 'all' },
    { label: '입고', value: 'inbound' },
    { label: '출고', value: 'outbound' },
  ],
  status: [
    { label: '전체', value: 'all' },
    { label: '완료', value: 'completed' },
    { label: '진행중', value: 'in_progress' },
    { label: '예약', value: 'pending' },
  ],
};

export default function WarehouseHistoryScreen() {
  const navigation = useNavigation();
  const { data: historyItems, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['warehouseHistory'],
    queryFn: getWarehouseHistory,
  });

  const [filteredItems, setFilteredItems] = useState<WarehouseHistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeType, setActiveType] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');

  useEffect(() => {
    if (historyItems) {
      let filtered = [...historyItems];
      
      if (activeType !== 'all') {
        filtered = filtered.filter(item => item.type === activeType);
      }
      if (activeStatus !== 'all') {
        filtered = filtered.filter(item => item.status === activeStatus);
      }

      if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
          item.productName.toLowerCase().includes(lowercasedQuery) ||
          item.sku.toLowerCase().includes(lowercasedQuery) ||
          item.companyName.toLowerCase().includes(lowercasedQuery) ||
          item.individualCode.toLowerCase().includes(lowercasedQuery)
        );
      }
      
      filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

      setFilteredItems(filtered);
    }
  }, [historyItems, searchQuery, activeType, activeStatus]);

  const getStatusStyle = (status: WarehouseHistoryItem['status']) => {
    switch (status) {
      case 'in_progress': return { color: COLORS.statusInProgress, icon: 'sync-circle-outline', label: '진행중' };
      case 'pending': return { color: COLORS.statusPending, icon: 'time-outline', label: '예약' };
      case 'completed': return { color: COLORS.statusCompleted, icon: 'checkmark-done-outline', label: '완료' };
      default: return { color: COLORS.textMuted, icon: 'help-circle-outline', label: '알 수 없음' };
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
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

  const renderHistoryItem = ({ item }: { item: WarehouseHistoryItem }) => {
    const statusStyle = getStatusStyle(item.status);
    const isOutbound = item.type === 'outbound';

    return (
      <TouchableOpacity 
        style={styles.itemCard} 
        activeOpacity={0.7}
        onPress={() => navigation.navigate('WarehouseHistoryDetail', { item })}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, isOutbound ? styles.outboundBadge : styles.inboundBadge]}>
            <Ionicons name={isOutbound ? 'arrow-up' : 'arrow-down'} size={14} color={isOutbound ? COLORS.error : COLORS.success} />
            <Text style={[styles.typeText, isOutbound ? styles.outboundText : styles.inboundText]}>
              {isOutbound ? '출고' : '입고'}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons name={statusStyle.icon as any} size={16} color={statusStyle.color} />
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
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
          <View style={styles.detailRow}><Text style={styles.detailLabel}>거래처</Text><Text style={styles.detailValue} numberOfLines={1}>{item.companyName}</Text></View>
          {item.manager && <View style={styles.detailRow}><Text style={styles.detailLabel}>담당자</Text><Text style={styles.detailValue}>{item.manager}</Text></View>}
        </View>

        <Text style={styles.dateTimeText}>{formatDateTime(item.dateTime)}</Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && !historyItems) {
    return <SafeAreaView style={styles.container}><LoadingSpinner /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="입출고 내역" subtitle="완료된 입출고 내역" showBack />
      
      <CollapsibleSection title="검색 및 필터">
        <View style={styles.toolbar}>
          <SearchBar
            placeholder="품목명, SKU, 개별코드, 거래처 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ marginBottom: SIZES.md }}
          />
          <Text style={styles.filterTitle}>유형</Text>
          {renderFilterChips(FILTER_OPTIONS.type, activeType, setActiveType)}
          <Text style={styles.filterTitle}>상태</Text>
          {renderFilterChips(FILTER_OPTIONS.status, activeStatus, setActiveStatus)}
        </View>
      </CollapsibleSection>

      <FlatList
        data={filteredItems}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery || activeType !== 'all' || activeStatus !== 'all' ? '조건에 맞는 내역이 없습니다.' : '입출고 내역이 없습니다.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  toolbar: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
  },
  filterTitle: {
    fontSize: SIZES.fontXS,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: SIZES.sm,
    marginTop: SIZES.md,
  },
  filterContainer: {
    gap: SIZES.sm,
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
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs },
  statusText: { fontSize: SIZES.fontSM, fontWeight: '600' },
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
    marginTop: SIZES.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.sm,
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