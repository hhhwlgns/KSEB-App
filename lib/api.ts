
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/user';
import { Company } from '../types/company';
import { Item } from '../types/item';
import { InOutRecord } from '../types/inout';

const apiClient = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

async function handleResponse<T>(response: { data: T }): Promise<T> {
  return response.data;
}

export async function login(username: string, password: string): Promise<{ user: User; message: string; token?: string }> {
  const response = await apiClient.post('/api/auth/login', { username, password });
  const backendData = response.data;

  const user: User = {
    id: backendData.user.user_id,
    username: backendData.user.username,
    email: backendData.user.email,
    fullName: backendData.user.full_name,
    role: backendData.user.role,
  };
  
  return {
    user,
    message: backendData.message,
    token: backendData.token,
  };
}

export async function checkSession(): Promise<{ user: User }> {
  const response = await apiClient.get('/api/auth/me');
  const backendData = response.data;
  
  const user: User = {
    id: backendData.user_id,
    username: backendData.username,
    email: backendData.email,
    fullName: backendData.full_name,
    role: backendData.role,
  };

  return { user };
}

export async function logout() {
  await apiClient.post('/api/auth/logout');
}

// --- Companies ---
export async function fetchCompanies(): Promise<Company[]> {
  const response = await apiClient.get('/api/companies');
  return handleResponse(response);
}

export async function createCompany(companyData: Omit<Company, 'companyId'>): Promise<Company> {
  const response = await apiClient.post('/api/companies', companyData);
  return handleResponse(response);
}

export async function updateCompany(id: number, companyData: Partial<Company>): Promise<Company> {
  const response = await apiClient.put(`/api/companies/${id}`, companyData);
  return handleResponse(response);
}

export async function deleteCompany(id: number): Promise<void> {
  await apiClient.delete(`/api/companies/${id}`);
}

// --- Items ---
export async function fetchItems(): Promise<Item[]> {
  const response = await apiClient.get('/api/items');
  return handleResponse(response);
}

export async function createItem(itemData: Omit<Item, 'itemId'>): Promise<Item> {
  const response = await apiClient.post('/api/items', itemData);
  return handleResponse(response);
}

export async function updateItem(id: number, itemData: Partial<Item>): Promise<Item> {
  const response = await apiClient.put(`/api/items/${id}`, itemData);
  return handleResponse(response);
}

export async function deleteItem(id: number): Promise<void> {
  await apiClient.delete(`/api/items/${id}`);
}

// --- InOut ---
import { WarehouseItem } from '../types';

export async function getWarehouseCurrent(): Promise<WarehouseItem[]> {
  const response = await apiClient.get('/api/inout/orders');
  const allData: any[] = await handleResponse(response);
  
  const nonCompletedData = allData.filter(record => record.status !== 'COMPLETED' && record.status !== 'CANCELLED');

  return nonCompletedData.flatMap(order => 
    (order.items || []).map((item: any, itemIndex: number) => ({
      id: `${order.orderId}-${itemIndex}`,
      type: order.type?.toLowerCase() as 'inbound' | 'outbound',
      productName: item.itemName || 'N/A',
      sku: item.itemCode || 'N/A',
      individualCode: `ORDER-${order.orderId}-${item.itemId}`,
      specification: item.specification || 'N/A',
      quantity: item.requestedQuantity || 0,
      location: 'A-01', // Default or placeholder location
      companyName: order.companyName || 'N/A',
      companyCode: order.companyCode || 'N/A',
      status: order.status,
      dateTime: order.expectedDate || order.createdAt,
    }))
  );
}

export async function fetchInOutData(): Promise<InOutRecord[]> {
  const response = await apiClient.get('/api/inout/orders');
  const allData = await handleResponse(response);
  const completedData = allData.filter(record => record.status === 'COMPLETED');
  
  return completedData.flatMap(record => 
    record.items.map((item, itemIndex) => ({
      id: `${record.orderId}-${itemIndex}`,
      type: record.type?.toLowerCase() || 'inbound',
      productName: item.itemName || 'N/A',
      sku: item.itemCode || 'N/A',
      individualCode: `ORDER-${record.orderId}-${item.itemId}`,
      specification: item.specification || 'N/A',
      quantity: item.requestedQuantity || 0,
      location: 'A-01', // Default location
      company: record.companyName || 'N/A',
      companyCode: record.companyCode || 'N/A',
      status: '완료', // Explicitly set status to '완료'
      date: (record.createdAt || record.updatedAt || new Date().toISOString()).split('T')[0],
      time: (record.createdAt || record.updatedAt || new Date().toISOString()).split('T')[1]?.substring(0, 8) || '00:00:00',
      notes: 'N/A'
    }))
  );
}


export interface InOutOrderRequest {
  type: 'INBOUND' | 'OUTBOUND';
  companyId: number;
  expectedDate: string; // ISO format YYYY-MM-DD
  items: { itemId: number; quantity: number; }[];
}

