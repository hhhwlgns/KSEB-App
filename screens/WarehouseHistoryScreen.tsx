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
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES } from '../constants';
import { WarehouseHistoryItem } from '../types';
import { getWarehouseHistory } from '../lib/api';

const FILTER_OPTIONS = {
  type: [
    { label: '전체', value: '' },
    { label: '입고', value: 'IN' },
    { label: '출고', value: 'OUT' },
  ],
};

export default function WarehouseHistoryScreen() {
  const navigation = useNavigation();
  const { data: historyItems, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['warehouseHistory'],
    queryFn: getWarehouseHistory,
  });

  const [filteredItems, setFilteredItems] = useState<WarehouseHistoryItem[]>([]);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    if (historyItems) {
      applyFilters(historyItems, selectedType);
    } else {
      setFilteredItems([]);
    }
  }, [historyItems, selectedType]);

  const applyFilters = (data: WarehouseHistoryItem[], type: string) => {
    let filtered = [...data];
    if (type) {
      filtered = filtered.filter(item => item.type === type);
    }
    setFilteredItems(filtered);
  };

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderFilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScrollView}
      contentContainerStyle={styles.filterContainer}
    >
      {FILTER_OPTIONS.type.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.filterChip,
            selectedType === option.value && styles.filterChipActive,
          ]}
          onPress={() => handleTypeFilter(option.value)}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedType === option.value && styles.filterChipTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderHistoryItem = ({ item }: { item: WarehouseHistoryItem }) => (
    <TouchableOpacity 
      style={styles.itemCard} 
      activeOpacity={0.7}
      onPress={() => navigation.navigate('WarehouseHistoryDetail', { item })}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemType}>
          <Ionicons
            name={item.type === 'IN' ? 'arrow-down-circle' : 'arrow-up-circle'}
            size={18}
            color={item.type === 'IN' ? COLORS.success : COLORS.error}
          />
          <Text style={[
            styles.itemTypeText,
            { color: item.type === 'IN' ? COLORS.success : COLORS.error }
          ]}>
            {item.type === 'IN' ? '입고 완료' : '출고 완료'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.statusCompleted + '20' }]}>
          <Text style={[styles.statusText, { color: COLORS.statusCompleted }]}>
            완료
          </Text>
        </View>
      </View>
      
      <Text style={styles.productName}>{item.productName}</Text>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>처리 수량:</Text>
          <Text style={styles.quantityValue}>{item.quantity}개</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>담당자:</Text>
          <Text style={styles.detailValue}>{item.manager}</Text>
        </View>
      </View>
      
      <Text style={styles.dateText}>완료일: {formatDate(item.completedAt)}</Text>
    </TouchableOpacity>
  );

  if (isLoading && !historyItems) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="입출고 내역" subtitle="완료된 입출고 내역" showBack />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="입출고 내역" subtitle="완료된 입출고 내역" showBack />

      <View style={styles.filtersContainer}>
        {renderFilterChips()}
      </View>

      <View style={styles.content}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {selectedType ? '조건에 맞는 내역이 없습니다.' : '완료된 입출고 내역이 없습니다.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderHistoryItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
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
  filtersContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SIZES.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScrollView: {
  },
  filterContainer: {
    paddingHorizontal: SIZES.lg,
    gap: SIZES.sm,
  },
  filterChip: {
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.radiusXL,
    backgroundColor: COLORS.surfaceHover,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: SIZES.fontSM,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: SIZES.md,
  },
  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  itemType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  itemTypeText: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSM,
  },
  statusText: {
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
    marginBottom: SIZES.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: SIZES.fontSM,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  quantityValue: {
    fontSize: SIZES.fontSM,
    color: COLORS.primary,
    fontWeight: '600',
  },
  dateText: {
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
    textAlign: 'right',
    marginTop: SIZES.sm,
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