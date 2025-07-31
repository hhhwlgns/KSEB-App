import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { getInventoryItemByBarcode } from '../lib/api';
import { COLORS, SIZES } from '../constants';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { InventoryItem } from '../types';

type ManualProcessRouteParams = {
  barcode: string;
};

export default function ManualProcessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { barcode } = route.params as ManualProcessRouteParams;

  const { data: item, isLoading, error, refetch } = useQuery<InventoryItem, Error>({
    queryKey: ['inventoryItem', barcode],
    queryFn: () => getInventoryItemByBarcode(barcode),
    enabled: !!barcode,
  });

  useEffect(() => {
    if (error) {
      Alert.alert('오류', error.message);
    }
  }, [error]);

  const handleAction = (type: 'inbound' | 'outbound') => {
    if (!item) return;
    
    navigation.navigate('WarehouseForm' as never, {
      type,
      product: {
        id: item.id,
        name: item.name,
        code: item.sku,
        specification: item.specification,
      },
      title: `${type === 'inbound' ? '수동 입고' : '수동 출고'} 등록`,
    } as never);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
          <Text style={styles.errorMessage}>데이터를 불러오는 데 실패했습니다.</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (item) {
      return (
        <View style={styles.content}>
          <View style={styles.itemInfoCard}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSku}>SKU: {item.sku}</Text>
            
            <View style={styles.separator} />

            <View style={styles.detailGrid}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>규격</Text>
                <Text style={styles.detailValue}>{item.specification}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>현재고</Text>
                <Text style={[styles.detailValue, styles.quantityValue]}>{item.quantity}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>위치</Text>
                <Text style={styles.detailValue}>{item.location}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.inboundButton]} 
              onPress={() => handleAction('inbound')}
            >
              <Ionicons name="arrow-down-circle-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>입고 등록</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.outboundButton]} 
              onPress={() => handleAction('outbound')}
            >
              <Ionicons name="arrow-up-circle-outline" size={24} color="white" />
              <Text style={styles.actionButtonText}>출고 등록</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="수동 처리" showBack />
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SIZES.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.lg,
  },
  errorMessage: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SIZES.md,
    textAlign: 'center',
  },
  errorDetail: {
    fontSize: SIZES.fontMD,
    color: COLORS.textSecondary,
    marginTop: SIZES.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SIZES.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.xl,
    paddingVertical: SIZES.md,
    borderRadius: SIZES.radius,
  },
  retryButtonText: {
    color: 'white',
    fontSize: SIZES.fontMD,
    fontWeight: 'bold',
  },
  itemInfoCard: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
  },
  itemName: {
    fontSize: SIZES.fontXL,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  itemSku: {
    fontSize: SIZES.fontMD,
    color: COLORS.textSecondary,
    marginTop: SIZES.xs,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SIZES.md,
  },
  detailGrid: {
    gap: SIZES.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: SIZES.fontMD,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  quantityValue: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SIZES.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.lg,
    borderRadius: SIZES.radiusLG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  inboundButton: {
    backgroundColor: COLORS.success,
  },
  outboundButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: 'white',
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    marginLeft: SIZES.sm,
  },
});
