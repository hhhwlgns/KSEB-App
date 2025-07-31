import { Client, Product, InventoryItem, WarehouseHistoryItem, WarehouseItem, WarehouseRequestItem } from '../types';

// --- Helper Functions ---
const getRandomId = () => `mock-${Math.random().toString(36).substr(2, 9)}`;
const getDateString = (daysOffset = 0, hour = 9, minute = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

// --- MOCK DATA GENERATION ---

// 1. Clients (거래처)
export const MOCK_CLIENTS: Client[] = [
  { id: 'client-001', code: 'C001', name: '(주)알파상사', type: '매입처', representative: '김대표', phone: '02-1234-5678', email: 'alpha@example.com', address: '서울시 강남구 테헤란로 123', notes: '주요 매입처', createdAt: getDateString(-30) },
  { id: 'client-002', code: 'C002', name: '베타유통', type: '납품처', representative: '이사장', phone: '031-987-6543', email: 'beta@example.com', address: '경기도 성남시 분당구 판교역로 456', notes: '일일 납품', createdAt: getDateString(-25) },
  { id: 'client-003', code: 'C003', name: '감마물류', type: '납품처', representative: '박사장', phone: '051-111-2222', email: 'gamma@example.com', address: '부산시 해운대구 센텀동로 789', notes: '', createdAt: getDateString(-20) },
  { id: 'client-004', code: 'C004', name: '델타산업', type: '매입처', representative: '최대표', phone: '032-333-4444', email: 'delta@example.com', address: '인천시 연수구 송도국제대로 10', notes: '월말 정산', createdAt: getDateString(-15) },
];

// 2. Products (품목)
export const MOCK_PRODUCTS: Product[] = [
  { id: 'prod-001', code: 'SKU-NB-001', name: '고성능 노트북', group: '전자기기', specification: '15인치, i9, 32GB RAM', barcode: '8801234567890', inboundPrice: 1500000, outboundPrice: 1800000, notes: '고가 주의', createdAt: getDateString(-50) },
  { id: 'prod-002', code: 'SKU-MON-002', name: '4K 모니터', group: '디스플레이', specification: '27인치, UHD, HDR', barcode: '8801234567891', inboundPrice: 450000, outboundPrice: 550000, notes: '', createdAt: getDateString(-45) },
  { id: 'prod-003', code: 'SKU-KB-003', name: '기계식 키보드', group: '주변기기', specification: '청축, RGB', barcode: '8801234567892', inboundPrice: 120000, outboundPrice: 150000, notes: '재고 부족', createdAt: getDateString(-40) },
  { id: 'prod-004', code: 'SKU-MSE-004', name: '무선 마우스', group: '주변기기', specification: '블루투스 5.0', barcode: '8801234567893', inboundPrice: 50000, outboundPrice: 70000, notes: '', createdAt: getDateString(-35) },
];

// 3. Warehouse Requests (입출고 요청)
export const MOCK_WAREHOUSE_REQUESTS: WarehouseRequestItem[] = [
  { id: getRandomId(), type: 'inbound', itemCode: 'SKU-NB-001', itemName: '고성능 노트북', specification: '15인치, i9, 32GB RAM', quantity: 10, companyCode: 'C001', companyName: '(주)알파상사', scheduledDateTime: getDateString(0, 10, 0), notes: '오전 10시 입고 요청', status: 'pending' },
  { id: getRandomId(), type: 'outbound', itemCode: 'SKU-MON-002', itemName: '4K 모니터', specification: '27인치, UHD, HDR', quantity: 5, companyCode: 'C002', companyName: '베타유통', scheduledDateTime: getDateString(0, 14, 30), notes: '오후 2시 30분 출고 요청', status: 'pending' },
  { id: getRandomId(), type: 'inbound', itemCode: 'SKU-KB-003', itemName: '기계식 키보드', specification: '청축, RGB', quantity: 50, companyCode: 'C004', companyName: '델타산업', scheduledDateTime: getDateString(1, 11, 0), notes: '내일 오전 입고', status: 'approved' },
  { id: getRandomId(), type: 'outbound', itemCode: 'SKU-MSE-004', itemName: '무선 마우스', specification: '블루투스 5.0', quantity: 30, companyCode: 'C003', companyName: '감마물류', scheduledDateTime: getDateString(-1, 16, 0), notes: '어제 출고 건', status: 'rejected' },
];

// 4. Warehouse Current (입출고 현황)
export const MOCK_WAREHOUSE_CURRENT: WarehouseItem[] = [
  { id: getRandomId(), type: 'inbound', productName: '고성능 노트북', sku: 'SKU-NB-001', individualCode: 'IND-001', specification: '15인치, i9, 32GB RAM', quantity: 20, location: 'A-1-1', companyName: '(주)알파상사', companyCode: 'C001', status: 'in_progress', dateTime: getDateString(0, 11, 0), notes: '검수 진행중' },
  { id: getRandomId(), type: 'outbound', productName: '4K 모니터', sku: 'SKU-MON-002', individualCode: 'IND-002', specification: '27인치, UHD, HDR', quantity: 15, location: 'B-2-3', companyName: '베타유통', companyCode: 'C002', status: 'pending', destination: '서울 센터', dateTime: getDateString(0, 15, 0), notes: '출고 대기' },
];

// 5. Warehouse History (입출고 내역)
export const MOCK_WAREHOUSE_HISTORY: WarehouseHistoryItem[] = [
  { id: getRandomId(), type: 'inbound', productName: '무선 마우스', sku: 'SKU-MSE-004', individualCode: 'IND-003', specification: '블루투스 5.0', quantity: 100, location: 'C-3-5', companyName: '델타산업', companyCode: 'C004', status: 'completed', dateTime: getDateString(-1, 10, 20), manager: '홍길동', notes: '정상 입고' },
  { id: getRandomId(), type: 'outbound', productName: '기계식 키보드', sku: 'SKU-KB-003', individualCode: 'IND-004', specification: '청축, RGB', quantity: 50, location: 'A-1-2', companyName: '감마물류', companyCode: 'C003', status: 'completed', destination: '부산 지점', dateTime: getDateString(-2, 17, 5), manager: '이순신', notes: '긴급 출고' },
  { id: getRandomId(), type: 'inbound', productName: '고성능 노트북', sku: 'SKU-NB-001', individualCode: 'IND-005', specification: '15인치, i9, 32GB RAM', quantity: 10, location: 'A-1-1', companyName: '(주)알파상사', companyCode: 'C001', status: 'completed', dateTime: getDateString(0, 9, 45), manager: '김유신', notes: '오늘 입고 완료' },
];

// 6. Inventory (재고)
export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv-001', name: '고성능 노트북', sku: 'SKU-NB-001', specification: '15인치, i9, 32GB RAM', quantity: 50, inboundScheduled: 10, outboundScheduled: 5, location: 'A-1-1', status: '정상', lastUpdate: getDateString(0, 11, 5) },
  { id: 'inv-002', name: '4K 모니터', sku: 'SKU-MON-002', specification: '27인치, UHD, HDR', quantity: 30, inboundScheduled: 0, outboundScheduled: 15, location: 'B-2-3', status: '정상', lastUpdate: getDateString(-1, 14, 30) },
  { id: 'inv-003', name: '기계식 키보드', sku: 'SKU-KB-003', specification: '청축, RGB', quantity: 15, inboundScheduled: 50, outboundScheduled: 20, location: 'A-1-2', status: '부족', lastUpdate: getDateString(0, 9, 0) },
  { id: 'inv-004', name: '무선 마우스', sku: 'SKU-MSE-004', specification: '블루투스 5.0', quantity: 5, inboundScheduled: 100, outboundScheduled: 10, location: 'C-3-5', status: '위험', lastUpdate: getDateString(-2, 18, 0) },
];

// 7. Racks (랙) - 단일 품목만 담는 구조로 변경
export const MOCK_RACKS: Rack[] = [
  {
    id: 'RACK-001',
    location: 'D-1-1',
    productId: 'prod-001',
    sku: 'SKU-NB-001',
    name: '고성능 노트북',
    quantity: 20,
    lastUpdate: getDateString(-1, 15, 0),
  },
  {
    id: 'RACK-002',
    location: 'D-1-2',
    productId: 'prod-003',
    sku: 'SKU-KB-003',
    name: '기계식 키보드',
    quantity: 50,
    lastUpdate: getDateString(-2, 10, 0),
  },
  {
    id: 'RACK-003',
    location: 'D-1-3',
    productId: 'prod-004',
    sku: 'SKU-MSE-004',
    name: '무선 마우스',
    quantity: 100,
    lastUpdate: getDateString(0, 8, 30),
  },
];