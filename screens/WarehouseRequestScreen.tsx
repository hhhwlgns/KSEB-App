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

const FILTER_OPTIONS = {
  status: [
    { label: '전체', value: '' },
    { label: '승인 대기', value: 'PENDING' },
    { label: '처리 완료', value: 'COMPLETED' },
  ],
  type: [
    { label: '전체', value: '' },
    { label: '입고', value: 'IN' },
    { label: '출고', value: 'OUT' },
  ],
};

export default function WarehouseRequestScreen() {
  const navigation = useNavigation();
  const { data: requests, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['warehouseRequests'],
    queryFn: getWarehouseRequests,
  });

  const [filteredRequests, setFilteredRequests] = useState<WarehouseRequestItem[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    if (requests) {
      applyFilters(requests, selectedStatus, selectedType, searchQuery);
    } else {
      setFilteredRequests([]);
    }
  }, [requests, selectedStatus, selectedType, searchQuery]);

  const applyFilters = (
    data: WarehouseRequestItem[],
    status: string,
    type: string,
    query: string
  ) => {
    let filtered = [...data];

    if (status === 'PENDING') {
      filtered = filtered.filter(item => item.status === 'PENDING');
    } else if (status === 'COMPLETED') {
      filtered = filtered.filter(item => 
        item.status === 'APPROVED' || item.status === 'REJECTED'
      );
    }

    if (type) {
      filtered = filtered.filter(item => item.type === type);
    }

    if (query.trim()) {
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase()) ||
        item.client.toLowerCase().includes(query.toLowerCase()) ||
        item.location.toLowerCase().includes(query.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(query.toLowerCase()))
      );
    }

    setFilteredRequests(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return COLORS.statusPending;
      case 'APPROVED': return COLORS.statusApproved;
      case 'REJECTED': return COLORS.statusRejected;
      default: return COLORS.textMuted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return '승인 대기';
      case 'APPROVED': return '승인';
      case 'REJECTED': return '거절';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return 'time';
      case 'APPROVED': return 'checkmark-circle';
      case 'REJECTED': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return `어제 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (diffDays <= 7) {
      return `${diffDays}일 전`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
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

  const renderRequestItem = ({ item }: { item: WarehouseRequestItem }) => (
    <TouchableOpacity style={styles.requestCard} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <Ionicons
            name={item.type === 'IN' ? 'arrow-down' : 'arrow-up'}
            size={16}
            color={item.type === 'IN' ? COLORS.success : COLORS.error}
          />
          <Text style={[
            styles.typeText,
            { color: item.type === 'IN' ? COLORS.success : COLORS.error }
          ]}>
            {item.type === 'IN' ? '입고' : '출고'} 요청
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <Ionicons
            name={getStatusIcon(item.status) as any}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      
      <Text style={styles.productName}>{item.productName}</Text>
      
      <View style={styles.requestDetails}>
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
      
      <View style={styles.cardFooter}>
        <Text style={styles.dateText}>요청일: {formatDate(item.createdAt)}</Text>
        {item.status !== 'PENDING' && (
          <Text style={styles.processedText}>
            처리일: {formatDate(item.updatedAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const pendingCount = requests?.filter(item => item.status === 'PENDING').length ?? 0;
  const completedCount = requests?.filter(item => 
    item.status === 'APPROVED' || item.status === 'REJECTED'
  ).length ?? 0;

  if (isLoading && !requests) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="입출고 요청" 
          subtitle="요청한 입출고 승인/거절 현황" 
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
        title="입출고 요청" 
        subtitle="요청한 입출고 승인/거절 현황" 
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
          placeholder="요청 검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      )}

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Ionicons name="time" size={20} color={COLORS.statusPending} />
          <Text style={styles.summaryCount}>{pendingCount}</Text>
          <Text style={styles.summaryLabel}>승인 대기</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="checkmark-done" size={20} color={COLORS.statusCompleted} />
          <Text style={styles.summaryCount}>{completedCount}</Text>
          <Text style={styles.summaryLabel}>처리 완료</Text>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <Text style={styles.filterTitle}>상태</Text>
        {renderFilterChips(FILTER_OPTIONS.status, selectedStatus, setSelectedStatus)}
        
        <Text style={styles.filterTitle}>유형</Text>
        {renderFilterChips(FILTER_OPTIONS.type, selectedType, setSelectedType)}
      </View>

      <View style={styles.content}>
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery || selectedStatus || selectedType 
                ? '조건에 맞는 요청이 없습니다.' 
                : '입출고 요청이 없습니다.'
              }
            </Text>
            <Text style={styles.emptySubtext}>
              앱에서 입출고 등록 시 자동으로 승인 요청이 생성됩니다.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredRequests}
            renderItem={renderRequestItem}
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
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.md,
    gap: SIZES.md,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryCount: {
    fontSize: SIZES.fontXL,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginVertical: SIZES.xs,
  },
  summaryLabel: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
    textAlign: 'center',
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
  requestCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.lg,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
  },
  typeText: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.xs,
    backgroundColor: COLORS.surfaceHover,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSM,
  },
  statusText: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
  },
  productName: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.md,
  },
  requestDetails: {
    gap: SIZES.xs,
    marginBottom: SIZES.md,
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
    fontSize: SIZES.fontSM,
    color: COLORS.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  notesValue: {
    fontSize: SIZES.fontSM,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: SIZES.sm,
    gap: SIZES.xs,
  },
  dateText: {
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
  },
  processedText: {
    fontSize: SIZES.fontXS,
    color: COLORS.textSecondary,
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
  emptySubtext: {
    fontSize: SIZES.fontSM,
    color: COLORS.textMuted,
    marginTop: SIZES.sm,
    textAlign: 'center',
    opacity: 0.7,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});