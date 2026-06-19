export type UserRole = 'ADMIN' | 'MANAGER' | 'HUMAN_RESOURCES' | 'OPERATOR' | 'EMPLOYEE';

export interface Role {
  id: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  active: boolean;
  roles: Role[];
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
