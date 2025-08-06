import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
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
import { User } from '../types/user';
import { fetchUsers, createUser, updateUser, deleteUser } from '../lib/api';

export default function UserManagementScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const { data: users, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('사용자가 추가되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalVisible(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || '사용자 추가 중 오류가 발생했습니다.');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { id: number; userData: Partial<User> }) => updateUser(data.id, data.userData),
    onSuccess: () => {
      toast.success('사용자 정보가 업데이트되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setModalVisible(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || '사용자 정보 업데이트 중 오류가 발생했습니다.');
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success('사용자가 삭제되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error(error.message || '사용자 삭제 중 오류가 발생했습니다.');
    },
  });

  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState('USER'); // Default role

  useEffect(() => {
    if (users) {
      let filtered = [...users];
      if (searchQuery.trim()) {
        const lowercasedQuery = searchQuery.toLowerCase();
        filtered = filtered.filter(user =>
          user.username.toLowerCase().includes(lowercasedQuery) ||
          user.fullName.toLowerCase().includes(lowercasedQuery) ||
          user.email.toLowerCase().includes(lowercasedQuery)
        );
      }
      setFilteredUsers(filtered);
    }
  }, [users, searchQuery]);

  const resetForm = () => {
    setCurrentUser(null);
    setFormUsername('');
    setFormEmail('');
    setFormFullName('');
    setFormRole('USER');
  };

  const handleAddUser = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setFormUsername(user.username);
    setFormEmail(user.email);
    setFormFullName(user.fullName);
    setFormRole(user.role);
    setModalVisible(true);
  };

  const handleDeleteUser = (id: number) => {
    Alert.alert(
      '사용자 삭제',
      '정말로 이 사용자를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          onPress: () => deleteUserMutation.mutate(id),
          style: 'destructive' 
        },
      ]
    );
  };

  const handleSaveUser = () => {
    if (!formUsername || !formEmail || !formFullName || !formRole) {
      toast.error('모든 필드를 채워주세요.');
      return;
    }

    const userData = {
      username: formUsername,
      email: formEmail,
      fullName: formFullName,
      role: formRole,
    };

    if (currentUser) {
      updateUserMutation.mutate({ id: currentUser.id, userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.fullName}>{item.fullName}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>역할: {item.role}</Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity onPress={() => handleEditUser(item)} style={styles.actionButton}>
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteUser(item.id)} style={styles.actionButton}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && !users) {
    return <SafeAreaView style={styles.container}><LoadingSpinner /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="사용자 관리" 
        subtitle="시스템 사용자 계정 관리" 
        showBack
        rightComponent={
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.headerButton} onPress={() => setIsSearchVisible(!isSearchVisible)}>
              <Ionicons name={isSearchVisible ? "close" : "search"} size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
        }
      />

      {isSearchVisible && (
        <View style={styles.toolbar}>
          <SearchBar placeholder="사용자명, 이름, 이메일 검색..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      )}

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>{searchQuery ? '검색 결과가 없습니다.' : '등록된 사용자가 없습니다.'}</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddUser}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{currentUser ? '사용자 편집' : '새 사용자 추가'}</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>사용자명</Text>
              <TextInput
                style={styles.modalInput}
                value={formUsername}
                onChangeText={setFormUsername}
                placeholder="사용자명"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이메일</Text>
              <TextInput
                style={styles.modalInput}
                value={formEmail}
                onChangeText={setFormEmail}
                placeholder="이메일"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이름</Text>
              <TextInput
                style={styles.modalInput}
                value={formFullName}
                onChangeText={setFormFullName}
                placeholder="이름"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>역할</Text>
              <TextInput
                style={styles.modalInput}
                value={formRole}
                onChangeText={setFormRole}
                placeholder="역할 (예: ADMIN, USER)"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalButtonTextCancel}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonSave} onPress={handleSaveUser}>
                <Text style={styles.modalButtonTextSave}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerButtons: { 
    flexDirection: 'row', 
    gap: SIZES.xs 
  },
  headerButton: { 
    padding: SIZES.sm,
    position: 'relative',
  },
  toolbar: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.sm,
    paddingBottom: SIZES.md,
    backgroundColor: COLORS.surface,
  },
  listContainer: { padding: SIZES.md, paddingBottom: 80 },
  userItem: {
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
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: SIZES.fontLG,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  fullName: {
    fontSize: SIZES.fontMD,
    color: COLORS.textSecondary,
  },
  email: {
    fontSize: SIZES.fontSM,
    color: COLORS.textMuted,
  },
  role: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: SIZES.xs,
  },
  userActions: {
    flexDirection: 'row',
    gap: SIZES.sm,
  },
  actionButton: {
    padding: SIZES.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.xl,
    marginTop: 50,
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
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radiusLG,
    padding: SIZES.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: SIZES.fontXL,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SIZES.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: SIZES.md,
  },
  inputLabel: {
    fontSize: SIZES.fontSM,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SIZES.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusMD,
    padding: SIZES.md,
    fontSize: SIZES.fontMD,
    color: COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SIZES.lg,
    gap: SIZES.md,
  },
  modalButtonCancel: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMD,
    backgroundColor: COLORS.surfaceHover,
  },
  modalButtonTextCancel: {
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalButtonSave: {
    paddingVertical: SIZES.md,
    paddingHorizontal: SIZES.lg,
    borderRadius: SIZES.radiusMD,
    backgroundColor: COLORS.primary,
  },
  modalButtonTextSave: {
    color: 'white',
    fontWeight: '600',
  },
});
