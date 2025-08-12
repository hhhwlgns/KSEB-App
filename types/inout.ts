
import type { OrderStatus } from '../lib/order-status';

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
  status: string; // 한글 상태 문자열로 변경
  date: string;
  time: string;
  notes: string;
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
