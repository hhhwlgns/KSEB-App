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

const FILTER_OPTIONS = {
  type: [
    { label: '전체', value: '' },
    { label: '입고', value: 'IN' },
    { label: '출고', value: 'OUT' },
  ],
  status: [
    { label: '전체', value: '' },
    { label: '예약', value: 'PENDING' },
    { label: '진행중', value: 'IN_PROGRESS' },
  ],
};

export default function WarehouseCurrentScreen() {
  const navigation = useNavigation();
  const { data: items, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['warehouseCurrent'],
    queryFn: getWarehouseCurrent,
  });

  const [filteredItems, setFilteredItems] = useState<WarehouseItem[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    if (items) {
      applyFilters(items, selectedType, selectedStatus, searchQuery);
    } else {
      setFilteredItems([]);
    }
  }, [items, selectedType, selectedStatus, searchQuery]);

  const applyFilters = (
    data: WarehouseItem[],
    type: string,
    status: string,
    query: string
  ) => {
    let filtered = [...data];

    if (type) filtered = filtered.filter(item => item.type === type);
    if (status) filtered = filtered.filter(item => item.status === status);
    if (query.trim()) {
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.client.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return COLORS.statusPending;
      case 'IN_PROGRESS': return COLORS.statusInProgress;
      case 'COMPLETED': return COLORS.statusCompleted;
      default: return COLORS.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return '예약';
      case 'IN_PROGRESS': return '진행중';
      case 'COMPLETED': return '완료';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const renderFilterChips = (
    options: Array<{ label: string; value: string }>,
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScrollView}
      contentContainerStyle={styles.filterContainer}
    >
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.filterChip,
            selectedValue === option.value && styles.filterChipActive,
          ]}
          onPress={() => onSelect(option.value)}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedValue === option.value && styles.filterChipTextActive,
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderWarehouseItem = ({ item }: { item: WarehouseItem }) => (
    <TouchableOpacity style={styles.itemCard} activeOpacity={0.7}>
      <View style={styles.itemHeader}>
        <View style={styles.itemType}>
          <Ionicons
            name={item.type === 'IN' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={item.type === 'IN' ? COLORS.success : COLORS.error}
          />
          <Text style={[
            styles.itemTypeText,
            { color: item.type === 'IN' ? COLORS.success : COLORS.error }
          ]}>
            {item.type === 'IN' ? '입고' : '출고'}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.productName}>{item.productName}</Text>
      
      <View style={styles.itemDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>카테고리:</Text>
          <Text style={styles.detailValue}>{item.category}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>수량:</Text>
          <Text style={styles.quantityValue}>{item.quantity}개</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>위치:</Text>
          <Text style={styles.detailValue}>{item.location}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>거래처:</Text>
          <Text style={styles.detailValue}>{item.client}</Text>
        </View>
        {item.notes && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>비고:</Text>
            <Text style={styles.notesValue}>{item.notes}</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  if (isLoading && !items) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="입출고 현황" 
          subtitle="현재 진행중인 입출고 목록" 
          showBack 
          rightComponent={
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setSearchVisible(!searchVisible)}
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
        title="입출고 현황" 
        subtitle="현재 진행중인 입출고 목록" 
        showBack 
        rightComponent={
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setSearchVisible(!searchVisible)}
          >
            <Ionicons name="search" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {searchVisible && (
        <SearchBar
          placeholder="창고 검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      )}

      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>유형</Text>
        {renderFilterChips(FILTER_OPTIONS.type, selectedType, setSelectedType)}
        
        <Text style={styles.filterTitle}>상태</Text>
        {renderFilterChips(FILTER_OPTIONS.status, selectedStatus, setSelectedStatus)}
      </View>

      <View style={styles.content}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery || selectedType || selectedStatus 
                ? '조건에 맞는 입출고 항목이 없습니다.' 
                : '현재 진행중인 입출고가 없습니다.'
              }
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderWarehouseItem}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

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
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchButton: {
    padding: SIZES.sm,
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterTitle: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: SIZES.lg,
    marginBottom: SIZES.sm,
    marginTop: SIZES.sm,
  },
  filterScrollView: {
    marginBottom: SIZES.sm,
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
    paddingBottom: 80, // FAB 공간 확보
  },
  itemCard: {
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
    flex: 1,
  },
  detailValue: {
    fontSize: SIZES.fontSM,
    color: COLORS.textPrimary,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  quantityValue: {
    fontSize: SIZES.fontSM,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  notesValue: {
    fontSize: SIZES.fontSM,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    flex: 2,
    textAlign: 'right',
  },
  dateText: {
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});