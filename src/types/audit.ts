export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: any | null;
  new_data: any | null;
  user_id: string;
  created_at: string;
}
