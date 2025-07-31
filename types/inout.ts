
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

export interface InOutRequest {
  orderId: number;
  type: "INBOUND" | "OUTBOUND";
  companyName: string;
  companyCode: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  expectedDate: string;
  createdAt: string;
  updatedAt: string;
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
