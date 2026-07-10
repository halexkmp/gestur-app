import {Loan} from "./loan.ts";

export enum PartnerType {
  BUSINESS = 'BUSINESS',
  BUGGYMAN = 'BUGGYMAN',
}

export type PartnerCustomerShift = 'MORNING' | 'AFTERNOON';

export interface PartnerCustomer {
  id: string;
  partner_id: string;
  sale_id: string;
  quantity: number;
  shift: PartnerCustomerShift;
}

export interface Partner {
  loans: Loan[] | null;
  id: string;
  name: string;
  pix_key: string | null;
  type: PartnerType;
  active: boolean;
  created_at: string;
}
