import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { toast } from 'sonner-native';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import CollapsibleSection from '../components/CollapsibleSection';
import { COLORS, SIZES } from '../constants';
import { InventoryItem } from '../types/inout';
import { fetchInventoryData } from '../lib/api';

export default function InventoryScreen() {
  const navigation = useNavigation();
  const { data: inventoryItems, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inventoryData'],
    queryFn: fetchInventoryData,
  });
  
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    if (inventoryItems) {
      let filtered = [...inventoryItems];
      
      if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(item =>
          item.name.toLowerCase().includes(lowercasedQuery) ||
          item.sku.toLowerCase().includes(lowercasedQuery) ||
          item.specification.toLowerCase().includes(lowercasedQuery)
        );
      }
      
      setFilteredInventory(filtered.sort((a, b) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime()));
    }
  }, [inventoryItems, searchQuery]);

  const summary = useMemo(() => {
    if (!filteredInventory) return { total: 0, inbound: 0, outbound: 0, lowStock: 0 };
    return {
      total: filteredInventory.reduce((sum, item) => sum + item.quantity, 0),
      inbound: filteredInventory.reduce((sum, item) => sum + item.inboundScheduled, 0),
      outbound: filteredInventory.reduce((sum, item) => sum + item.outboundScheduled, 0),
      lowStock: filteredInventory.filter(item => item.status === '부족' || item.status === '위험').length,
    };
  }, [filteredInventory]);

  const getStatusStyle = (status: InventoryItem['status']) => {
    switch (status) {
      case '정상': return { color: COLORS.success, label: '정상' };
      case '부족': return { color: COLORS.warning, label: '부족' };
      case '위험': return { color: COLORS.error, label: '위험' };
      default: return { color: COLORS.textMuted, label: '알 수 없음' };
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return 'N/A';
    }
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderInventoryItem = ({ item, index }: { item: InventoryItem, index: number }) => {
    const statusStyle = getStatusStyle(item.status);
    return (
      <View style={styles.inventoryItem}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemIndex}>{index + 1}</Text>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
          </View>
        </View>
        
        <View style={styles.detailGrid}>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>규격</Text><Text style={styles.detailValue}>{item.specification}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>현재고</Text><Text style={[styles.detailValue, styles.quantityValue]}>{item.quantity}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>입고예정</Text><Text style={[styles.detailValue, styles.inboundValue]}>{item.inboundScheduled}</Text></View>
          <View style={styles.detailRow}><Text style={styles.detailLabel}>출고예정</Text><Text style={[styles.detailValue, styles.outboundValue]}>{item.outboundScheduled}</Text></View>
        </View>
        <Text style={styles.dateText}>최종 업데이트: {formatDateTime(item.lastUpdate)}</Text>
      </View>
    );
  };

  if (isLoading && !inventoryItems) {
    return <SafeAreaView style={styles.container}><LoadingSpinner /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="재고 현황" 
        subtitle="실시간 재고 현황" 
        showBack
        rightComponent={
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setIsSearchVisible(!isSearchVisible)}>
              <Ionicons name={isSearchVisible ? "close" : "search"} size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {isSearchVisible && (
        <View style={styles.toolbar}>
          <SearchBar placeholder="품목명, SKU, 규격 검색..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      )}

      <CollapsibleSection title="재고 요약" isCollapsed={isSearchVisible}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Ionicons name="cube-outline" size={22} color={COLORS.primary} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>총 재고</Text>
                <Text style={styles.summaryValue}>{summary.total.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.cardSeparator} />
            <View style={styles.summaryItem}>
              <Ionicons name="warning-outline" size={22} color={COLORS.warning} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>부족 재고</Text>
                <Text style={styles.summaryValue}>{summary.lowStock}</Text>
              </View>
            </View>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-down-circle-outline" size={22} color={COLORS.success} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>입고대기</Text>
                <Text style={styles.summaryValue}>{summary.inbound.toLocaleString()}</Text>
              </View>
            </View>
            <View style={styles.cardSeparator} />
            <View style={styles.summaryItem}>
              <Ionicons name="arrow-up-circle-outline" size={22} color={COLORS.error} />
              <View style={styles.summaryTextContainer}>
                <Text style={styles.summaryLabel}>출고예정</Text>
                <Text style={styles.summaryValue}>{summary.outbound.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        </View>
      </CollapsibleSection>

      <FlatList
        data={filteredInventory}
        renderItem={renderInventoryItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="file-tray-stacked-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>{searchQuery ? '검색 결과가 없습니다.' : '재고 정보가 없습니다.'}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerButtons: { 
    flexDirection: 'row', 
    gap: SIZES.xs 
  },
  headerButton: { 
    padding: SIZES.sm,
    position: 'relative',
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radius,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  toolbar: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.surface,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
    gap: SIZES.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSeparator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.sm,
  },
  summaryTextContainer: {
    marginLeft: SIZES.sm,
  },
  summaryLabel: { 
    fontSize: SIZES.fontSM, 
    color: COLORS.textSecondary, 
  },
  summaryValue: { 
    fontSize: SIZES.fontLG, 
    fontWeight: 'bold', 
    color: COLORS.textPrimary 
  },
  listContainer: { padding: SIZES.md },
  inventoryItem: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
    paddingBottom: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemIndex: {
    fontSize: SIZES.fontSM,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginRight: SIZES.md,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: SIZES.fontLG, fontWeight: 'bold', color: COLORS.textPrimary },
  itemSku: { fontSize: SIZES.fontSM, color: COLORS.textSecondary },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius,
    marginLeft: SIZES.sm,
  },
  statusText: { fontSize: SIZES.fontXS, fontWeight: 'bold' },
  detailGrid: { gap: SIZES.xs, marginBottom: SIZES.sm },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  detailLabel: { fontSize: SIZES.fontSM, color: COLORS.textSecondary },
  detailValue: { fontSize: SIZES.fontSM, color: COLORS.textPrimary, fontWeight: '500' },
  quantityValue: { fontWeight: 'bold', color: COLORS.primary },
  inboundValue: { fontWeight: 'bold', color: COLORS.success },
  outboundValue: { fontWeight: 'bold', color: COLORS.error },
  dateText: {
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SIZES.md,
    paddingTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
