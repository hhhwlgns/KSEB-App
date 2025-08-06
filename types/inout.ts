
export interface InOutRecord {
  id: string;
  type: "inbound" | "outbound";
  productName: string;
  sku: string;
  individualCode: string;
  specification: string;
  quantity: number;
  location: string;
  company: string;
  companyCode: string;
  status: "완료" | "진행 중" | "예약";
  destination: string;
  date: string;
  time: string;
  notes: string;
}

// 서버에서 오는 원본 주문 구조
export interface InOutRequest {
  orderId: number;
  type: "INBOUND" | "OUTBOUND";
  companyName: string;
  companyCode: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  expectedDate: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    itemId: number;
    itemCode: string;
    itemName: string;
    specification: string;
    requestedQuantity: number;
  }>;
}

// 예정수량 계산을 위해 가공된 품목 단위 데이터
export interface PendingRequestItem {
  type: "INBOUND" | "OUTBOUND";
  status: "PENDING";
  itemCode: string;
  quantity: number;
}

export interface InventoryItem {
  id: number;
  name: string;
  sku: string;
  specification: string;
  quantity: number;
  inboundScheduled: number;
  outboundScheduled: number;
  location: string;
  status: string;
  lastUpdate: string;
}
