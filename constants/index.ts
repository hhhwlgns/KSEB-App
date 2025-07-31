export const COLORS = {
  primary: '#4F46E5',    // Smart WMS 메인 파란색
  primaryDark: '#3730A3',
  secondary: '#F59E0B',
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  
  // Text colors
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  
  // Background colors
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHover: '#F3F4F6',
  
  // Border colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Status colors
  statusPending: '#F59E0B',
  statusInProgress: '#3B82F6',
  statusCompleted: '#10B981',
  statusApproved: '#10B981',
  statusRejected: '#EF4444',
};

export const SIZES = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // Font sizes
  fontXS: 12,
  fontSM: 14,
  fontMD: 16,
  fontLG: 18,
  fontXL: 20,
  fontXXL: 24,
  
  // Component sizes
  buttonHeight: 48,
  inputHeight: 48,
  headerHeight: 60,
  tabBarHeight: 65,
  
  // Radius
  radiusSM: 6,
  radiusMD: 8,
  radiusLG: 12,
  radiusXL: 16,
};

export const API_BASE_URL = 'https://smart-wms-be.onrender.com';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/me',
  },
  COMPANIES: {
    LIST: '/api/companies',
    CREATE: '/api/companies',
    UPDATE: '/api/companies',
    DELETE: '/api/companies',
  },
  ITEMS: {
    LIST: '/api/items',
    CREATE: '/api/items',
    UPDATE: '/api/items',
    DELETE: '/api/items',
  },
  INOUT: {
    ORDERS: '/api/inout/orders',
    STATUS: '/api/inout/orders',
  },
  INVENTORY: {
    LIST: '/api/inventory',
  },
  USERS: {
    LIST: '/api/users',
    CREATE: '/api/users',
    UPDATE: '/api/users',
    DELETE: '/api/users',
  },
  SCHEDULES: {
    LIST: '/api/schedules',
    CREATE: '/api/schedules',
    DELETE: '/api/schedules',
  },
  DASHBOARD: {
    SUMMARY: '/api/dashboard/summary',
  },
};

export const STATUS_LABELS = {
  PENDING: '대기',
  IN_PROGRESS: '진행중',
  COMPLETED: '완료',
  APPROVED: '승인',
  REJECTED: '거절',
};

export const TYPE_LABELS = {
  IN: '입고',
  OUT: '출고',
};

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};