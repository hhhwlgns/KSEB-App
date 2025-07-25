import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, Product, User, WarehouseItem, InventoryItem, WarehouseHistoryItem, WarehouseRequestItem } from '../types';

// !--- 개발용 모의 데이터 ---!
// 나중에 실제 백엔드 연동 시 이 섹션 전체를 삭제하거나 주석 처리하세요.
import { MOCK_INVENTORY, MOCK_CLIENTS, MOCK_PRODUCTS, MOCK_WAREHOUSE_HISTORY, MOCK_WAREHOUSE_CURRENT, MOCK_WAREHOUSE_REQUESTS } from './mockData';
const MOCK_MODE = true; // 이 값을 false로 바꾸면 실제 API를 호출합니다.
// !-------------------------!

const API_URL = 'http://localhost:8080/api'; // 나중에 실제 IP로 변경해야 합니다.

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: MOCK_MODE ? 500 : 10000, // 모의 모드일 때는 타임아웃을 짧게 설정
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

export const loginAPI = async (email, password) => {
  if (MOCK_MODE) {
    return { 
      user: { id: '1', name: '테스트 유저', email, role: 'admin' }, 
      token: 'mock-jwt-token' 
    };
  }
  const response = await apiClient.post('/auth/login', { username: email, password });
  return response.data;
};

export const getInventory = async (): Promise<InventoryItem[]> => {
  if (MOCK_MODE) return MOCK_INVENTORY;
  const response = await apiClient.get('/inventory');
  return response.data;
};

export const getClients = async (): Promise<Client[]> => {
  if (MOCK_MODE) return MOCK_CLIENTS;
  const response = await apiClient.get('/clients');
  return response.data;
};

export const createClient = async (clientData: Omit<Client, 'id' | 'createdAt'>) => {
  if (MOCK_MODE) return { ...clientData, id: 'new-client', createdAt: new Date().toISOString() };
  const response = await apiClient.post('/clients', clientData);
  return response.data;
};

export const getProducts = async (): Promise<Product[]> => {
  if (MOCK_MODE) return MOCK_PRODUCTS;
  const response = await apiClient.get('/products');
  return response.data;
};

export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt'>) => {
  if (MOCK_MODE) return { ...productData, id: 'new-product', createdAt: new Date().toISOString() };
  const response = await apiClient.post('/products', productData);
  return response.data;
};

export const getWarehouseHistory = async (): Promise<WarehouseHistoryItem[]> => {
  if (MOCK_MODE) return MOCK_WAREHOUSE_HISTORY;
  const response = await apiClient.get('/warehouse/history');
  return response.data;
};

export const getWarehouseCurrent = async (): Promise<WarehouseItem[]> => {
  if (MOCK_MODE) return MOCK_WAREHOUSE_CURRENT;
  const response = await apiClient.get('/warehouse/current');
  return response.data;
};

export const getWarehouseRequests = async (): Promise<WarehouseRequestItem[]> => {
  if (MOCK_MODE) return MOCK_WAREHOUSE_REQUESTS;
  const response = await apiClient.get('/warehouse/requests');
  return response.data;
};

export const createWarehouseTransaction = async (transactionData: Omit<WarehouseItem, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
  if (MOCK_MODE) return { ...transactionData, id: 'new-transaction', status: 'PENDING', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  const response = await apiClient.post('/warehouse', transactionData);
  return response.data;
};

apiClient.interceptors.request.use(
  async (config) => {
    if (!config.headers.Authorization) {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request. Token might be expired.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;