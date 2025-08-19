// 주문 상태 관리 시스템 (Mobile App)

export type OrderStatus = 'pending' | 'scheduled' | 'rejected' | 'completed' | 'cancelled';

export interface StatusConfig {
  label: string;
  color: 'yellow' | 'blue' | 'red' | 'green' | 'gray';
  description: string;
  bgColor: string;
  textColor: string;
}

// 상태별 설정 (React Native 스타일)
export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
  pending: {
    label: '승인대기',
    color: 'yellow',
    description: '관리자 승인 대기 중',
    bgColor: '#FEF3C7', // yellow-100
    textColor: '#92400E'  // yellow-800
  },
  scheduled: {
    label: '예약',
    color: 'blue', 
    description: '승인되어 작업 예약됨',
    bgColor: '#DBEAFE', // blue-100
    textColor: '#1E40AF'  // blue-800
  },
  rejected: {
    label: '거절',
    color: 'red',
    description: '관리자가 거절함',
    bgColor: '#FEE2E2', // red-100
    textColor: '#991B1B'  // red-800
  },
  completed: {
    label: '완료',
    color: 'green',
    description: '작업이 완료됨',
    bgColor: '#D1FAE5', // green-100
    textColor: '#065F46'  // green-800
  },
  cancelled: {
    label: '취소',
    color: 'gray',
    description: '취소된 작업',
    bgColor: '#F3F4F6', // gray-100
    textColor: '#374151'  // gray-800
  }
};

// 상태 전환 가능한 경우들
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['scheduled', 'rejected'],
  scheduled: ['completed', 'cancelled'],
  rejected: [],
  completed: [],
  cancelled: []
};

// 상태 전환 가능 여부 확인
export const canTransitionTo = (currentStatus: OrderStatus, targetStatus: OrderStatus): boolean => {
  return STATUS_TRANSITIONS[currentStatus].includes(targetStatus);
};

// 상태별 아이콘 (React Native용 이모지)
export const getStatusIcon = (status: OrderStatus): string => {
  switch (status) {
    case 'pending':
      return '⏳'; // 대기중
    case 'scheduled':
      return '📅'; // 예약
    case 'rejected':
      return '❌'; // 거절
    case 'completed':
      return '✅'; // 완료
    case 'cancelled':
      return '🚫'; // 취소
    default:
      return '❓';
  }
};

// 상태별 우선순위 (정렬용)
export const getStatusPriority = (status: OrderStatus): number => {
  switch (status) {
    case 'pending':
      return 1; // 가장 높은 우선순위
    case 'scheduled':
      return 2;
    case 'completed':
      return 3;
    case 'cancelled':
      return 4;
    case 'rejected':
      return 5; // 가장 낮은 우선순위
    default:
      return 999;
  }
};

// 액션 가능한 상태인지 확인
export const isActionableStatus = (status: OrderStatus): boolean => {
  return ['pending', 'scheduled'].includes(status);
};

// 최종 상태인지 확인
export const isFinalStatus = (status: OrderStatus): boolean => {
  return ['rejected', 'completed', 'cancelled'].includes(status);
};


export const getStatusChangeMessage = (
  fromStatus: OrderStatus, 
  toStatus: OrderStatus,
  userName: string = '관리자'
): string => {
  const fromLabel = ORDER_STATUS_CONFIG[fromStatus].label;
  const toLabel = ORDER_STATUS_CONFIG[toStatus].label;
  
  switch (`${fromStatus}-${toStatus}`) {
    case 'pending-scheduled':
      return `${userName}님이 대기중인 작업을 승인하여 예약 상태로 변경했습니다.`;
    case 'pending-rejected':
      return `${userName}님이 대기중인 작업을 거절했습니다.`;
    case 'scheduled-completed':
      return `${userName}님이 예약된 작업을 완료 처리했습니다.`;
    case 'scheduled-cancelled':
      return `${userName}님이 예약된 작업을 취소했습니다.`;
    default:
      return `${userName}님이 상태를 ${fromLabel}에서 ${toLabel}로 변경했습니다.`;
  }
};