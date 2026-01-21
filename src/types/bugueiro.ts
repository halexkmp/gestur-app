export interface Bugueiro {
  id: string;
  name: string;
  pix_key: string | null;
  active: boolean;
  created_at: string;
}

export interface BugueiroClient {
  id: string;
  bugueiro_id: string;
  sale_id: string;
  client_date: string;
  shift: 'manha' | 'tarde';
}
