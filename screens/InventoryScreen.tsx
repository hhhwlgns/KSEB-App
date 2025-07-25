import React, { useState, useEffect } from 'react';
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

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES } from '../constants';
import { InventoryItem } from '../types';
import { getInventory } from '../lib/api';

export default function InventoryScreen() {
  const { data: inventory, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });
  
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    if (inventory) {
      setFilteredInventory(inventory);
    } else {
      setFilteredInventory([]);
    }
  }, [inventory]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!inventory) return;

    if (!query.trim()) {
      setFilteredInventory(inventory);
      return;
    }

    const filtered = inventory.filter(
      (item) =>
        item.productName.toLowerCase().includes(query.toLowerCase()) ||
        item.productCode.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase()) ||
        (item.client && item.client.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredInventory(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getQuantityColor = (quantity: number) => {
    if (quantity <= 5) return COLORS.error;
    if (quantity <= 20) return COLORS.warning;
    return COLORS.success;
  };

  const getQuantityStatus = (quantity: number) => {
    if (quantity <= 5) return '부족';
    if (quantity <= 20) return '주의';
    return '충분';
  };

  const calculateTotalValue = () => {
    return filteredInventory.reduce((total, item) => total + item.quantity, 0);
  };

  const calculateLowStock = () => {
    return filteredInventory.filter(item => item.quantity <= 5).length;
  };

  const renderInventoryItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity style={styles.inventoryItem} activeOpacity={0.7}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.productCode}>{item.productCode}</Text>
          <Text style={styles.categoryBadge}>{item.category}</Text>
        </View>
        <View style={[
          styles.quantityBadge,
          { backgroundColor: getQuantityColor(item.quantity) + '20' }
        ]}>
          <Text style={[
            styles.quantityStatus,
            { color: getQuantityColor(item.quantity) }
          ]}>
            {getQuantityStatus(item.quantity)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.productName}>{item.productName}</Text>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>재고 수량:</Text>
          <Text style={[
            styles.quantityValue,
            { color: getQuantityColor(item.quantity) }
          ]}>
            {item.quantity}개
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>보관 위치:</Text>
          <Text style={styles.detailValue}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>거래처:</Text>
          <Text style={styles.detailValue}>{item.client}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>최종 업데이트:</Text>
          <Text style={styles.dateValue}>{formatDate(item.lastUpdated)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !inventory) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="재고 관리" 
          subtitle="재고 현황을 확인하고 관리하세요" 
          rightComponent={
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setIsSearchVisible(!isSearchVisible)}
            >
              <Ionicons name="search" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          }
        />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="재고 관리" 
        subtitle="재고 현황을 확인하고 관리하세요" 
        rightComponent={
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setIsSearchVisible(!isSearchVisible)}
          >
            <Ionicons name="search" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {isSearchVisible && (
        <SearchBar
          placeholder="재고 검색..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      )}

      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Ionicons name="cube" size={24} color={COLORS.primary} />
          <Text style={styles.summaryValue}>{calculateTotalValue()}</Text>
          <Text style={styles.summaryLabel}>총 재고량</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="warning" size={24} color={COLORS.error} />
          <Text style={styles.summaryValue}>{calculateLowStock()}</Text>
          <Text style={styles.summaryLabel}>부족 품목</Text>
        </View>
        <View style={styles.summaryCard}>
          <Ionicons name="list" size={24} color={COLORS.success} />
          <Text style={styles.summaryValue}>{filteredInventory.length}</Text>
          <Text style={styles.summaryLabel}>품목 수</Text>
        </View>
      </View>

      <View style={styles.content}>
        {filteredInventory.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다.' : '재고 정보가 없습니다.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                재고 목록 ({filteredInventory.length}개 품목)
              </Text>
            </View>
            <FlatList
              data={filteredInventory}
              renderItem={renderInventoryItem}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchButton: {
    padding: SIZES.sm,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  listHeader: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listTitle: {
    fontSize: SIZES.fontLG,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  listContainer: {
    padding: SIZES.md,
  },
  inventoryItem: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  productCode: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSM,
  },
  categoryBadge: {
    fontSize: SIZES.fontSM,
    fontWeight: '500',
    color: COLORS.secondary,
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSM,
  },
  quantityBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSM,
  },
  quantityStatus: {
    fontSize: SIZES.fontXS,
    fontWeight: '600',
  },
  productName: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  itemDetails: {
    gap: SIZES.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: SIZES.fontSM,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  quantityValue: {
    fontSize: SIZES.fontMD,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'right',
  },
  dateValue: {
    fontSize: SIZES.fontSM,
    color: COLORS.textMuted,
    flex: 1,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SIZES.xl,
  },
  emptyText: {
    fontSize: SIZES.fontMD,
    color: COLORS.textMuted,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
});