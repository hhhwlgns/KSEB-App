import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../constants';

export default function WarehouseScreen() {
  const navigation = useNavigation();

  const menuItems = [
    {
      title: '입출고 현황',
      subtitle: '현재 예약 또는 진행중인 입출고 목록',
      icon: 'time',
      onPress: () => navigation.navigate('WarehouseCurrent' as never),
      color: COLORS.statusInProgress,
    },
    {
      title: '입출고 내역',
      subtitle: '완료된 입출고 내역 리스트',
      icon: 'checkmark-circle',
      onPress: () => navigation.navigate('WarehouseHistory' as never),
      color: COLORS.statusCompleted,
    },
    {
      title: '입출고 요청',
      subtitle: '요청한 입출고 승인/거절 현황',
      icon: 'document-text',
      onPress: () => navigation.navigate('WarehouseRequest' as never),
      color: COLORS.statusPending,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>입출고 관리</Text>
        <Text style={styles.subtitle}>입출고 현황 및 내역을 관리하세요</Text>
      </View>

      <View style={styles.content}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon as any} size={24} color="white" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingVertical: SIZES.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: SIZES.fontXXL,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  subtitle: {
    fontSize: SIZES.fontMD,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusLG,
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: SIZES.radiusMD,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  textContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: SIZES.fontLG,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  menuSubtitle: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
  },
});