import { InventoryItem, Client, Product, WarehouseHistoryItem, WarehouseItem, WarehouseRequestItem } from '../types';

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', productCode: 'PRD001', productName: '노트북 - ThinkPad X1', category: '전자제품', quantity: 45, location: 'A-01', client: '삼성전자', lastUpdated: '2024-01-15T09:30:00Z' },
  { id: '2', productCode: 'PRD002', productName: '무선 마우스', category: '주변기기', quantity: 120, location: 'B-03', client: 'LG전자', lastUpdated: '2024-01-14T14:20:00Z' },
];

export const MOCK_CLIENTS: Client[] = [
  { id: '1', code: 'CLI001', name: '삼성전자', representative: '김철수', phone: '02-1234-5678', email: 'samsung@example.com', address: '서울시 강남구', notes: '주요 거래처', createdAt: '2024-01-15' },
  { id: '2', code: 'CLI002', name: 'LG전자', representative: '박영희', phone: '02-2345-6789', email: 'lg@example.com', address: '서울시 영등포구', notes: '', createdAt: '2024-01-16' },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', code: 'PRD001', name: '노트북 - ThinkPad X1', group: '전자제품', specification: '14인치, i7, 16GB RAM', barcode: '1234567890123', inPrice: 1200000, outPrice: 1500000, createdAt: '2024-01-15' },
  { id: '2', code: 'PRD002', name: '무선 마우스', group: '주변기기', specification: '2.4GHz, USB 동글', barcode: '1234567890124', inPrice: 25000, outPrice: 35000, createdAt: '2024-01-16' },
];

export const MOCK_WAREHOUSE_HISTORY: WarehouseHistoryItem[] = [
  { id: 'WH001', type: 'IN', productName: '프리미엄 사무용 의자', quantity: 20, manager: '김철수', completedAt: '2024-07-26T14:00:00Z' },
  { id: 'WH002', type: 'OUT', productName: '고성능 게이밍 노트북', quantity: 5, manager: '이영희', completedAt: '2024-07-25T11:30:00Z' },
];

export const MOCK_WAREHOUSE_CURRENT: WarehouseItem[] = [
  { id: '1', type: 'IN', productName: '태블릿 - iPad Pro', category: '전자제품', quantity: 20, location: 'A-12', client: '애플', notes: '새 모델 입고', status: 'PENDING', createdAt: '2024-01-16T10:00:00Z', updatedAt: '2024-01-16T10:00:00Z' },
  { id: '2', type: 'OUT', productName: '헤드셋 - 게이밍', category: '주변기기', quantity: 15, location: 'B-09', client: '레이저', notes: '', status: 'IN_PROGRESS', createdAt: '2024-01-15T15:30:00Z', updatedAt: '2024-01-15T15:30:00Z' },
];

export const MOCK_WAREHOUSE_REQUESTS: WarehouseRequestItem[] = [
    { id: '1', type: 'OUT', productName: '무선 마우스', category: '주변기기', quantity: 30, location: 'B-03', client: 'LG전자', notes: '앱에서 요청한 출고', status: 'PENDING', createdAt: '2025-07-08T14:30:00Z', updatedAt: '2025-07-08T14:30:00Z' },
    { id: '2', type: 'IN', productName: '노트북 - ThinkPad X1', category: '전자제품', quantity: 50, location: 'A-01', client: '삼성전자', notes: '신제품 입고 요청', status: 'APPROVED', createdAt: '2025-07-07T09:15:00Z', updatedAt: '2025-07-07T16:45:00Z' },
];
