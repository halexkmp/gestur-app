export type UserRole = 'admin' | 'operator';

export interface Profile {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: any;
}