export async function createInboundOrder(orderData: { itemId: number; quantity: number; companyId?: number; expectedDate?: string; }): Promise<any> {
  const requestData: InOutOrderRequest = {
    type: 'INBOUND',
    companyId: orderData.companyId || 1,
    expectedDate: orderData.expectedDate || new Date().toISOString().split('T')[0],
    items: [{ itemId: orderData.itemId, quantity: orderData.quantity }]
  };
  const response = await apiClient.post('/api/inout/orders', requestData);
  const result = await handleResponse(response);
  
  // 새로운 상태 시스템: 등록 시 pending(대기중) 상태로 유지
  // 관리자가 웹에서 승인/거절 처리
  
  return result;
}

export async function createOutboundOrder(orderData: { itemId: number; quantity: number; companyId?: number; expectedDate?: string; }): Promise<any> {
  const requestData: InOutOrderRequest = {
    type: 'OUTBOUND',
    companyId: orderData.companyId || 1,
    expectedDate: orderData.expectedDate || new Date().toISOString().split('T')[0],
    items: [{ itemId: orderData.itemId, quantity: orderData.quantity }]
  };
  const response = await apiClient.post('/api/inout/orders', requestData);
  const result = await handleResponse(response);
  
  if (result.orderId) {
    try {
      await apiClient.put(`/api/inout/orders/${result.orderId}/status`, {
        status: 'COMPLETED'
      });
    } catch (error) {
      console.warn('Failed to auto-approve outbound order:', error);
    }
  }
  
  return result;
}

export async function updateInOutRecord(id: number, status: 'COMPLETED' | 'CANCELLED'): Promise<any> {
  const response = await apiClient.put(`/api/inout/orders/${id}/status`, { status });
  return handleResponse(response);
}

// --- Inventory ---
export interface BackendInventoryResponse {
  itemId: number;
  itemName: string;
  locationCode: string;
  quantity: number;
  lastUpdated: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  specification: string;
  quantity: number;
  inboundScheduled: number;
  outboundScheduled: number;
  location: string;
  status: '정상' | '부족' | '위험';
  lastUpdate: string;
}

export async function fetchInventoryData(): Promise<InventoryItem[]> {
  const response = await apiClient.get('/api/inventory');
  const backendData: BackendInventoryResponse[] = await handleResponse(response);
  
  if (!backendData || backendData.length === 0) {
    console.log('No inventory data found in backend');
    return [];
  }
  
  const [items, inOutData, pendingOrders] = await Promise.all([
    fetchItems(),
    fetchInOutData(),
    getWarehouseCurrent()
  ]);
  
  const transformedData: InventoryItem[] = backendData.map((backendItem, index) => {
    const item = items.find(i => i.itemId === backendItem.itemId);
    
    // Calculate scheduled quantities from pending/in-progress orders
    const inboundScheduled = pendingOrders
      .filter(record => 
        record.type === 'inbound' && 
        record.sku === item?.itemCode &&
        (record.status === 'pending' || record.status === 'in_progress')
      )
      .reduce((sum, record) => sum + record.quantity, 0);
    
    const outboundScheduled = pendingOrders
      .filter(record => 
        record.type === 'outbound' && 
        record.sku === item?.itemCode &&
        (record.status === 'pending' || record.status === 'in_progress')
      )
      .reduce((sum, record) => sum + record.quantity, 0);
    
    let status: '정상' | '부족' | '위험' = '정상';
    if (backendItem.quantity <= 0) {
      status = '위험';
    } else if (backendItem.quantity <= 10) {
      status = '부족';
    }
    
    return {
      id: (index + 1).toString(),
      name: backendItem.itemName,
      sku: item?.itemCode || `SKU-${backendItem.itemId}`,
      specification: item?.spec || 'N/A',
      quantity: backendItem.quantity,
      inboundScheduled: inboundScheduled,
      outboundScheduled: outboundScheduled,
      location: backendItem.locationCode,
      status: status,
      lastUpdate: backendItem.lastUpdated
    };
  });
  
  return transformedData;
}

// --- Users ---
export async function fetchUsers(): Promise<User[]> {
    const response = await apiClient.get('/api/users');
    const backendUsers = await handleResponse(response);
    
    return backendUsers.map((user: any) => ({
        id: user.userId,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
    }));
}

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  const response = await apiClient.post('/api/users', {
    username: userData.username,
    email: userData.email,
    fullName: userData.fullName,
    password: 'defaultPassword123', // Default password for new users
    role: userData.role
  });
  const backendUser = await handleResponse(response);
  
  return {
    id: backendUser.userId,
    username: backendUser.username,
    email: backendUser.email,
    fullName: backendUser.fullName,
    role: backendUser.role,
  };
}

export async function updateUser(id: number, userData: Partial<User>): Promise<User> {
  const updateData: any = {};
  if (userData.username) updateData.username = userData.username;
  if (userData.email) updateData.email = userData.email;
  if (userData.fullName) updateData.fullName = userData.fullName;
  if (userData.role) updateData.role = userData.role;
  
  const response = await apiClient.put(`/api/users/${id}`, updateData);
  const backendUser = await handleResponse(response);
  
  return {
    id: backendUser.userId,
    username: backendUser.username,
    email: backendUser.email,
    fullName: backendUser.fullName,
    role: backendUser.role,
  };
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/users/${id}`);
}

