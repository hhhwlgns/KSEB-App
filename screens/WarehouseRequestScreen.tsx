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
import { InOutRequest } from '../types/inout';
import { fetchInOutRequests } from '../lib/api';

const FILTER_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '입고', value: 'INBOUND' },
  { label: '출고', value: 'OUTBOUND' },
];

export default function WarehouseRequestScreen() {
  const navigation = useNavigation();
  const { data: requests, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inOutRequests'],
    queryFn: fetchInOutRequests,
  });

  const [filteredRequests, setFilteredRequests] = useState<InOutRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchVisible, setSearchVisible] = useState(false);

  const todaySummary = useMemo(() => {
    if (!requests) return { total: 0, inbound: 0, outbound: 0 };
    const today = new Date().toISOString().split('T')[0];
    
    const todayRequests = requests.filter(item => item.expectedDate === today);

    return {
      total: todayRequests.length,
      inbound: todayRequests.filter(item => item.type === 'INBOUND').length,
      outbound: todayRequests.filter(item => item.type === 'OUTBOUND').length,
    };
  }, [requests]);

  useEffect(() => {
    if (requests) {
      let filtered = [...requests];
      
      if (activeFilter !== 'all') {
        filtered = filtered.filter(item => item.type === activeFilter);
      }

      if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(item => 
          (item.itemName || '').toLowerCase().includes(lowercasedQuery) ||
          (item.itemCode || '').toLowerCase().includes(lowercasedQuery) ||
          (item.companyName || '').toLowerCase().includes(lowercasedQuery)
        );
      }
      
      filtered.sort((a, b) => new Date(b.expectedDate).getTime() - new Date(a.expectedDate).getTime());

      setFilteredRequests(filtered);
    }
  }, [requests, searchQuery, activeFilter]);

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return 'N/A';
    return dateTimeString;
  };

  const renderRequestItem = ({ item }: { item: InOutRequest }) => {
    const isOutbound = item.type === 'OUTBOUND';

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
            <Ionicons name={'time-outline'} size={16} color={COLORS.statusPending} />
            <Text style={[styles.statusText, { color: COLORS.statusPending }]}>승인 대기</Text>
          </View>
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.itemName}</Text>
          <Text style={styles.itemCode}>SKU: {item.itemCode}</Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}><Text style={styles.detailLabel}>수량</Text><Text style={[styles.detailValue, styles.quantityValue]}>{item.quantity} 개</Text></View>
          <View style={styles.detailItemFull}><Text style={styles.detailLabel}>거래처</Text><Text style={styles.detailValue}>{item.companyName} ({item.companyCode})</Text></View>
          <View style={styles.detailItemFull}><Text style={styles.detailLabel}>예정일</Text><Text style={styles.detailValue}>{formatDateTime(item.expectedDate)}</Text></View>
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

      <CollapsibleSection title="오늘 요약 및 필터" isCollapsed={searchVisible}>
        <View style={styles.collapsibleContent}>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <Ionicons name="file-tray-full-outline" size={24} color={COLORS.primary} />
              <Text style={styles.summaryValue}>{todaySummary.total}</Text>
              <Text style={styles.summaryLabel}>총 요청</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="time-outline" size={24} color={COLORS.statusPending} />
              <Text style={styles.summaryValue}>{todaySummary.pending}</Text>
              <Text style={styles.summaryLabel}>승인 대기</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color={COLORS.statusCompleted} />
              <Text style={styles.summaryValue}>{todaySummary.completed}</Text>
              <Text style={styles.summaryLabel}>처리 완료</Text>
            </View>
          </View>
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
        </View>
      </CollapsibleSection>

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