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
import { COLORS, SIZES } from '../constants';
import { WarehouseItem } from '../types';
import { getWarehouseCurrent } from '../lib/api';

const FILTER_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '진행중', value: 'in_progress' },
  { label: '예약', value: 'pending' },
  { label: '완료', value: 'completed' },
];

export default function WarehouseCurrentScreen() {
  const navigation = useNavigation();
  const { data: items, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['warehouseCurrent'],
    queryFn: getWarehouseCurrent,
  });

  const [filteredItems, setFilteredItems] = useState<WarehouseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    if (items) {
      let filtered = [...items];
      
      if (activeFilter !== 'all') {
        filtered = filtered.filter(item => item.status === activeFilter);
      }

      if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
          (item.productName || '').toLowerCase().includes(lowercasedQuery) ||
          (item.sku || '').toLowerCase().includes(lowercasedQuery) ||
          (item.companyName || '').toLowerCase().includes(lowercasedQuery)
        );
      }
      
      filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

      setFilteredItems(filtered);
    }
  }, [items, searchQuery, activeFilter]);

  const getStatusStyle = (status: WarehouseItem['status']) => {
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

  const renderWarehouseItem = ({ item }: { item: WarehouseItem }) => {
    const statusStyle = getStatusStyle(item.status);
    const isOutbound = item.type === 'outbound';

    return (
      <View style={styles.itemCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, isOutbound ? styles.outboundBadge : styles.inboundBadge]}>
            <Ionicons name={isOutbound ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'} size={16} color={isOutbound ? COLORS.error : COLORS.success} />
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
          <Text style={styles.productName}>{item.productName}</Text>
          <Text style={styles.itemSku}>SKU: {item.sku}</Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>개별코드</Text><Text style={styles.detailValue}>{item.individualCode}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>규격</Text><Text style={styles.detailValue}>{item.specification}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>수량</Text><Text style={[styles.detailValue, styles.quantityValue]}>{item.quantity} 개</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>위치</Text><Text style={styles.detailValue}>{item.location}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>거래처</Text><Text style={styles.detailValue}>{item.companyName}</Text></View>
          {isOutbound && <View style={styles.detailRow}><Text style={styles.detailLabel}>목적지</Text><Text style={styles.detailValue}>{item.destination}</Text></View>}
        </View>

        <Text style={styles.dateTimeText}>{formatDateTime(item.dateTime)}</Text>
      </View>
    );
  };

  if (isLoading && !items) {
    return <SafeAreaView style={styles.container}><LoadingSpinner /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="입출고 현황" 
        subtitle="현재 진행중인 입출고 목록" 
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
            placeholder="품목명, SKU, 거래처 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      <View style={styles.filterToolbar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContainer}>
          {FILTER_OPTIONS.map(opt => (
            <TouchableOpacity 
              key={opt.value} 
              style={[styles.filterChip, activeFilter === opt.value && styles.filterChipActive]}
              onPress={() => setActiveFilter(opt.value)}
            >
              <Text style={[styles.filterChipText, activeFilter === opt.value && styles.filterChipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        renderItem={renderWarehouseItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-stacked-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery || activeFilter !== 'all' ? '조건에 맞는 현황이 없습니다.' : '입출고 현황이 없습니다.'}
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('WarehouseForm' as never)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
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
  filterToolbar: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: SIZES.xs },
  statusText: { fontSize: SIZES.fontSM, fontWeight: '600' },
  itemInfo: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SIZES.md,
    marginBottom: SIZES.md,
  },
  productName: { fontSize: SIZES.fontLG, fontWeight: 'bold', color: COLORS.textPrimary },
  itemSku: { fontSize: SIZES.fontSM, color: COLORS.textSecondary },
  detailGrid: {
    gap: SIZES.sm,
    marginBottom: SIZES.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: { fontSize: SIZES.fontSM, color: COLORS.textSecondary },
  detailValue: { fontSize: SIZES.fontSM, color: COLORS.textPrimary, fontWeight: '500' },
  quantityValue: { color: COLORS.primary, fontWeight: 'bold' },
  dateTimeText: {
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SIZES.sm,
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
  fab: {
    position: 'absolute',
    right: SIZES.lg,
    bottom: SIZES.lg + 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});