import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client, Product, User, WarehouseItem, InventoryItem, WarehouseHistoryItem, WarehouseRequestItem } from '../types';

// !--- 개발용 모의 데이터 ---!
import { MOCK_INVENTORY, MOCK_CLIENTS, MOCK_PRODUCTS, MOCK_WAREHOUSE_HISTORY, MOCK_WAREHOUSE_CURRENT, MOCK_WAREHOUSE_REQUESTS, MOCK_RACKS } from './mockData';
const MOCK_MODE = true; 
// !-------------------------!

const API_URL = 'http://localhost:8080/api';


const apiClient = axios.create({
  baseURL: API_URL,
  timeout: MOCK_MODE ? 500 : 10000,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// --- Auth ---
export const loginAPI = async (email, password) => {
  if (MOCK_MODE) return { user: { id: '1', name: '테스트 유저', email, role: 'admin' }, token: 'mock-jwt-token' };
  const response = await apiClient.post('/auth/login', { username: email, password });
  return response.data;
};

// --- Inventory ---
export const getInventory = async (): Promise<InventoryItem[]> => {
  if (MOCK_MODE) return MOCK_INVENTORY;
  const response = await apiClient.get('/inventory');
  return response.data;
};

// --- Clients ---
export const getClients = async (): Promise<Client[]> => {
  if (MOCK_MODE) return MOCK_CLIENTS;
  const response = await apiClient.get('/clients');
  return response.data;
};

export const getClientById = async (id: string): Promise<Client> => {
  if (MOCK_MODE) {
    const client = MOCK_CLIENTS.find(c => c.id === id);
    if (!client) throw new Error('Client not found');
    return client;
  }
  const response = await apiClient.get(`/clients/${id}`);
  return response.data;
};

export const createClient = async (clientData: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
  if (MOCK_MODE) {
    const newClient = { ...clientData, id: `new-${Date.now()}`, createdAt: new Date().toISOString() };
    MOCK_CLIENTS.push(newClient);
    return newClient;
  }
  const response = await apiClient.post('/clients', clientData);
  return response.data;
};

export const updateClient = async ({ id, ...clientData }: Partial<Client> & { id: string }): Promise<Client> => {
  if (MOCK_MODE) {
    const index = MOCK_CLIENTS.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Client not found');
    MOCK_CLIENTS[index] = { ...MOCK_CLIENTS[index], ...clientData };
    return MOCK_CLIENTS[index];
  }
  const response = await apiClient.put(`/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id: string): Promise<void> => {
  if (MOCK_MODE) {
    const index = MOCK_CLIENTS.findIndex(c => c.id === id);
    if (index > -1) MOCK_CLIENTS.splice(index, 1);
    return;
  }
  await apiClient.delete(`/clients/${id}`);
};


// --- Products ---
export const getProducts = async (): Promise<Product[]> => {
  if (MOCK_MODE) return MOCK_PRODUCTS;
  const response = await apiClient.get('/products');
  return response.data;
};

export const getProductById = async (id: string): Promise<Product> => {
  if (MOCK_MODE) {
    const product = MOCK_PRODUCTS.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    return product;
  }
  const response = await apiClient.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product> => {
  if (MOCK_MODE) {
    const newProduct = { ...productData, id: `new-${Date.now()}`, createdAt: new Date().toISOString() };
    MOCK_PRODUCTS.push(newProduct);
    return newProduct;
  }
  const response = await apiClient.post('/products', productData);
  return response.data;
};

export const updateProduct = async ({ id, ...productData }: Partial<Product> & { id: string }): Promise<Product> => {
  if (MOCK_MODE) {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], ...productData };
    return MOCK_PRODUCTS[index];
  }
  const response = await apiClient.put(`/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  if (MOCK_MODE) {
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (index > -1) MOCK_PRODUCTS.splice(index, 1);
    return;
  }
  await apiClient.delete(`/products/${id}`);
};

export const getInventoryItemByBarcode = async (barcode: string): Promise<InventoryItem> => {
  if (MOCK_MODE) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const product = MOCK_PRODUCTS.find(p => p.barcode === barcode);
        if (!product) {
          reject(new Error('해당 바코드의 품목을 찾을 수 없습니다.'));
          return;
        }
        const inventoryItem = MOCK_INVENTORY.find(i => i.sku === product.code);
        if (!inventoryItem) {
          reject(new Error('품목은 있으나 재고 정보를 찾을 수 없습니다.'));
          return;
        }
        resolve(inventoryItem);
      }, 500); // 0.5초 지연
    });
  }
  const response = await apiClient.get(`/inventory/by-barcode/${barcode}`);
  return response.data;
};


// --- Warehouse ---
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

export const createWarehouseRequest = async (requestData: Omit<WarehouseRequestItem, 'id' | 'status' | 'isRackRequest'>) => {
  if (MOCK_MODE) {
    const newRequest: WarehouseRequestItem = { 
      ...requestData, 
      id: `req-${Date.now()}`, 
      status: 'pending' as const,
      isRackRequest: false,
    };
    MOCK_WAREHOUSE_REQUESTS.unshift(newRequest);
    return newRequest;
  }
  const response = await apiClient.post('/warehouse/requests', requestData);
  return response.data;
};

export const createRackWarehouseRequest = async (rack: Rack, type: 'inbound' | 'outbound', notes: string, client: Client): Promise<WarehouseRequestItem> => {
  const productInfo = MOCK_PRODUCTS.find(p => p.id === rack.productId);

  const requestData: Omit<WarehouseRequestItem, 'id' | 'status'> = {
    type,
    isRackRequest: true,
    rackId: rack.id,
    // 단일 품목 정보로 채움
    itemCode: rack.sku,
    itemName: rack.name,
    specification: productInfo?.specification || 'N/A',
    quantity: rack.quantity,
    // 공통 정보
    scheduledDateTime: new Date().toISOString(),
    notes,
    companyCode: client.code,
    companyName: client.name,
  };

  if (MOCK_MODE) {
    const newRequest: WarehouseRequestItem = {
      ...requestData,
      id: `rack-req-${Date.now()}`,
      status: 'pending',
    };
    MOCK_WAREHOUSE_REQUESTS.unshift(newRequest);
    return newRequest;
  }

  const response = await apiClient.post('/warehouse/requests/rack', requestData);
  return response.data;
};

export const getRackContents = async (rackId: string): Promise<Rack> => {
  if (MOCK_MODE) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rack = MOCK_RACKS.find(r => r.id === rackId);
        if (rack) {
          resolve(rack);
        } else {
          reject(new Error('해당 ID의 랙을 찾을 수 없습니다.'));
        }
      }, 300);
    });
  }
  const response = await apiClient.get(`/racks/${rackId}`);
  return response.data;
};

// ... Interceptors ...
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