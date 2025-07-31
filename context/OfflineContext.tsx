import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { toast } from 'sonner-native';

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  resource: string; // 'products', 'clients', 'warehouse-requests', etc.
  data: any;
  timestamp: number;
}

interface OfflineContextType {
  isOnline: boolean;
  pendingActions: OfflineAction[];
  addPendingAction: (action: Omit<OfflineAction, 'id' | 'timestamp'>) => void;
  syncPendingActions: () => Promise<void>;
  clearPendingActions: () => void;
  getPendingActionsCount: () => number;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  pendingActions: [],
  addPendingAction: () => {},
  syncPendingActions: async () => {},
  clearPendingActions: () => {},
  getPendingActionsCount: () => 0,
});

export function useOffline() {
  return useContext(OfflineContext);
}

const PENDING_ACTIONS_KEY = 'pending_offline_actions';

export const OfflineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  useEffect(() => {
    // 네트워크 상태 모니터링
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable;
      setIsOnline(online);
      
      if (online && pendingActions.length > 0) {
        toast.info(`인터넷 연결됨. ${pendingActions.length}개 대기 작업 동기화 중...`);
        syncPendingActions();
      } else if (!online) {
        toast.warning('오프라인 모드: 작업이 대기열에 저장됩니다');
      }
    });

    // 저장된 대기 작업 로드
    loadPendingActions();

    return () => unsubscribe();
  }, []);

  const loadPendingActions = async () => {
    try {
      const stored = await AsyncStorage.getItem(PENDING_ACTIONS_KEY);
      if (stored) {
        const actions = JSON.parse(stored);
        setPendingActions(actions);
      }
    } catch (error) {
      console.error('Failed to load pending actions:', error);
    }
  };

  const savePendingActions = async (actions: OfflineAction[]) => {
    try {
      await AsyncStorage.setItem(PENDING_ACTIONS_KEY, JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to save pending actions:', error);
    }
  };

  const addPendingAction = (action: Omit<OfflineAction, 'id' | 'timestamp'>) => {
    const newAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    const updatedActions = [...pendingActions, newAction];
    setPendingActions(updatedActions);
    savePendingActions(updatedActions);

    if (!isOnline) {
      toast.info('오프라인 상태: 작업이 대기열에 추가되었습니다');
    }
  };

  const syncPendingActions = async () => {
    if (!isOnline || pendingActions.length === 0) return;

    try {
      // 여기에 실제 API 동기화 로직 구현
      // 예시: 각 resource type별로 적절한 API 호출
      
      const syncPromises = pendingActions.map(async (action) => {
        try {
          switch (action.resource) {
            case 'products':
              return await syncProductAction(action);
            case 'clients':
              return await syncClientAction(action);
            case 'warehouse-requests':
              return await syncWarehouseRequestAction(action);
            default:
              console.warn(`Unknown resource type: ${action.resource}`);
              return null;
          }
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          throw error;
        }
      });

      const results = await Promise.allSettled(syncPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      if (failed === 0) {
        // 모든 작업이 성공한 경우
        setPendingActions([]);
        await AsyncStorage.removeItem(PENDING_ACTIONS_KEY);
        toast.success(`${successful}개 작업이 성공적으로 동기화되었습니다`);
      } else {
        // 일부 실패한 경우 - 실패한 작업만 유지
        const failedActions = pendingActions.filter((_, index) => 
          results[index].status === 'rejected'
        );
        setPendingActions(failedActions);
        savePendingActions(failedActions);
        toast.warning(`${successful}개 성공, ${failed}개 실패. 실패한 작업은 다시 시도됩니다.`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('동기화 중 오류가 발생했습니다');
    }
  };

  const clearPendingActions = () => {
    setPendingActions([]);
    AsyncStorage.removeItem(PENDING_ACTIONS_KEY);
    toast.info('대기 중인 모든 작업이 삭제되었습니다');
  };

  const getPendingActionsCount = () => pendingActions.length;

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingActions,
        addPendingAction,
        syncPendingActions,
        clearPendingActions,
        getPendingActionsCount,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

// 개별 리소스 동기화 함수들 (실제 API 구현 필요)
async function syncProductAction(action: OfflineAction): Promise<any> {
  // 실제 API 호출 로직
  console.log('Syncing product action:', action);
  // return await api.syncProduct(action);
  return Promise.resolve(); // 임시
}

async function syncClientAction(action: OfflineAction): Promise<any> {
  console.log('Syncing client action:', action);
  return Promise.resolve(); // 임시
}

async function syncWarehouseRequestAction(action: OfflineAction): Promise<any> {
  console.log('Syncing warehouse request action:', action);
  return Promise.resolve(); // 임시
}