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
import { WarehouseRequestItem } from '../types';
import { getWarehouseRequests } from '../lib/api';

const FILTER_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '승인 대기', value: 'pending' },
  { label: '처리 완료', value: 'completed' },
];

export default function WarehouseRequestScreen() {
  const navigation = useNavigation();
  const { data: requests, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['warehouseRequests'],
    queryFn: getWarehouseRequests,
  });

  const [filteredRequests, setFilteredRequests] = useState<WarehouseRequestItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);

  useEffect(() => {
    if (requests) {
      let filtered = [...requests];
      
      if (activeFilter === 'pending') {
        filtered = filtered.filter(item => item.status === 'pending');
      } else if (activeFilter === 'completed') {
        filtered = filtered.filter(item => item.status === 'approved' || item.status === 'rejected');
      }

      if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
          (item.itemName || '').toLowerCase().includes(lowercasedQuery) ||
          (item.itemCode || '').toLowerCase().includes(lowercasedQuery) ||
          (item.companyName || '').toLowerCase().includes(lowercasedQuery)
        );
      }
      
      filtered.sort((a, b) => new Date(b.scheduledDateTime).getTime() - new Date(a.scheduledDateTime).getTime());

      setFilteredRequests(filtered);
    }
  }, [requests, searchQuery, activeFilter]);

  const getStatusStyle = (status: WarehouseRequestItem['status']) => {
    switch (status) {
      case 'pending': return { color: COLORS.statusPending, icon: 'time-outline', label: '승인 대기' };
      case 'approved': return { color: COLORS.statusApproved, icon: 'checkmark-circle-outline', label: '승인됨' };
      case 'rejected': return { color: COLORS.statusRejected, icon: 'close-circle-outline', label: '거절됨' };
      default: return { color: COLORS.textMuted, icon: 'help-circle-outline', label: '알 수 없음' };
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'N/A';
    const date = new Date(dateTimeString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderRequestItem = ({ item }: { item: WarehouseRequestItem }) => {
    const statusStyle = getStatusStyle(item.status);
    const isOutbound = item.type === 'outbound';

    return (
      <View style={styles.requestCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, isOutbound ? styles.outboundBadge : styles.inboundBadge]}>
            <Ionicons name={isOutbound ? 'arrow-up' : 'arrow-down'} size={14} color={isOutbound ? COLORS.error : COLORS.success} />
            <Text style={[styles.typeText, isOutbound ? styles.outboundText : styles.inboundText]}>
              {isOutbound ? '출고 요청' : '입고 요청'}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Ionicons name={statusStyle.icon as any} size={16} color={statusStyle.color} />
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
          </View>
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <Text style={styles.itemCode}>SKU: {item.itemCode}</Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>규격</Text><Text style={styles.detailValue}>{item.specification}</Text></View>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>수량</Text><Text style={[styles.detailValue, styles.quantityValue]}>{item.quantity} 개</Text></View>
          <View style={styles.detailItemFull}><Text style={styles.detailLabel}>거래처</Text><Text style={styles.detailValue}>{item.companyName} ({item.companyCode})</Text></View>
          <View style={styles.detailItemFull}><Text style={styles.detailLabel}>예정일시</Text><Text style={styles.detailValue}>{formatDateTime(item.scheduledDateTime)}</Text></View>
          {item.notes && <View style={styles.detailItemFull}><Text style={styles.detailLabel}>비고</Text><Text style={styles.detailValue}>{item.notes}</Text></View>}
        </View>
      </View>
    );
  };

  if (isLoading && !requests) {
    return <SafeAreaView style={styles.container}><LoadingSpinner /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="입출고 요청" 
        subtitle="요청한 입출고 승인/거절 현황" 
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
            placeholder="품목명, 코드, 거래처 검색..."
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
        data={filteredRequests}
        renderItem={renderRequestItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery || activeFilter !== 'all' ? '조건에 맞는 요청이 없습니다.' : '입출고 요청이 없습니다.'}
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
  requestCard: {
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
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SIZES.sm,
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
  itemInfo: { marginBottom: SIZES.md },
  itemName: { fontSize: SIZES.fontLG, fontWeight: 'bold', color: COLORS.textPrimary },
  itemCode: { fontSize: SIZES.fontSM, color: COLORS.textSecondary },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.sm,
  },
  detailItem: { flex: 1, minWidth: '45%' },
  detailItemFull: { width: '100%' },
  detailLabel: { fontSize: SIZES.fontXS, color: COLORS.textMuted, marginBottom: 2 },
  detailValue: { fontSize: SIZES.fontSM, color: COLORS.textPrimary, fontWeight: '500' },
  quantityValue: { color: COLORS.primary, fontWeight: 'bold' },
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