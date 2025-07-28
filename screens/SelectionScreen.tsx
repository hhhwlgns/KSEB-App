import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import { COLORS, SIZES } from '../constants';
import { Ionicons } from '@expo/vector-icons';
import { useWarehouseForm } from '../context/WarehouseFormContext';
import { Product, Client } from '../types';

type Item = Product | Client;

type SelectionScreenParams = {
  title: string;
  items: Item[];
  returnKey: 'selectedProduct' | 'selectedClient';
};

type SelectionScreenRouteProp = RouteProp<{ params: SelectionScreenParams }, 'params'>;

export default function SelectionScreen() {
  const navigation = useNavigation();
  const route = useRoute<SelectionScreenRouteProp>();
  const { title, items = [], returnKey } = route.params;
  const { setFieldValue } = useWarehouseForm();

  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }
    const lowercasedQuery = searchQuery.toLowerCase();
    return items.filter(item => 
      Object.values(item).some(value => 
        String(value).toLowerCase().includes(lowercasedQuery)
      )
    );
  }, [items, searchQuery]);

  const handleSelect = (item: Item) => {
    setFieldValue(returnKey, item);
    navigation.goBack();
  };

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => handleSelect(item)}>
      <View style={styles.itemContent}>
        <Ionicons name="cube-outline" size={24} color={COLORS.primary} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemName}>{item.name}</Text>
          {'code' in item && <Text style={styles.itemSubText}>코드: {item.code}</Text>}
          {'representative' in item && <Text style={styles.itemSubText}>대표자: {item.representative}</Text>}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title={title} showBack />
      <View style={styles.searchContainer}>
        <SearchBar
          placeholder="검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchContainer: {
    padding: SIZES.md,
    backgroundColor: COLORS.surface,
  },
  listContainer: {
    padding: SIZES.md,
  },
  itemContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusMD,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
    flex: 1,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: SIZES.fontMD,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  itemSubText: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.xxl,
  },
  emptyText: {
    fontSize: SIZES.fontMD,
    color: COLORS.textMuted,
  },
});
