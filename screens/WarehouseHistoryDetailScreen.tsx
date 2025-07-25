import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '../components/Header';
import { COLORS, SIZES } from '../constants';

// TODO: Get type from types/index.ts
// type WarehouseHistory = {
//   id: string;
//   date: string;
//   type: '입고' | '출고';
//   productName: string;
//   quantity: number;
//   manager: string;
//   from: string;
//   to: string;
// };

export default function WarehouseHistoryDetailScreen({ route }) {
  const { item } = route.params; 

  return (
    <SafeAreaView style={styles.container}>
      <Header title="입출고 내역 상세" showBack />
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>{item.productName}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>상태:</Text>
            <Text style={[styles.value, item.type === '입고' ? styles.inbound : styles.outbound]}>
              {item.type}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>수량:</Text>
            <Text style={styles.value}>{item.quantity}개</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>처리일:</Text>
            <Text style={styles.value}>{item.date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>담당자:</Text>
            <Text style={styles.value}>{item.manager}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>출고지:</Text>
            <Text style={styles.value}>{item.from}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>입고지:</Text>
            <Text style={styles.value}>{item.to}</Text>
          </View>
        </View>
      </View>
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
    padding: SIZES.padding,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: SIZES.fontXL,
    fontWeight: 'bold',
    marginBottom: SIZES.margin,
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.padding / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  label: {
    fontSize: SIZES.fontLG,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: SIZES.fontLG,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  inbound: {
    color: COLORS.primary,
  },
  outbound: {
    color: COLORS.accent,
  },
});
