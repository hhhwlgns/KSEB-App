import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner-native';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES } from '../constants';
import { Item } from '../types/item';
import { fetchItems, deleteItem } from '../lib/api';

export default function ProductListScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: items, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  const { mutate: removeItem } = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      toast.success('품목이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['items'] });
    },
    onError: (error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다.');
    },
  });

  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (items) {
      setFilteredItems(items);
    }
  }, [items]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!items) return;

    if (!query.trim()) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(
      (item) =>
        item.itemName.toLowerCase().includes(query.toLowerCase()) ||
        item.itemCode.toLowerCase().includes(query.toLowerCase()) ||
        (item.itemGroup || '').toLowerCase().includes(query.toLowerCase()) ||
        (item.spec || '').toLowerCase().includes(query.toLowerCase())
    );
    setFilteredItems(filtered);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      '품목 삭제',
      '정말로 이 품목을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          onPress: () => removeItem(id),
          style: 'destructive' 
        },
      ]
    );
  };

  const handleEdit = (item: Item) => {
    navigation.navigate('ProductForm', { item });
  };

  const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return price.toLocaleString('ko-KR') + '원';
  };

  const renderProductItem = ({ item }: { item: Item }) => (
    <TouchableOpacity style={styles.productItem} onPress={() => handleEdit(item)} activeOpacity={0.7}>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.itemName}</Text>
          <Text style={styles.productCode}>({item.itemCode})</Text>
        </View>
        <View style={styles.detailGrid}>
          <View style={styles.detailRow}>
            <Ionicons name="folder-outline" size={14} color={COLORS.textSecondary} style={styles.icon} />
            <Text style={styles.detailLabel}>품목그룹</Text>
            <Text style={styles.detailValue}>{item.itemGroup || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="options-outline" size={14} color={COLORS.textSecondary} style={styles.icon} />
            <Text style={styles.detailLabel}>규격</Text>
            <Text style={styles.detailValue}>{item.spec || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="cube-outline" size={14} color={COLORS.textSecondary} style={styles.icon} />
            <Text style={styles.detailLabel}>단위</Text>
            <Text style={styles.detailValue}>{item.unit || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="arrow-down-outline" size={14} color={COLORS.success} style={styles.icon} />
            <Text style={styles.detailLabel}>입고단가</Text>
            <Text style={styles.detailValue}>{formatPrice(item.unitPriceIn)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="arrow-up-outline" size={14} color={COLORS.primary} style={styles.icon} />
            <Text style={styles.detailLabel}>출고단가</Text>
            <Text style={styles.detailValue}>{formatPrice(item.unitPriceOut)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={(e) => { e.stopPropagation(); handleDelete(item.itemId); }}>
        <Ionicons name="trash-outline" size={22} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading && !items) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="품목 목록" 
          subtitle="등록된 품목을 관리하세요" 
          showBack 
          rightComponent={
            <TouchableOpacity style={styles.searchButton} onPress={() => setSearchVisible(!searchVisible)}>
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
        title="품목 목록" 
        subtitle="등록된 품목을 관리하세요" 
        showBack 
        rightComponent={
          <TouchableOpacity style={styles.searchButton} onPress={() => setSearchVisible(!searchVisible)}>
            <Ionicons name="search" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      {searchVisible && (
        <SearchBar
          placeholder="품목명, 코드, 그룹, 규격 검색..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      )}

      <View style={styles.content}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 품목이 없습니다.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.itemId.toString()}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ProductForm' as never)}
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
  content: { flex: 1 },
  listContainer: { padding: SIZES.md, paddingBottom: 80 },
  productItem: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.md,
    marginBottom: SIZES.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  productInfo: { flex: 1 },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SIZES.md,
  },
  productName: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  productCode: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  detailGrid: {
    marginBottom: SIZES.md,
    gap: SIZES.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: SIZES.sm,
  },
  detailLabel: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
    fontWeight: '600',
    width: 70, // 고정 너비 부여
  },
  detailValue: {
    fontSize: SIZES.fontSM,
    color: COLORS.textPrimary,
    flex: 1, // 남은 공간 차지
  },
  priceContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
    marginTop: SIZES.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SIZES.md,
  },
  priceBox: {
    flex: 1,
    alignItems: 'center',
    padding: SIZES.sm,
    borderRadius: SIZES.radius,
    backgroundColor: COLORS.background,
  },
  priceLabel: {
    fontSize: SIZES.fontXS,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: SIZES.fontMD,
    fontWeight: 'bold',
  },
  inPrice: { color: COLORS.success },
  outPrice: { color: COLORS.error },
  deleteButton: {
    padding: SIZES.sm,
    marginLeft: SIZES.sm,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});