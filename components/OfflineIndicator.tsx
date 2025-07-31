import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../context/OfflineContext';
import { COLORS, SIZES } from '../constants';

export default function OfflineIndicator() {
  const { isOnline, pendingActions, syncPendingActions, getPendingActionsCount } = useOffline();
  const pendingCount = getPendingActionsCount();

  if (isOnline && pendingCount === 0) {
    return null; // 온라인이고 대기 작업이 없으면 표시하지 않음
  }

  return (
    <View style={[
      styles.container,
      !isOnline ? styles.offline : styles.syncing
    ]}>
      <View style={styles.content}>
        <Ionicons 
          name={!isOnline ? "cloud-offline" : "sync"} 
          size={16} 
          color="white" 
        />
        <Text style={styles.text}>
          {!isOnline 
            ? `오프라인 (${pendingCount}개 대기)` 
            : `동기화 중... (${pendingCount}개)`
          }
        </Text>
      </View>
      
      {isOnline && pendingCount > 0 && (
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={syncPendingActions}
        >
          <Text style={styles.syncButtonText}>동기화</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    marginHorizontal: SIZES.md,
    marginVertical: SIZES.xs,
    borderRadius: SIZES.radiusMD,
  },
  offline: {
    backgroundColor: COLORS.error,
  },
  syncing: {
    backgroundColor: COLORS.warning,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  text: {
    color: 'white',
    fontSize: SIZES.fontSM,
    fontWeight: '500',
    marginLeft: SIZES.xs,
  },
  syncButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.radius,
  },
  syncButtonText: {
    color: 'white',
    fontSize: SIZES.fontXS,
    fontWeight: '600',
  },
});