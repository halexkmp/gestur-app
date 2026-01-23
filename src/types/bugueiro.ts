export interface Bugueiro {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
}

export type PartnerCustomerShift = 'MORNING' | 'AFTERNOON';

export interface BugueiroClient {
  id: string;
  partner_id: string;
  sale_id: string;
  client_date: string;
  shift: PartnerCustomerShift;
}
