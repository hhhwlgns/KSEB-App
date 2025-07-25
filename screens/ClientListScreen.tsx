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
import { Client } from '../types';
import { getClients } from '../lib/api';

export default function ClientListScreen() {
  const navigation = useNavigation();
  const { data: clients, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['clients'],
    queryFn: getClients,
  });

  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (clients) {
      setFilteredClients(clients);
    }
  }, [clients]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!clients) return;

    if (!query.trim()) {
      setFilteredClients(clients);
      return;
    }

    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query.toLowerCase()) ||
        client.code.toLowerCase().includes(query.toLowerCase()) ||
        (client.representative && client.representative.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredClients(filtered);
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    <TouchableOpacity style={styles.clientItem} activeOpacity={0.7}>
      <View style={styles.clientHeader}>
        <Text style={styles.clientCode}>{item.code}</Text>
        <Text style={styles.clientName}>{item.name}</Text>
      </View>
      <View style={styles.clientDetails}>
        <Text style={styles.clientDetail}>대표자: {item.representative}</Text>
        <Text style={styles.clientDetail}>전화: {item.phone}</Text>
        <Text style={styles.clientDetail}>이메일: {item.email}</Text>
        <Text style={styles.clientDetail}>주소: {item.address}</Text>
        {item.notes && (
          <Text style={styles.clientNotes}>비고: {item.notes}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading && !filteredClients.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="거래처 목록" 
          subtitle="등록된 거래처를 관리하세요" 
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
        title="거래처 목록" 
        subtitle="등록된 거래처를 관리하세요" 
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
          placeholder="거래처 검색..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      )}

      <View style={styles.content}>
        {filteredClients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 거래처가 없습니다.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredClients}
            renderItem={renderClientItem}
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
        onPress={() => navigation.navigate('ClientForm' as never)}
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
  clientItem: {
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
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.sm,
  },
  clientCode: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radiusSM,
    marginRight: SIZES.sm,
  },
  clientName: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  clientDetails: {
    gap: SIZES.xs,
  },
  clientDetail: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
  clientNotes: {
    fontSize: SIZES.fontSM,
    color: COLORS.textMuted,
    fontStyle: 'italic',
    marginTop: SIZES.xs,
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