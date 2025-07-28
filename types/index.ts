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
  type: '매입처' | '납품처';
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
  inboundPrice: number;
  outboundPrice: number;
  notes?: string;
  createdAt: string;
}

export interface WarehouseItem {
  id: string;
  type: 'inbound' | 'outbound';
  productName: string;
  sku: string;
  individualCode: string;
  specification: string;
  quantity: number;
  location: string;
  companyName: string;
  companyCode: string;
  status: 'completed' | 'in_progress' | 'pending';
  destination?: string;
  dateTime: string;
  notes?: string;
}

export interface WarehouseHistoryItem {
  id: string;
  type: 'inbound' | 'outbound';
  productName: string;
  sku: string;
  individualCode: string;
  specification: string;
  quantity: number;
  location: string;
  companyName: string;
  companyCode: string;
  status: 'completed' | 'in_progress' | 'pending';
  destination?: string;
  dateTime: string;
  notes?: string;
  manager?: string; // 담당자 정보 추가
}

export interface WarehouseRequestItem {
  id: string;
  type: 'inbound' | 'outbound';
  itemCode: string;
  itemName: string;
  specification: string;
  quantity: number;
  companyCode: string;
  companyName: string;
  scheduledDateTime: string;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
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

