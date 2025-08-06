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
import { Company } from '../types/company';
import { fetchCompanies, deleteCompany } from '../lib/api';

export default function ClientListScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: companies, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
  });

  const { mutate: removeCompany } = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      toast.success('거래처가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
    onError: (error) => {
      toast.error(error.message || '삭제 중 오류가 발생했습니다.');
    },
  });

  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (companies) {
      setFilteredCompanies(companies);
    }
  }, [companies]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!companies) return;

    if (!query.trim()) {
      setFilteredCompanies(companies);
      return;
    }

    const filtered = companies.filter(
      (company) =>
        company.companyName.toLowerCase().includes(query.toLowerCase()) ||
        company.companyCode.toLowerCase().includes(query.toLowerCase()) ||
        (company.contactPerson || '').toLowerCase().includes(query.toLowerCase()) ||
        (company.contactPhone || '').toLowerCase().includes(query.toLowerCase()) ||
        (company.contactEmail || '').toLowerCase().includes(query.toLowerCase())
    );
    setFilteredCompanies(filtered);
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      '거래처 삭제',
      '정말로 이 거래처를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          onPress: () => removeCompany(id),
          style: 'destructive' 
        },
      ]
    );
  };

  const handleEdit = (company: Company) => {
    // Company 타입을 Client 타입으로 변환
    const client = {
      id: company.companyId.toString(),
      code: company.companyCode,
      name: company.companyName,
      type: company.type?.includes('매입처') ? '매입처' : '납품처' as '매입처' | '납품처',
      representative: company.contactPerson || '',
      phone: company.contactPhone || '',
      email: company.contactEmail || '',
      address: company.address || '',
      notes: '',
      createdAt: new Date().toISOString(),
    };
    navigation.navigate('ClientForm', { client });
  };

  const renderClientItem = ({ item }: { item: Company }) => (
    <TouchableOpacity style={styles.clientItem} onPress={() => handleEdit(item)} activeOpacity={0.7}>
      <View style={styles.clientInfo}>
        <View style={styles.clientHeader}>
          <Text style={styles.clientName}>{item.companyName}</Text>
          <Text style={styles.clientCode}>({item.companyCode})</Text>
          <View style={styles.typeContainer}>
            {item.type && item.type.map((type, index) => (
              <View key={index} style={[styles.typeBadge, type === '매입처' ? styles.supplierBadge : styles.customerBadge]}>
                <Text style={[styles.typeText, type === '매입처' ? styles.supplierText : styles.customerText]}>{type}</Text>
              </View>
            ))}
          </View>
        </View>
        <View style={styles.clientDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.clientDetail}>{item.contactPerson || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.clientDetail}>{item.contactPhone || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.clientDetail}>{item.contactEmail || 'N/A'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.clientDetail} numberOfLines={1}>{item.address || 'N/A'}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={(e) => { e.stopPropagation(); handleDelete(item.companyId); }}>
        <Ionicons name="trash-outline" size={22} color={COLORS.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (isLoading && !companies) {
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
          placeholder="거래처, 코드, 대표자 검색..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      )}

      <View style={styles.content}>
        {filteredCompanies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {searchQuery ? '검색 결과가 없습니다.' : '등록된 거래처가 없습니다.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredCompanies}
            renderItem={renderClientItem}
            keyExtractor={(item) => item.companyId.toString()}
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
    paddingBottom: 80,
  },
  clientItem: {
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
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.md,
  },
  typeBadge: {
    paddingHorizontal: SIZES.sm,
    paddingVertical: 2,
    borderRadius: SIZES.radius,
    marginRight: SIZES.sm,
  },
  typeText: {
    fontSize: SIZES.fontXS,
    fontWeight: '600',
  },
  typeContainer: {
    flexDirection: 'row',
    marginLeft: SIZES.sm,
  },
  supplierBadge: {
    backgroundColor: '#E3F2FD',
  },
  customerBadge: {
    backgroundColor: '#E8F5E8',
  },
  supplierText: {
    color: '#1976D2',
  },
  customerText: {
    color: '#388E3C',
  },
  clientName: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  clientCode: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
    marginLeft: SIZES.xs,
  },
  clientDetails: {
    gap: SIZES.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.sm,
  },
  clientDetail: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
    flex: 1,
  },
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