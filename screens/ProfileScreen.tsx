import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { COLORS, SIZES } from '../constants';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: logout 
        },
      ]
    );
  };

  const menuItems = [
    {
      title: '프로필 정보',
      icon: 'person-outline',
      onPress: () => {},
    },
    {
      title: '사용자 관리',
      icon: 'people-outline',
      onPress: () => navigation.navigate('UserManagement' as never),
      adminOnly: true,
    },
    {
      title: '설정',
      icon: 'settings-outline',
      onPress: () => {},
    },
    {
      title: '도움말',
      icon: 'help-circle-outline',
      onPress: () => {},
    },
    {
      title: '앱 정보',
      icon: 'information-circle-outline',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>프로필</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={COLORS.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.fullName || '사용자'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <Text style={styles.userRole}>{user?.role || 'USER'}</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            (item.adminOnly && user?.role !== 'ADMIN') ? null : (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Ionicons name={item.icon as any} size={24} color={COLORS.textSecondary} />
                <Text style={styles.menuText}>{item.title}</Text>
                <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            )
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Smart WMS v1.0.0</Text>
          <Text style={styles.copyright}>© 2025 Smart WMS. All rights reserved.</Text>
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
  },
  content: {
    flex: 1,
    padding: SIZES.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusLG,
    marginBottom: SIZES.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  userEmail: {
    fontSize: SIZES.fontMD,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  userRole: {
    fontSize: SIZES.fontSM,
    color: COLORS.primary,
    fontWeight: '600',
  },
  menuSection: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    marginBottom: SIZES.lg,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuText: {
    flex: 1,
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
    marginLeft: SIZES.md,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    padding: SIZES.lg,
    borderRadius: SIZES.radiusLG,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginBottom: SIZES.lg,
  },
  logoutText: {
    fontSize: SIZES.fontMD,
    color: COLORS.error,
    fontWeight: '600',
    marginLeft: SIZES.sm,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  appVersion: {
    fontSize: SIZES.fontSM,
    color: COLORS.textSecondary,
    marginBottom: SIZES.xs,
  },
  copyright: {
    fontSize: SIZES.fontXS,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});