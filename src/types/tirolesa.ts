export type TirolesaAuditStatus = 'BALANCED' | 'UNEXPLAINED' | 'SOLD_ABOVE_DETECTED';

export type TirolesaJustificationType = 'TEST' | 'COURTESY' | 'OTHER';

export interface TirolesaJustification {
  id: string;
  quantity: number;
  type: TirolesaJustificationType;
  reason: string;
  created_by: { id: string; name: string };
  created_at: string;
}

export interface TirolesaAuditDay {
  date: string;
  descents_detected: number;
  descents_sold: number;
  descents_below_default_price: number;
  descents_justified: number;
  unexplained: number;
  sold_above_detected: number;
  sales_amount: number;
  estimated_unpaid_value: number;
  status: TirolesaAuditStatus;
  device_hours: number;
  clock_suspect_trips: number;
  sensor_warning: boolean;
  justifications: TirolesaJustification[];
}

export interface TirolesaDevice {
  id: string;
  name: string;
  active: boolean;
  last_seen_at: string | null;
  offline: boolean;
}

export interface TirolesaCreatedDevice {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  api_key: string;
}

export interface TirolesaProduct {
  id: string;
  product_id: string;
  product_name: string;
  units_per_descent: number;
}

export interface CreateJustificationRequest {
  audit_date: string;
  quantity: number;
  type: TirolesaJustificationType;
  reason: string;
}
