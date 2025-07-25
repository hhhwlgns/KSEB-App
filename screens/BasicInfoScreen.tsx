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

export default function BasicInfoScreen() {
  const navigation = useNavigation();

  const menuItems = [
    {
      title: '거래처 관리',
      subtitle: '거래처 정보를 관리합니다',
      icon: 'business',
      onPress: () => navigation.navigate('ClientList' as never),
      color: COLORS.primary,
    },
    {
      title: '품목 관리',
      subtitle: '품목 정보를 관리합니다',
      icon: 'cube',
      onPress: () => navigation.navigate('ProductList' as never),
      color: COLORS.secondary,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>기초 정보</Text>
        <Text style={styles.subtitle}>거래처와 품목 정보를 관리하세요</Text>
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