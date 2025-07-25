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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { COLORS, SIZES } from '../constants';
import { Product } from '../types';
import { getProducts } from '../lib/api';

export default function ProductListScreen() {
  const navigation = useNavigation();
  const { data: products, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
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

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR') + '원';
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productItem} activeOpacity={0.7}>
      <View style={styles.productHeader}>
        <Text style={styles.productCode}>{item.code}</Text>
        <Text style={styles.productGroup}>{item.group}</Text>
      </View>
      <Text style={styles.productName}>{item.name}</Text>
      <View style={styles.productDetails}>
        <Text style={styles.productDetail}>규격: {item.specification}</Text>
        <Text style={styles.productDetail}>바코드: {item.barcode}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>입고단가: <Text style={styles.inPrice}>{formatPrice(item.inPrice)}</Text></Text>
          <Text style={styles.priceLabel}>출고단가: <Text style={styles.outPrice}>{formatPrice(item.outPrice)}</Text></Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !filteredProducts.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="품목 목록" 
          subtitle="등록된 품목을 관리하세요" 
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
        title="품목 목록" 
        subtitle="등록된 품목을 관리하세요" 
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
          placeholder="제품 검색..."
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
        onPress={() => navigation.navigate('ProductForm' as never)}
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
  content: {
    flex: 1,
  },
  listContainer: {
    padding: SIZES.md,
    paddingBottom: 80, // FAB 공간 확보
  },
  productItem: {
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
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  productCode: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSM,
    marginRight: SIZES.sm,
  },
  productGroup: {
    fontSize: SIZES.fontSM,
    fontWeight: '500',
    color: COLORS.secondary,
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSM,
  },
  productName: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.sm,
  },
  productDetails: {
    gap: SIZES.xs,
  },
  productDetail: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  priceContainer: {
    marginTop: SIZES.xs,
  },
  priceLabel: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  inPrice: {
    color: COLORS.success,
    fontWeight: '600',
  },
  outPrice: {
    color: COLORS.primary,
    fontWeight: '600',
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