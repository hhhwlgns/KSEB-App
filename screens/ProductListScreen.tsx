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
import { Product } from '../types';
import { getProducts, deleteProduct } from '../lib/api';

export default function ProductListScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: products, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const { mutate: removeProduct } = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success('품목이 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다.');
    },
  });

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (products) {
      setFilteredProducts(products);
    }
  }, [products]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!products) return;

    if (!query.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.code.toLowerCase().includes(query.toLowerCase()) ||
        product.group.toLowerCase().includes(query.toLowerCase()) ||
        (product.barcode && product.barcode.includes(query))
    );
    setFilteredProducts(filtered);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      '품목 삭제',
      '정말로 이 품목을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          onPress: () => removeProduct(id),
          style: 'destructive' 
        },
      ]
    );
  };

  const handleEdit = (product: Product) => {
    navigation.navigate('ProductForm', { product: product });
  };

  const formatPrice = (price: number) => {
    if (typeof price !== 'number') return 'N/A';
    return price.toLocaleString('ko-KR') + '원';
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productItem} onPress={() => handleEdit(item)} activeOpacity={0.7}>
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productCode}>({item.code})</Text>
        </View>
        <View style={styles.detailGrid}>
          <View style={styles.detailRow}>
            <Ionicons name="layers-outline" size={14} color={COLORS.textSecondary} style={styles.icon} />
            <Text style={styles.detailLabel}>품목그룹</Text>
            <Text style={styles.detailValue}>{item.group}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="barcode-outline" size={14} color={COLORS.textSecondary} style={styles.icon} />
            <Text style={styles.detailLabel}>바코드</Text>
            <Text style={styles.detailValue}>{item.barcode || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="options-outline" size={14} color={COLORS.textSecondary} style={styles.icon} />
            <Text style={styles.detailLabel}>규격</Text>
            <Text style={styles.detailValue}>{item.specification}</Text>
          </View>
        </View>
        <View style={styles.priceContainer}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>입고단가</Text>
            <Text style={[styles.priceValue, styles.inPrice]}>{formatPrice(item.inboundPrice)}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>출고단가</Text>
            <Text style={[styles.priceValue, styles.outPrice]}>{formatPrice(item.outboundPrice)}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={(e) => { e.stopPropagation(); handleDelete(item.id); }}>
        <Ionicons name="trash-outline" size={22} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading && !products) {
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
          placeholder="품목명, 코드, 그룹, 바코드 검색..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      )}

      <View style={styles.content}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 품목이 없습니다.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            renderItem={renderProductItem}
            keyExtractor={(item) => item.id}
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