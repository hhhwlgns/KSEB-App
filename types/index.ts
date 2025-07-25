export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  group: string;
  specification: string;
  barcode: string;
  inPrice: number;
  outPrice: number;
  createdAt: string;
}

export interface WarehouseItem {
  id: string;
  type: 'IN' | 'OUT';
  productName: string;
  category: string;
  quantity: number;
  location: string;
  client: string;
  notes?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseHistoryItem {
  id: string;
  type: 'IN' | 'OUT';
  productName: string;
  quantity: number;
  manager: string;
  completedAt: string;
}

export interface WarehouseRequestItem {
  id: string;
  type: 'IN' | 'OUT';
  productName: string;
  category: string;
  quantity: number;
  location: string;
  client: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  productCode: string;
  productName: string;
  category: string;
  quantity: number;
  location: string;
  lastUpdated: string;
  client: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SearchFilters {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  type?: string;
  client?: string;
  category?: string;
}

